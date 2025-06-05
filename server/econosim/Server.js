class Server {
    constructor(app) {
        this.app = app;
        this.clients = {};
        this.started = false;
        this.serverController = null;
        this.economies = [
            new Economy(this, "Clodolândia", "🏴‍☠️"),
            new Economy(this, "Jundiaí", "🎌"),
        ];
        this.tutorial = false;

        this.handleConnections();
    }

    startGame() {
        if (this.started) {
            console.log('Game already started');
            return;
        }

        this.started = true;
        this.tutorial = true;
        this.updateSync();
    }

    get state() {
        return {
            clients: Object.values(this.clients).map(client => ({
                id: client.id,
                nickname: client.nickname,
                role: client.role,
                inLobby: !this.started,
            })),
            economies: this.economies.map(economy => ({
                country: economy.country,
                flag: economy.flag,
                bank: {
                    players: Object.values(economy.banco.players).map(player => ({
                        id: player.id,
                        nickname: player.nickname,
                    })),
                },
                government: {
                    players: Object.values(economy.governo.players).map(player => ({
                        id: player.id,
                        nickname: player.nickname,
                    })),
                },
                pib: economy.pib,
                inflacao: economy.inflacao,
                juros: economy.juros,
                despesas: economy.despesas,
                receitas: economy.receitas,
                dividaPublica: economy.dividaPublica,
            })),
            started: this.started,
            tutorial: this.tutorial,
        }
    }

    addPlayer(client, economyIndex, role) {
        const economy = this.economies[economyIndex];
        if (economy) {
            economy.addPlayer(client, role);
        }
    }

    updateSync() {
        // Notify all clients about the updated state
        Object.values(this.clients).forEach(client => {
            client.state = {
                ...client.state,
                gameState: this.state,
            }
            client.sendState();
        });
        console.log('State synchronized with all clients:', this.state);

        if (this.serverController) {
            this.serverController.socket.emit('stateUpdate', this.state);
            console.log('State sent to server controller:', this.state);
        }
    }

    handleConnections() {
        //socket io middleware
        this.app.use((socket, next) => {
            const { nickname, role } = socket.handshake.auth;
            if (!nickname || isNaN(role)) {
                return next(new Error('Invalid nickname or role'));
            }
            socket.nickname = nickname;
            socket.role = role;
            next();
        });

        this.app.on('connection', (socket) => {
            const client = new Client(socket, this);
            this.clients[socket.id] = client;

            console.log('New client connected:', socket.id);

            this.addPlayer(client, 0, socket.role);

            
            this.updateSync();

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                delete this.clients[socket.id];
                client.entity.removePlayer(client);
                this.updateSync();
            });
        });

        this.app.of("/server").use((socket, next) => {
            if (this.serverController) {
                return next(new Error('Server controller already connected'));
            }
            next();
        });

        this.app.of("/server").on('connection', (socket) => {
            var controller = new ServerController(socket, this);

            this.serverController = controller;

            this.serverController.socket.emit('stateUpdate', this.state);

            socket.on("startGame", () => {
                this.startGame();
            });

            socket.on('disconnect', () => {
                console.log('Server controller disconnected:', socket.id);
                this.serverController = null;
                this.updateSync();
            });
        });
    }
}

class Economy {
    constructor(server, country, flag) {
        this.server = server;
        this.country = country; // Nome do país
        this.flag = flag;       // Emoji ou URL da bandeira

        this.banco = new Banco(this);
        this.governo = new Governo(this);

        this.pib = 100_000_000_000;
        this.inflacao = 0.04;
        this.juros = 0.05;
        this.despesas = 90_000_000_000;
        this.receitas = 95_000_000_000;
        this.dividaPublica = 1_000_000_000_000;
    }

    addPlayer(client, role) {
        if (role === 0) {
            this.banco.addPlayer(client);
        } else if (role === 1) {
            this.governo.addPlayer(client);
        }
    }
}

class Entity {
    constructor(economy) {
        this.economy = economy;
        this.players = {};
    }

    addPlayer(client) {
        this.players[client.id] = client;
        client.entity = this;
    }

    removePlayer(client) {
        delete this.players[client.id];
    }
}

class Banco extends Entity {
}

class Governo extends Entity {
}

class VoteInstance {
    constructor() {
        this.votes = {};
    }

    castVote(playerId, choice) {
        this.votes[playerId] = choice;
    }

    getResults() {
        const results = {};
        for (const [playerId, choice] of Object.entries(this.votes)) {
            results[playerId] = choice;
        }
        return results;
    }
}

class Client {
    constructor(socket, game) {
        this.socket = socket;
        this.game = game; // Reference to the game instance

        this.state = {
            inLobby: true, // Default state for the client
            gameState: game.state || {}, // Initialize with game state if available
        }
        this.handleMessages();
    }

    get id() {
        return this.socket.id;
    }

    firstSync() {
        // Send initial state to the client
        this.sendState();
    }

    get nickname() {
        return this.socket.nickname;
    }

    get role() {
        return this.socket.role;
    }

    updateState(state) {
        // Update the client state based on the received state
        this.state = { ...this.state, ...state };
        console.log('Client state updated:', this.state);
    }

    sendState() {
        // Send the current state to the client
        this.socket.emit('stateUpdate', this.state);
        console.log('State sent to client:', this.state);
    }

    handleMessages() {
        this.socket.on('message', (message) => {
            console.log('Received message:', message);
            // Handle the message here
        });
    }
}

class ServerController {
    constructor(socket, server) {
        this.socket = socket;
        this.server = server;

        this.handleMessages();
    }

    handleMessages() {

    }
}

module.exports = { Server };