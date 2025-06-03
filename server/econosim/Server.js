class Server {
    constructor(app) {
        this.app = app;
        this.clients = {};
        this.started = false;

        this.handleConnections();
    }

    get state() {
        return {
            clients: Object.values(this.clients).map(client => ({
                nickname: client.nickname,
                role: client.role,
                inLobby: client.state.inLobby,
            })),
            started: this.started
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
    }

    handleConnections() {
        //socket io middleware
        this.app.use((socket, next) => {
            const {nickname, role} = socket.handshake.auth;
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

            this.updateSync();

            console.log('New client connected:', socket.id);
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                delete this.clients[socket.id];
            });
        });
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

module.exports = { Server };