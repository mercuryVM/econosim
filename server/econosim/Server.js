const data = require('./data.json');
console.log('Data loaded:', data);

class Server {
    constructor(app) {
        this.app = app;
        this.clients = {};
        this.started = false;
        this.serverController = null;
        this.economies = [

        ];
        this.globalPossibleEvents = data.globalEvents || [];

        let i = 0;
        for (const economyData of data.countries) {
            const economy = new Economy(this, i, economyData.name, economyData.flag);
            this.economies.push(economy);
            i++;
        }


        this.tutorial = false;
        this.currentRound = 0;

        this.handleConnections();
    }

    getGlobalRandomEvent() {
        if (this.globalPossibleEvents.length === 0) return null;

        const index = Math.floor(Math.random() * this.globalPossibleEvents.length);
        const event = this.globalPossibleEvents[index];

        // Remove the event from the pool to avoid repetition
        this.globalPossibleEvents.splice(index, 1);

        return event;
    }

    startGame() {
        if (this.started) {
            console.log('Game already started');
            return;
        }

        this.globalPossibleEvents = data.globalEvents || [];

        this.started = true;
        this.tutorial = true;
        this.updateSync();

        this.nextRound();
    }

    nextRound() {
        this.round = new Round(++this.currentRound, this, this.economies);
        this.round.start();
        console.log('New round started:', this.round.numRound);

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
                banco: {
                    players: Object.values(economy.banco.players).map(player => ({
                        id: player.id,
                        nickname: player.nickname,
                    })),
                },
                governo: {
                    players: Object.values(economy.governo.players).map(player => ({
                        id: player.id,
                        nickname: player.nickname,
                    })),
                },
                stats: economy.state,
                event: economy.event ? {
                    name: economy.event.name,
                    description: economy.event.description,
                    options: economy.event.options,
                    impacts: economy.event.impacts,
                    asset: economy.event.asset,
                    goodEvent: economy.event.goodEvent,
                } : null,
                score: economy.score
            })),
            started: this.started,
            tutorial: this.tutorial,
            round: this.round ? this.round.getState() : null,
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

        if (this.serverController) {
            this.serverController.socket.emit('stateUpdate', this.state);
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

            this.addPlayer(client, Object.keys(this.clients).length % this.economies.length, socket.role);


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

    roundOptionSelect(client, optionIndex) {
        if (this.round) {
            this.round.onOptionSelected(client, optionIndex);
        }
    }
}

class Economy {
    constructor(server, id, country, flag) {
        this.server = server;
        this.id = id;           // Identificador único da economia
        this.country = country; // Nome do país
        this.flag = flag;       // Emoji ou URL da bandeira

        this.possibleLocalEvents = data.countries[id].events || [];
        this.banco = new Banco(this);
        this.governo = new Governo(this);

        this.taxaDeJuros = 0.1;
        this.consumoFamiliar = 0.5;
        this.investimentoPrivado = 1.2;
        this.gastosPublicos = 0.8;
        this.ofertaMoeda = 0.1;     // Ajustado para cruzar com LM
        this.nivelPrecos = 1.2;
        this.demandaMoeda = 0.1;   // Opcional, só se for exibido
        this.sensibilidadeInvestimentoAoJuros = 5; // Sensibilidade da demanda de moeda à taxa de juros
        this.sensibilidadeDaMoedaAosJuros = 0.9; // Sensibilidade da oferta de moeda à taxa de juros
        this.sensibilidadeDaMoedaARenda = 1; // Sensibilidade da oferta de moeda à renda

        this.score = 0;

    }

    get state() {
        return {
            taxaDeJuros: this.taxaDeJuros,
            consumoFamiliar: this.consumoFamiliar,
            investimentoPrivado: this.investimentoPrivado,
            gastosPublicos: this.gastosPublicos,
            ofertaMoeda: this.ofertaMoeda,
            nivelPrecos: this.nivelPrecos,
            demandaMoeda: this.demandaMoeda,
            sensibilidadeInvestimentoAoJuros: this.sensibilidadeInvestimentoAoJuros,
            sensibilidadeDaMoedaAosJuros: this.sensibilidadeDaMoedaAosJuros,
            sensibilidadeDaMoedaARenda: this.sensibilidadeDaMoedaARenda,
        }
    }

    get ofertaRealMoeda() {
        return this.ofertaMoeda / this.nivelPrecos;
    }

    get pib() {
        return (this.consumoFamiliar + this.investimentoPrivado + this.gastosPublicos + (this.exportacoes - this.importacoes));
    }

    get demandaAgregada() {
        return this.consumoFamiliar * (this.investimentoPrivado + this.gastosPublicos + (this.exportacoes - this.importacoes));
    }

    get demandaMoedaAjustada() {
        return this.demandaMoeda - (this.taxaDeJuros * 100_000);
    }

    addPlayer(client, role) {
        if (role === 0) {
            this.banco.addPlayer(client);
        } else if (role === 1) {
            this.governo.addPlayer(client);
        }
    }

    sendEvent(eventName, ...args) {
        // Send an event to all players in the economy
        Object.values(this.banco.players).forEach(player => {
            player.sendEvent(eventName, ...args);
        });
        Object.values(this.governo.players).forEach(player => {
            player.sendEvent(eventName, ...args);
        });
        //console.log(`Event ${eventName} sent to all players in economy ${this.country}`);
    }
}

class Entity {
    constructor(economy, name) {
        this.economy = economy;
        this.name = name;
        this.players = {};
        this.vote = new VoteInstance();
    }

    get id() {
        return this.name.toLowerCase();
    }

    addPlayer(client) {
        this.players[client.id] = client;
        client.entity = this;
    }

    removePlayer(client) {
        delete this.players[client.id];
    }

    sendMessage(eventName, ...args) {
        // Send a message to all players in this entity
        Object.values(this.players).forEach(player => {
            player.sendEvent(eventName, ...args);
        });
        //console.log(`Message ${eventName} sent to all players in entity ${this.name}`);
    }
}

class Banco extends Entity {
    constructor(economy) {
        super(economy, 'Banco');
    }
}

class Governo extends Entity {
    constructor(economy) {
        super(economy, 'Governo');
    }
}

class VoteInstance {
    constructor(options) {
        this.votes = {};
    }

    castVote(playerId, choice) {
        if (choice === null) {
            // Remove vote if choice is null
            delete this.votes[playerId];
            return;
        }

        this.votes[playerId] = choice;
    }

    getResults() {
        // Obtém a contagem de votos
        const voteCounts = {};
        const votes = Object.values(this.votes);
        for (const choice of votes) {
            if (!voteCounts[choice]) {
                voteCounts[choice] = 0;
            }
            voteCounts[choice]++;
        }

        // Calcula a porcentagem de votos
        const totalVotes = votes.length;
        const votePercentages = {};
        for (const [choice, count] of Object.entries(voteCounts)) {
            votePercentages[choice] = ((count / totalVotes) * 100);
        }

        return votePercentages;
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

    set state(param1) {
        this._state = param1;
    }

    get state() {
        return {
            ...this._state,
            round: this.game && this.game.round ? this.game.round.getState(this) : null,
            myEconomyIndex: this.entity && this.entity.economy ? this.entity.economy.id : null,
            myEntityIndex: this.entity ? this.entity.id : null,
        }
    }

    set entity(param1) {
        this._entity = param1;
        this.updateState({
            entity: {
                name: this._entity.name,
                id: this._entity.name.toLowerCase(),
            },
            economy: {
                country: this._entity.economy.country,
                flag: this._entity.economy.flag,
            }
        })
    }

    get entity() {
        return this._entity;
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

    sendEvent(eventName, ...args) {
        // Send an event to the client
        this.socket.emit(eventName, ...args);
        //console.log(`Event ${eventName} sent to client ${this.id} with args:`, args);
    }

    updateState(state) {
        // Update the client state based on the received state
        this.state = { ...this.state, ...state };
        //console.log('Client state updated:', this.state);
    }

    sendState() {
        // Send the current state to the client
        this.socket.emit('stateUpdate', this.state);
        //console.log('State sent to client:', this.state);
    }

    handleMessages() {
        this.socket.on('roundOptionSelected', (option) => {
            this.game.roundOptionSelect(this, option);
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

    emit(eventName, ...args) {
        // Emit an event to the server controller
        this.socket.emit(eventName, ...args);
        console.log(`Event ${eventName} emitted with args:`, args);
    }
}

class Round {
    constructor(numRound = 1, server, economies) {
        this.numRound = numRound;
        this.server = server;
        this.economies = economies;
        this.roundEnded = false;
    }

    onOptionSelected(client, optionIndex) {
        if (!client || !client.entity) {
            console.error('Invalid client or entity');
            return;
        }

        const entity = client.entity;

        const economy = client.entity.economy;
        if (!economy) {
            console.error('Client is not associated with an economy');
            return;
        }

        if (this.roundEnded) {
            console.warn('Round has already ended, ignoring option selection');
            return;
        }

        //Verificar se o cliente está no banco ou governo
        if (!economy.event) {
            console.error('No event to resolve');
            return;
        }

        console.log(entity.id)

        if (optionIndex < 0 || optionIndex >= economy.event.options[entity.id].length || optionIndex === null) {
            return entity.vote.castVote(client.id, null);
        }

        // Cliente é do governo
        const escolhaGoverno = economy.event.options[entity.id][optionIndex];
        if (!escolhaGoverno) {
            throw "Invalid option selected";
        }

        entity.vote.castVote(client.id, optionIndex);

        entity.sendMessage("votes", entity.vote.getResults());
    }

    getLocalRandomEvent(economiaAtual) {
        // Função auxiliar para avaliar condições do evento com base no estado atual
        function checkConditions(conditions = [], economia) {
            return conditions.every(cond => {
                const { variable, operator, value } = cond;
                const atual = economia[variable];

                switch (operator) {
                    case "<": return atual < value;
                    case ">": return atual > value;
                    case "<=": return atual <= value;
                    case ">=": return atual >= value;
                    case "==": return atual === value;
                    case "!=": return atual !== value;
                    default: return false;
                }
            });
        }

        let pool = economiaAtual.possibleLocalEvents.filter(evento => {
            // Verifica se o evento tem condições e se elas são atendidas
            // Se não tiver condições, sempre retorna true
            // Se tiver condições, verifica se todas são atendidas
            return !evento.conditions || checkConditions(evento.conditions, economiaAtual);
        });

        if (pool.length === 0) return null;

        const index = Math.floor(Math.random() * pool.length);
        const evento = pool[index];
        economiaAtual.possibleLocalEvents.splice(index, 1); // Remove o evento do pool para não repetir
        return evento;
    }

    start() {
        this.globalEvent = this.server.getGlobalRandomEvent();
        console.log(`Global event selected for round ${this.numRound}:`, this.globalEvent ? this.globalEvent.name : 'None');

        for (const economy of this.economies) {
            const evento = this.getLocalRandomEvent(economy);
            if (!evento) {
                console.warn(`No valid event found for economy ${economy.country}`);
                continue;
            }
            economy.event = evento;
            console.log(`Event selected for economy ${economy.country}:`, evento.name);
        }

        this.startTimer(10);
    }

    startTimer(seconds = 90) {
        this.server.serverController.emit('timeUpdate', seconds);

        this.timer = setInterval(() => {
            seconds--;
            this.server.serverController.emit('timeUpdate', seconds);
            if (seconds <= 0) {
                clearInterval(this.timer);
                this.resolveRound();
            } else {
                console.log(`Time remaining: ${seconds} seconds`);
            }
        }, 1000);
    }

    resolveRound() {
        this.roundEnded = true;
        this.server.updateSync();
    }

    getState(client) {
        const entity = client && client.entity ? client.entity : null;
        const economy = entity ? entity.economy : null;
        const economyEvent = economy ? economy.event : null;
        return {
            numRound: this.numRound,
            event: economyEvent ? {
                name: economyEvent.name,
                description: economyEvent.description,
                options: economyEvent.options,
                impacts: economyEvent.impacts,
                asset: economyEvent.asset,
                goodEvent: economyEvent.goodEvent,
            } : null,
            roundEnded: this.roundEnded,
            globalEvent: this.globalEvent ? {
                name: this.globalEvent.name,
                description: this.globalEvent.description,
                impact: this.globalEvent.impact,
                asset: this.globalEvent.asset,
                goodEvent: this.globalEvent.goodEvent,
            } : null,
        };
    }

    resolveEvent(evento, escolhaBanco, escolhaGoverno) {
        const possiveis = evento.outcomes.filter(o =>
            o.combo.includes(escolhaBanco) && o.combo.includes(escolhaGoverno)
        );

        if (possiveis.length === 0) return null;

        // Sorteia com base na chance
        const rand = Math.random();
        let acumulado = 0;

        for (const o of possiveis) {
            acumulado += o.chance;
            if (rand <= acumulado) return o;
        }

        return possiveis[possiveis.length - 1]; // fallback
    }

    calcularPontuacao(impact) {
        return (
            (impact.investimentoPrivado || 0) / 1000 +
            (impact.consumoFamiliar || 0) / 1000 +
            (impact.gastosPublicos || 0) / 1000 -
            ((impact.taxaJuros || 0) * 5) +
            (impact.ofertaMoeda || 0) / 10000 -
            (impact.demandaMoeda || 0) / 10000 -
            ((impact.nivelPrecos || 0) * 100) +
            (impact.exportacoes || 0) / 1000 -
            (impact.importacoes || 0) / 1000
        );
    }


    applyRound() {
        //Aplicar as mudanças do round na economia
    }
}

module.exports = { Server };