const data = require('./data.json');
const Validators = require('./validators.js');
const SecurityLogger = require('./SecurityLogger.js');
const ServerHealthMonitor = require('./ServerHealthMonitor.js');

class Server {
    constructor(app) {
        this.app = app;
        this.clients = {};
        this.started = false;
        this.serverController = null; this.economies = [];
        this.securityLogger = new SecurityLogger(); // Inicializar logger de segurança
        this.healthMonitor = new ServerHealthMonitor(this); // Inicializar monitor de saúde        // Validar dados globais carregados
        try {
            if (!data || !data.globalEvents || !Array.isArray(data.globalEvents)) {
                console.warn('Invalid or missing global events data');
                this.globalPossibleEvents = [];
            } else {
                this.globalPossibleEvents = data.globalEvents.filter(globalEvent => {
                    const validation = Validators.validateGlobalEvent(globalEvent);
                    if (!validation.isValid) {
                        console.warn(`Invalid global event filtered out: ${globalEvent.name || 'Unknown'}`, validation.errors);
                        return false;
                    } return true;
                });
            }
        } catch (error) {
            console.error('Error validating global events:', error);
            this.securityLogger.trackCriticalError(error, 'global_events_validation');
            this.globalPossibleEvents = [];
        }

        let i = 0;
        if (data.countries && Array.isArray(data.countries)) {
            for (const economyData of data.countries) {
                try {
                    if (!economyData.name || !economyData.flag) {
                        console.warn(`Skipping invalid economy data at index ${i}`);
                        continue;
                    }

                    const economy = new Economy(this, i, economyData.name, economyData.flag);

                    // Validar dados da economia inicial
                    const validation = Validators.validateEconomyData(economy);
                    if (!validation.isValid) {
                        console.warn(`Economy ${economyData.name} has validation warnings:`, validation.errors);
                    }

                    this.economies.push(economy);
                    i++;
                } catch (error) {
                    console.error(`Error creating economy at index ${i}:`, error);
                }
            }
        }

        if (this.economies.length === 0) {
            console.error('No valid economies loaded! Server may not function properly.');
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
            return;
        }

        this.globalPossibleEvents = data.globalEvents || [];

        this.started = true;
        this.tutorial = true;
        this.updateSync();

        this.nextRound();
    }

    nextRound() {
        try {
            // Check if we've reached the maximum rounds (5)
            if (this.currentRound >= 5) {
                console.log('Game completed: Maximum rounds reached (5)');
                this.serverController?.emit('gameCompleted');
                return;
            }

            // Limpar round anterior se existir
            if (this.round && typeof this.round.cleanup === 'function') {
                this.round.cleanup();
            }

            this.serverController?.emit('nextRound', this.currentRound + 1);

            this.round = new Round(++this.currentRound, this, this.economies);
            this.healthMonitor.onNewRound(); // Registrar novo round no monitor de saúde
            this.round.start();

            this.updateSync();
        } catch (error) {
            console.error('Error starting next round:', error);
            this.healthMonitor.recordError('Failed to start next round', error);
        }
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
            votes: this.round ? this.round.votes : undefined,
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
    } handleConnections() {        //socket io middleware
        this.app.use((socket, next) => {
            try {
                const { nickname, role, economy } = socket.handshake.auth || {};
                // Validação robusta usando validadores
                const nicknameValidation = Validators.validateSocketInput(nickname, 'nickname');
                if (!nicknameValidation.isValid) {
                    this.securityLogger.trackInvalidRequest(null, socket.handshake.address, 'invalid_nickname');
                    return next(new Error(`Invalid nickname: ${nicknameValidation.errors.join(', ')}`));
                }

                const roleValidation = Validators.validateSocketInput(role, 'role');
                if (!roleValidation.isValid) {
                    this.securityLogger.trackInvalidRequest(null, socket.handshake.address, 'invalid_role');
                    return next(new Error(`Invalid role: ${roleValidation.errors.join(', ')}`));
                }

                const economyValidation = Validators.validateSocketInput(economy, 'economy');
                if (!economyValidation.isValid) {
                    this.securityLogger.trackInvalidRequest(null, socket.handshake.address, 'invalid_economy');
                    return next(new Error(`Invalid economy: ${economyValidation.errors.join(', ')}`));
                }

                // Sanitizar nickname
                socket.nickname = Validators.sanitizeString(nickname, 50);
                socket.role = parseInt(role);
                socket.economy = parseInt(economy);
                next();
            } catch (error) {
                console.error('Error in socket middleware:', error);
                this.securityLogger.trackCriticalError(error, 'socket_middleware');
                return next(new Error('Authentication failed'));
            }
        }); this.app.on('connection', (socket) => {
            try {
                // Rastrear conexão para monitoramento de segurança
                this.securityLogger.trackConnection(socket.handshake.address, socket.id);
                this.healthMonitor.onConnection(); // Registrar conexão no monitor de saúde

                const client = new Client(socket, this);

                // Validar se a economia existe
                const economyIndex = socket.economy % this.economies.length;
                if (!this.economies[economyIndex]) {
                    console.error(`Economy ${economyIndex} does not exist`);
                    this.securityLogger.trackAccessDenied(socket.handshake.address, 'invalid_economy_index', `economy_${economyIndex}`);
                    socket.disconnect();
                    return;
                } this.addPlayer(client, economyIndex, socket.role);
                this.clients[socket.id] = client;

                this.updateSync(); socket.on('disconnect', (reason) => {
                    try {
                        // Limpar timer de timeout
                        if (activityTimer) {
                            clearTimeout(activityTimer);
                        }

                        // Log desconexões anormais
                        if (reason !== 'client namespace disconnect' && reason !== 'transport close') {
                            this.securityLogger.trackAbnormalDisconnection(socket.id, socket.handshake.address, reason);
                        }

                        this.healthMonitor.onDisconnection(); // Registrar desconexão no monitor de saúde
                        delete this.clients[socket.id];
                        if (client.entity && typeof client.entity.removePlayer === 'function') {
                            client.entity.removePlayer(client);
                        }
                        this.updateSync();
                    } catch (error) {
                        console.error('Error handling client disconnect:', error);
                        this.securityLogger.trackCriticalError(error, 'client_disconnect');
                    }
                });                // Adicionar timeout para conexões inativas usando timer manual
                const timeoutDuration = 300000; // 5 minutos
                let activityTimer = setTimeout(() => {
                    this.securityLogger.trackAbnormalDisconnection(socket.id, socket.handshake.address, 'timeout');
                    socket.disconnect();
                }, timeoutDuration);                // Resetar timer a cada atividade do socket
                const resetTimer = () => {
                    clearTimeout(activityTimer);
                    activityTimer = setTimeout(() => {
                        this.securityLogger.trackAbnormalDisconnection(socket.id, socket.handshake.address, 'timeout');
                        socket.disconnect();
                    }, timeoutDuration);
                };

                // Monitorar atividade do socket para resetar timer
                socket.onAny(() => {
                    resetTimer();
                });

            } catch (error) {
                console.error('Error handling new connection:', error);
                this.securityLogger.trackCriticalError(error, 'new_connection');
                socket.disconnect();
            }
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
            }); socket.on('disconnect', () => {
                this.serverController = null;
                this.updateSync();
            });
        });
    } roundOptionSelect(client, optionIndex) {
        if (this.round) {
            this.round.onOptionSelected(client, optionIndex);
        }
    }    // Função para obter relatório de segurança
    getSecurityReport() {
        try {
            return this.securityLogger.getSecurityReport();
        } catch (error) {
            console.error('Error generating security report:', error);
            this.healthMonitor.recordError('Failed to generate security report', error);
            return { error: 'Failed to generate security report' };
        }
    }

    // Função para obter relatório de saúde do servidor
    getHealthReport() {
        try {
            return this.healthMonitor.getHealthReport();
        } catch (error) {
            console.error('Error generating health report:', error);
            return { error: 'Failed to generate health report' };
        }
    }

    // Função para limpeza de recursos do servidor
    cleanup() {
        try {
            // Limpar round atual
            if (this.round && typeof this.round.cleanup === 'function') {
                this.round.cleanup();
            }

            // Limpar logger de segurança
            if (this.securityLogger && typeof this.securityLogger.destroy === 'function') {
                this.securityLogger.destroy();
            }

            // Parar monitor de saúde
            if (this.healthMonitor && typeof this.healthMonitor.stop === 'function') {
                this.healthMonitor.stop();
            }

            // Desconectar todos os clientes
            Object.values(this.clients).forEach(client => {
                if (client.socket && typeof client.socket.disconnect === 'function') {
                    client.socket.disconnect();
                }
            }); console.log('Server cleanup completed');
        } catch (error) {
            console.error('Error during server cleanup:', error);
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

        this.taxaDeJuros = 0.1; // 10%
        this.consumoFamiliar = 10; // R$ 5 bi
        this.investimentoPrivado = 15; // R$ 7 bi
        this.gastosPublicos = 17; // R$ 8 bi
        this.ofertaMoeda = 3;     // R$ 3 bi
        this.nivelPrecos = 60; // Índice de preços (base 100)        
        this.demandaMoeda = 7;   // R$ 7 bi
        this.sensibilidadeInvestimentoAoJuros = 250; // Sensibilidade do investimento à taxa de juros
        this.sensibilidadeDaMoedaAosJuros = 250; // Sensibilidade da demanda de moeda aos juros (h) - REDUZIDO para LM mais íngreme
        this.sensibilidadeDaMoedaARenda = 20; // Sensibilidade da demanda de moeda à renda (k) - AUMENTADO para LM mais íngreme        
        this.score_factor = 1; // Fator de multiplicação do score
        this.score = 0;

        // Rastreamento de decisões
        this.decisions = {
            good: 0,    // Decisões com score_factor >= 1.0
            bad: 0,     // Decisões com score_factor < 0.8
            neutral: 0  // Decisões entre 0.8 e 1.0
        };
    }

    get pib() {
        // PIB real considera o efeito da taxa de juros no investimento
        const investimentoAjustado = this.investimentoPrivado - (this.sensibilidadeInvestimentoAoJuros * this.taxaDeJuros);
        return this.consumoFamiliar + investimentoAjustado + this.gastosPublicos;
    }

    // Fórmula IS: Y = C + (I - b*i) + G + (X - M)
    // Onde I = investimentoPrivado e b = sensibilidadeInvestimentoAoJuros
    calcularIS(i) {
        try {
            const consumoFamiliar = this.consumoFamiliar;
            const investimentoPrivado = this.investimentoPrivado;
            const gastosPublicos = this.gastosPublicos;
            const sensibilidadeInvestimentoAoJuros = this.sensibilidadeInvestimentoAoJuros;

            // Verificar valores válidos
            if (sensibilidadeInvestimentoAoJuros === 0) {
                console.warn('sensibilidadeInvestimentoAoJuros is zero in calcularIS');
                return consumoFamiliar + investimentoPrivado + gastosPublicos; // PIB simples
            }

            // Fórmula correta: Y = C + (I - b*i) + G
            const investimentoAjustado = investimentoPrivado - (sensibilidadeInvestimentoAoJuros * i);
            const result = consumoFamiliar + investimentoAjustado + gastosPublicos;

            if (!isFinite(result) || isNaN(result)) {
                console.warn('Invalid result in calcularIS');
                return consumoFamiliar + investimentoPrivado + gastosPublicos; // PIB simples
            }

            return result;
        } catch (error) {
            console.error('Error in calcularIS:', error);
            return this.consumoFamiliar + this.investimentoPrivado + this.gastosPublicos; // PIB simples
        }
    };    // Fórmula LM: (M/P) = k*Y - h*i => Y = (M/P + h*i) / k
    // Onde k = sensibilidadeDaMoedaARenda e h = sensibilidadeDaMoedaAosJuros
    calcularLM(i) {
        try {
            const ofertaMoeda = this.ofertaMoeda;
            const nivelPrecos = this.nivelPrecos;
            const demandaMoeda = this.demandaMoeda;
            const sensibilidadeDaMoedaAosJuros = this.sensibilidadeDaMoedaAosJuros;
            const sensibilidadeDaMoedaARenda = this.sensibilidadeDaMoedaARenda;

            // Verificar divisão por zero
            if (nivelPrecos === 0 || sensibilidadeDaMoedaARenda === 0) {
                console.warn('Division by zero detected in calcularLM');
                return this.pib; // Retornar PIB atual como fallback
            }

            // Fórmula correta: Y = (M/P + h*i) / k
            const ofertaRealMoeda = ofertaMoeda / nivelPrecos;
            const result = (ofertaRealMoeda + (sensibilidadeDaMoedaAosJuros * i)) / sensibilidadeDaMoedaARenda;

            if (!isFinite(result) || isNaN(result)) {
                console.warn('Invalid result in calcularLM');
                return this.pib; // Retornar PIB atual como fallback
            }

            return result;
        } catch (error) {
            console.error('Error in calcularLM:', error);
            return this.pib; // Retornar PIB atual como fallback
        }
    }; get taxaDeJurosEquilibrio() {
        try {
            // IS: Y = C + (I - b*i) + G
            // LM: Y = (M/P + h*i) / k
            //
            // Igualando IS = LM:
            // C + (I - b*i) + G = (M/P + h*i) / k
            // k * [C + I + G - b*i] = M/P + h*i
            // k*C + k*I + k*G - k*b*i = M/P + h*i
            // k*C + k*I + k*G - M/P = k*b*i + h*i
            // k*C + k*I + k*G - M/P = i*(k*b + h)
            // i = [k*C + k*I + k*G - M/P] / [k*b + h]

            const C = this.consumoFamiliar;
            const G = this.gastosPublicos;
            const I = this.investimentoPrivado;
            const b = this.sensibilidadeInvestimentoAoJuros;
            const k = this.sensibilidadeDaMoedaARenda;
            const h = this.sensibilidadeDaMoedaAosJuros;
            const M = this.ofertaMoeda;
            const P = this.nivelPrecos;

            // Verificar divisão por zero
            if (P === 0 || k === 0) {
                console.warn('Division by zero detected in taxaDeJurosEquilibrio calculation');
                return 0.1; // Taxa padrão segura
            }

            const denom = (k * b) + h;
            if (denom === 0) {
                console.warn('Denominator is zero in taxaDeJurosEquilibrio calculation');
                return 0.1; // Taxa padrão segura
            }

            const numer = (k * C) + (k * I) + (k * G) - (M / P);
            const iEquilibrio = numer / denom;

            // Validar resultado
            if (!isFinite(iEquilibrio) || isNaN(iEquilibrio)) {
                console.warn('Invalid result in taxaDeJurosEquilibrio calculation');
                return 0.1; // Taxa padrão segura
            }

            // Limitar taxa a valores realistas
            const result = Math.max(0.001, Math.min(1.0, iEquilibrio)); // Entre 0.1% e 100%
            return Number(result.toFixed(4));
        } catch (error) {
            console.error('Error calculating taxaDeJurosEquilibrio:', error);
            return 0.1; // Taxa padrão segura
        }
    }

    get pibEquilibrio() {
        // PIB de equilíbrio é o valor de Y quando a taxa de juros está em equilíbrio
        const iEquilibrio = this.taxaDeJurosEquilibrio;
        return this.calcularIS(iEquilibrio);
    }

    get distanciaIS() {
        return Math.abs(this.pib - this.calcularIS(this.taxaDeJuros));
    }

    get distanciaLM() {
        return Math.abs(this.pib - this.calcularLM(this.taxaDeJuros));
    }

    get state() {
        return {
            pib: this.pib,
            taxaDeJuros: this.taxaDeJuros,
            consumoFamiliar: this.consumoFamiliar,
            investimentoPrivado: this.investimentoPrivado,
            gastosPublicos: this.gastosPublicos,
            ofertaMoeda: this.ofertaMoeda,
            nivelPrecos: this.nivelPrecos,
            demandaMoeda: this.demandaMoeda, sensibilidadeInvestimentoAoJuros: this.sensibilidadeInvestimentoAoJuros,
            sensibilidadeDaMoedaAosJuros: this.sensibilidadeDaMoedaAosJuros,
            sensibilidadeDaMoedaARenda: this.sensibilidadeDaMoedaARenda,
            decisions: this.decisions,
        }
    }

    get ofertaRealMoeda() {
        return this.ofertaMoeda / this.nivelPrecos;
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
        }); Object.values(this.governo.players).forEach(player => {
            player.sendEvent(eventName, ...args);
        });
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
    constructor(optionsLength = 0) {
        this.votes = {};
        this.optionsLength = optionsLength;
    } castVote(playerId, choice) {
        try {
            // Validar playerId
            if (!playerId || typeof playerId !== 'string') {
                console.error('Invalid playerId in castVote');
                return;
            }

            if (choice === null || choice === undefined) {
                // Remove vote if choice is null
                delete this.votes[playerId];
                return;
            }

            // Validar choice
            if (typeof choice !== 'number' || isNaN(choice) || choice < 0 || choice >= this.optionsLength) {
                console.error('Invalid choice in castVote:', choice);
                return;
            }

            this.votes[playerId] = choice;
        } catch (error) {
            console.error('Error in castVote:', error);
        }
    } getResults() {
        try {
            // Obtém a contagem de votos
            const voteCounts = {};
            const votes = Object.values(this.votes || {});

            for (const choice of votes) {
                // Validar se choice é um número válido
                if (typeof choice !== 'number' || isNaN(choice)) {
                    continue; // Pular votos inválidos
                }

                if (!voteCounts[choice]) {
                    voteCounts[choice] = 0;
                }
                voteCounts[choice]++;
            }

            // Calcula a porcentagem de votos
            const totalVotes = votes.length;
            const votePercentages = {};

            if (totalVotes === 0) {
                return {}; // Retornar objeto vazio se não há votos
            }

            for (const [choice, count] of Object.entries(voteCounts)) {
                if (typeof count === 'number' && count > 0) {
                    votePercentages[choice] = ((count / totalVotes) * 100);
                }
            }

            return votePercentages;
        } catch (error) {
            console.error('Error in getResults:', error);
            return {};
        }
    } getResult() {
        try {
            // Obtém o resultado da votação
            const results = this.getResults();
            let maxVotes = -1;
            let winningChoice = null;

            // Validar se results é um objeto válido
            if (!results || typeof results !== 'object') {
                console.warn('Invalid results in getResult');
                return Math.floor(Math.random() * this.optionsLength);
            }

            for (const [choice, percentage] of Object.entries(results)) {
                if (typeof percentage === 'number' && percentage > maxVotes) {
                    maxVotes = percentage;
                    winningChoice = choice;
                }
            }

            // Se não houver votos, sorteia um resultado aleatório
            if (winningChoice === null) {
                const choices = Object.keys(this.votes || {});
                if (choices.length === 0) {
                    return Math.floor(Math.random() * Math.max(1, this.optionsLength)); // No votes cast
                }
                winningChoice = choices[Math.floor(Math.random() * choices.length)];
            }

            // Converter para número e validar
            const result = parseInt(winningChoice);
            if (isNaN(result) || result < 0 || result >= this.optionsLength) {
                console.warn('Invalid winning choice, returning random result');
                return Math.floor(Math.random() * Math.max(1, this.optionsLength));
            }

            return result;
        } catch (error) {
            console.error('Error in getResult:', error);
            return Math.floor(Math.random() * Math.max(1, this.optionsLength));
        }
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
    } sendEvent(eventName, ...args) {
        // Send an event to the client
        this.socket.emit(eventName, ...args);
    } updateState(state) {
        // Update the client state based on the received state
        this.state = { ...this.state, ...state };
    } sendState() {
        // Send the current state to the client
        this.socket.emit('stateUpdate', this.state);
    } handleMessages() {
        try {
            this.socket.on('roundOptionSelected', (option) => {
                try {
                    // Validar entrada usando validadores
                    const validation = Validators.validateSocketInput(option, 'roundOptionSelected');
                    if (!validation.isValid) {
                        console.error('Invalid option received:', validation.errors.join(', '));
                        this.game.securityLogger.trackInvalidRequest(this.socket.id, this.socket.handshake.address, 'invalid_round_option');
                        return;
                    }

                    this.game.roundOptionSelect(this, option);
                } catch (error) {
                    console.error('Error handling roundOptionSelected:', error);
                    this.game.securityLogger.trackCriticalError(error, 'round_option_selected');
                }
            });

            // Adicionar rate limiting para prevenir spam
            let lastMessageTime = 0;
            const messageDelay = 100; // 100ms entre mensagens

            this.socket.use((packet, next) => {
                const now = Date.now();
                if (now - lastMessageTime < messageDelay) {
                    console.warn('Rate limit exceeded for client:', this.socket.id);
                    return; // Ignorar mensagem
                }
                lastMessageTime = now;
                next();
            });

        } catch (error) {
            console.error('Error setting up message handlers:', error);
        }
    }
}

class ServerController {
    constructor(socket, server) {
        this.socket = socket;
        this.server = server;

        this.handleMessages();
    }
    handleMessages() {
        this.socket.on("nextRound", () => {
            if (this.server.round && !this.server.round.roundEnded) {
                console.warn("Cannot start next round while current round is still active");
                return;
            }
            this.server.nextRound();
        }); this.socket.on("roundEnd", () => {
            if (this.server.round && !this.server.round.roundEnded) {
                this.server.round.resolveRound();
            }
        });

        this.socket.on("endTutorial", () => {
            if (this.server.tutorial) {
                this.server.tutorial = false;
                this.server.updateSync();
            }
        });

        this.socket.on("endTutorial", () => {
            if (this.server.tutorial) {
                this.server.tutorial = false;
                this.server.updateSync();
                console.log("Tutorial ended by server controller");
            }
        });
    }

    emit(eventName, ...args) {
        // Emit an event to the server controller
        this.socket.emit(eventName, ...args);
    }
}

class Round {
    constructor(numRound = 1, server, economies) {
        this.numRound = numRound;
        this.server = server;
        this.economies = economies;
        this.roundEnded = false;
        this.votes = [];
        this.cleanupCallbacks = []; // Array para callbacks de limpeza
    }

    // Função para adicionar callbacks de limpeza
    addCleanupCallback(callback) {
        if (typeof callback === 'function') {
            this.cleanupCallbacks.push(callback);
        }
    }    // Função para limpeza de recursos
    cleanup() {
        try {
            // Executar callbacks de limpeza
            for (const callback of this.cleanupCallbacks) {
                try {
                    callback();
                } catch (error) {
                    console.error('Error in cleanup callback:', error);
                }
            }

            this.cleanupCallbacks = [];
        } catch (error) {
            console.error('Error during round cleanup:', error);
        }
    } onOptionSelected(client, optionIndex) {
        if (!client || !client.entity) {
            console.error('Invalid client or entity');
            return;
        }

        const entity = client.entity;

        try {
            const economy = client.entity.economy;
            if (!economy) {
                throw new Error('Client is not associated with an economy');
            } if (this.roundEnded) {
                return;
            }

            //Verificar se o cliente está no banco ou governo
            if (!economy.event) {
                return;
            }

            // Validar optionIndex
            if (!economy.event.options || !economy.event.options[entity.id]) {
                console.error('Invalid event options structure');
                return;
            }

            const availableOptions = economy.event.options[entity.id];
            if (!Array.isArray(availableOptions)) {
                console.error('Event options is not an array');
                return;
            } if (optionIndex < 0 || optionIndex >= availableOptions.length || optionIndex === null || optionIndex === undefined) {
                return entity.vote.castVote(client.id, null);
            }

            // Cliente é do governo ou banco
            const escolhaEntity = availableOptions[optionIndex];
            if (!escolhaEntity) {
                console.error("Invalid option selected");
                return;
            }

            entity.vote.castVote(client.id, optionIndex);
        } catch (e) {
            console.error('Error processing option selection:', e);
            return;
        } finally {
            try {
                if (entity && entity.vote && typeof entity.vote.getResults === 'function') {
                    entity.sendMessage("votes", entity.vote.getResults());
                }
            } catch (error) {
                console.error('Error sending vote results:', error);
            }
        }
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

        let pool = economiaAtual.possibleLocalEvents;

        if (pool.length === 0) return null;

        const index = Math.floor(Math.random() * pool.length);
        const evento = pool[index];
        const realIndex = economiaAtual.possibleLocalEvents.indexOf(evento);
        economiaAtual.possibleLocalEvents.splice(realIndex, 1); // Removes the event from the pool to avoid repetition
        return evento;
    }

    applyGlobalEvent() {
        try {
            if (!this.globalEvent || !this.globalEvent.impact) {
                return;
            }

            // Validar evento global antes de aplicar
            const validation = Validators.validateGlobalEvent(this.globalEvent);
            if (!validation.isValid) {
                console.error('Invalid global event detected during application:', validation.errors);
                return;
            } const impact = this.globalEvent.impact;

            // Validar se impact é um objeto válido
            if (typeof impact !== 'object' || impact === null) {
                console.error('Invalid global event impact structure');
                return;
            }

            for (const economy of this.economies) {
                if (!economy || typeof economy !== 'object') {
                    console.warn('Invalid economy found, skipping');
                    continue;
                }

                try {
                    // Aplicar impactos do evento global com escala reduzida
                    if (typeof impact.taxaDeJuros === 'number' && isFinite(impact.taxaDeJuros)) {
                        economy.taxaDeJuros += impact.taxaDeJuros * 0.1;
                    }
                    if (typeof impact.consumoFamiliar === 'number' && isFinite(impact.consumoFamiliar)) {
                        economy.consumoFamiliar += impact.consumoFamiliar;
                    }
                    if (typeof impact.investimentoPrivado === 'number' && isFinite(impact.investimentoPrivado)) {
                        economy.investimentoPrivado += impact.investimentoPrivado;
                    }
                    if (typeof impact.gastosPublicos === 'number' && isFinite(impact.gastosPublicos)) {
                        economy.gastosPublicos += impact.gastosPublicos;
                    }
                    if (typeof impact.ofertaMoeda === 'number' && isFinite(impact.ofertaMoeda)) {
                        economy.ofertaMoeda += impact.ofertaMoeda;
                    }
                    if (typeof impact.nivelPrecos === 'number' && isFinite(impact.nivelPrecos)) {
                        economy.nivelPrecos += impact.nivelPrecos;
                    }
                    if (typeof impact.demandaMoeda === 'number' && isFinite(impact.demandaMoeda)) {
                        economy.demandaMoeda += impact.demandaMoeda;
                    }

                    // Aplicar mudanças nas sensibilidades do evento global
                    if (typeof impact.sensibilidadeInvestimentoAoJuros_change === 'number' && isFinite(impact.sensibilidadeInvestimentoAoJuros_change)) {
                        economy.sensibilidadeInvestimentoAoJuros += impact.sensibilidadeInvestimentoAoJuros_change;
                    }
                    if (typeof impact.sensibilidadeInvestimentoAoJuros_factor === 'number' && isFinite(impact.sensibilidadeInvestimentoAoJuros_factor)) {
                        economy.sensibilidadeInvestimentoAoJuros *= impact.sensibilidadeInvestimentoAoJuros_factor;
                    }
                    if (typeof impact.sensibilidadeDaMoedaAosJuros_change === 'number' && isFinite(impact.sensibilidadeDaMoedaAosJuros_change)) {
                        economy.sensibilidadeDaMoedaAosJuros += impact.sensibilidadeDaMoedaAosJuros_change;
                    }
                    if (typeof impact.sensibilidadeDaMoedaAosJuros_factor === 'number' && isFinite(impact.sensibilidadeDaMoedaAosJuros_factor)) {
                        economy.sensibilidadeDaMoedaAosJuros *= impact.sensibilidadeDaMoedaAosJuros_factor;
                    }
                    if (typeof impact.sensibilidadeDaMoedaARenda_change === 'number' && isFinite(impact.sensibilidadeDaMoedaARenda_change)) {
                        economy.sensibilidadeDaMoedaARenda += impact.sensibilidadeDaMoedaARenda_change;
                    }
                    if (typeof impact.sensibilidadeDaMoedaARenda_factor === 'number' && isFinite(impact.sensibilidadeDaMoedaARenda_factor)) {
                        economy.sensibilidadeDaMoedaARenda *= impact.sensibilidadeDaMoedaARenda_factor;
                    }

                    // Aplicar restrições para manter realismo econômico
                    economy.demandaMoeda = Math.max(0.1, economy.demandaMoeda); // Mínimo de 0.1 bi
                    economy.ofertaMoeda = Math.max(0.1, economy.ofertaMoeda); // Mínimo de 0.1 bi
                    economy.nivelPrecos = Math.max(10, economy.nivelPrecos); // Mínimo índice 10
                    economy.consumoFamiliar = Math.max(1, economy.consumoFamiliar); // Mínimo 1 bi
                    economy.investimentoPrivado = Math.max(0, economy.investimentoPrivado); // Pode ser 0
                    economy.gastosPublicos = Math.max(1, economy.gastosPublicos); // Mínimo 1 bi

                    // Validar se as sensibilidades não ficaram com valores inválidos
                    economy.sensibilidadeInvestimentoAoJuros = Math.max(1, Math.min(10000, economy.sensibilidadeInvestimentoAoJuros)); economy.sensibilidadeDaMoedaAosJuros = Math.max(1, Math.min(10000, economy.sensibilidadeDaMoedaAosJuros));
                    economy.sensibilidadeDaMoedaARenda = Math.max(1, Math.min(10000, economy.sensibilidadeDaMoedaARenda));
                } catch (economyError) {
                    console.error(`Error applying global event to economy ${economy.country}:`, economyError);
                }
            }
        } catch (error) {
            console.error('Error in applyGlobalEvent:', error);
        }
        // Aplicar correções automáticas de ciclo econômico
        this.applyEconomicCycles();
    } 
    
    start() {
        this.globalEvent = this.server.getGlobalRandomEvent();

        // Aplicar impactos do evento global
        this.applyGlobalEvent();

        for (const economy of this.economies) {
            const evento = this.getLocalRandomEvent(economy);
            if (!evento) {
                console.warn(`No valid event found for economy ${economy.country}`);
                continue;
            }
            economy.event = evento;
            economy.banco.vote = new VoteInstance(
                evento.options[economy.banco.id].length
            ); economy.governo.vote = new VoteInstance(
                evento.options[economy.governo.id].length
            );
        }
    }

    resolveRound() {
        try {
            this.applyRound();
            this.server.updateSync();

            this.roundEnded = true;
            this.calculateScores();
            this.server.updateSync();
        } catch (error) {
            console.error('Error resolving round:', error);
            // Marcar round como terminado mesmo em caso de erro para evitar travamento
            this.roundEnded = true;
            this.server.updateSync();
        }
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
            if (rand <= acumulado) return {
                eventResult: o,
                option: {
                    banco: evento.options['banco'].find(opt => opt.id === escolhaBanco),
                    governo: evento.options['governo'].find(opt => opt.id === escolhaGoverno),
                }
            };
        }

        return {
            eventResult: possiveis[possiveis.length - 1],
            option: {
                banco: evento.options['banco'].find(opt => opt.id === escolhaBanco),
                governo: evento.options['governo'].find(opt => opt.id === escolhaGoverno),
            }
        }; // fallback
    }

    applyRound() {
        let i = -1;
        for (const economy of this.economies) {
            i++;
            const evento = economy.event;
            if (!evento) {
                console.warn(`No event to apply for economy ${economy.country}`);
                continue;
            }

            const bancoVote = evento.options['banco'][economy.banco.vote.getResult()].id;
            const governoVote = evento.options['governo'][economy.governo.vote.getResult()].id;

            const { eventResult, option } = this.resolveEvent(evento, bancoVote, governoVote);
            if (!eventResult) {
                console.warn(`No valid outcome found for event ${evento.name} in economy ${economy.country}`);
                continue;
            }

            this.votes[i] = {
                option,
                eventResult,
            }; const outcome = eventResult.impact;

            // Aplicação dos impactos com escala reduzida
            economy.taxaDeJuros += (outcome.taxaDeJuros ? outcome.taxaDeJuros * 0.1 : 0);
            economy.consumoFamiliar += (outcome.consumoFamiliar ? outcome.consumoFamiliar : 0);
            economy.investimentoPrivado += (outcome.investimentoPrivado ? outcome.investimentoPrivado : 0);
            economy.gastosPublicos += (outcome.gastosPublicos ? outcome.gastosPublicos : 0);
            economy.ofertaMoeda += (outcome.ofertaMoeda ? outcome.ofertaMoeda : 0);
            economy.nivelPrecos += (outcome.nivelPrecos ? outcome.nivelPrecos : 0);
            economy.demandaMoeda += (outcome.demandaMoeda ? outcome.demandaMoeda : 0);

            // Aplicar restrições para manter realismo econômico
            economy.demandaMoeda = Math.max(0.1, economy.demandaMoeda); // Mínimo de 0.1 bi
            economy.ofertaMoeda = Math.max(0.1, economy.ofertaMoeda); // Mínimo de 0.1 bi
            economy.nivelPrecos = Math.max(10, economy.nivelPrecos); // Mínimo índice 10
            economy.consumoFamiliar = Math.max(1, economy.consumoFamiliar); // Mínimo 1 bi
            economy.investimentoPrivado = Math.max(0, economy.investimentoPrivado); // Pode ser 0
            economy.gastosPublicos = Math.max(1, economy.gastosPublicos); // Mínimo 1 bi

            // Aplicar mudanças nas sensibilidades
            if (outcome.sensibilidadeInvestimentoAoJuros_change) {
                economy.sensibilidadeInvestimentoAoJuros += outcome.sensibilidadeInvestimentoAoJuros_change;
            }
            if (outcome.sensibilidadeInvestimentoAoJuros_factor) {
                economy.sensibilidadeInvestimentoAoJuros *= outcome.sensibilidadeInvestimentoAoJuros_factor;
            }
            if (outcome.sensibilidadeDaMoedaAosJuros_change) {
                economy.sensibilidadeDaMoedaAosJuros += outcome.sensibilidadeDaMoedaAosJuros_change;
            }
            if (outcome.sensibilidadeDaMoedaAosJuros_factor) {
                economy.sensibilidadeDaMoedaAosJuros *= outcome.sensibilidadeDaMoedaAosJuros_factor;
            }
            if (outcome.sensibilidadeDaMoedaARenda_change) {
                economy.sensibilidadeDaMoedaARenda += outcome.sensibilidadeDaMoedaARenda_change;
            }
            if (outcome.sensibilidadeDaMoedaARenda_factor) {
                economy.sensibilidadeDaMoedaARenda *= outcome.sensibilidadeDaMoedaARenda_factor;
            }            // Aplicar modificador de score do outcome
            if (outcome.score_factor) { // Changed from score_modifier
                economy.score_factor = outcome.score_factor;

                // Rastrear tipo de decisão baseado no score_factor com critérios refinados
                this.categorizeDecision(economy, eventResult, evento);
            }

            economy.outcome = eventResult;
        }
    }

    calculateScores() {
        // Calcular score para cada economia
        const maxDistanceLM = Math.max(...this.economies.map(e => e.distanciaLM));
        const maxDistanciaIS = Math.max(...this.economies.map(e => e.distanciaIS));

        for (const economy of this.economies) {
            const impact = economy.outcome ? economy.outcome.impact : {};

            console.log(`Calculating score for economy: ${economy.country}`);
            console.log(`Pib: ${economy.pib}, Taxa de Juros: ${economy.taxaDeJuros}`);
            console.log(`Distancia IS: ${economy.distanciaIS}, Distancia LM: ${economy.distanciaLM}`);
            console.log(`Score Factor: ${economy.score_factor}`);

            const scoreFactor = (this.globalEvent?.score_factor || 1) * economy.score_factor;

            // Análise do impacto econômico global
            const economicImpactScore = this.calculateEconomicImpactScore(impact);

            // Análise de sustentabilidade (evita extremos)
            const sustainabilityScore = this.calculateSustainabilityScore(economy, impact);

            // Score combinado (peso: 60% score_factor, 25% impacto econômico, 15% sustentabilidade)
            const combinedScoreFactor = (scoreFactor * 0.6) + (economicImpactScore * 0.25) + (sustainabilityScore * 0.15);

            // Componente base: reward por decisões boas
            const baseScore = 500 * combinedScoreFactor;

            // Penalidade por desequilíbrio IS-LM (normalizada entre 0-1)
            const distanciaISNormalizada = maxDistanciaIS > 0 ? economy.distanciaIS / maxDistanciaIS : 0;
            const distanciaLMNormalizada = maxDistanceLM > 0 ? economy.distanciaLM / maxDistanceLM : 0;

            // Penalidades proporcionais (máximo de 200 pontos cada)
            const penaltyIS = 0//Math.min(distanciaISNormalizada, 100);
            const penaltyLM = 0//Math.min(distanciaLMNormalizada * 100, 100);

            // Bonus por PIB saudável (entre 25-50)
            const pibBonus = 0//economy.pib >= 25 && economy.pib <= 50 ? 100 : 0;

            // Score final
            const score = Math.max(0, baseScore - penaltyIS - penaltyLM + pibBonus);

            console.log(`  Score Factor: ${combinedScoreFactor.toFixed(3)}`);
            console.log(`  Base Score: ${baseScore.toFixed(1)}`);
            console.log(`  IS Penalty: ${penaltyIS.toFixed(1)} (normalized: ${distanciaISNormalizada.toFixed(3)})`);
            console.log(`  LM Penalty: ${penaltyLM.toFixed(1)} (normalized: ${distanciaLMNormalizada.toFixed(3)})`);
            console.log(`  PIB Bonus: ${pibBonus}`);
            console.log(`  Final Score: ${score.toFixed(1)}`);

            economy.score += Math.floor(score);
        }

        // Aplicar correções automáticas de ciclo econômico
        this.applyEconomicCycles();
    }

    applyEconomicCycles() {
        for (const economy of this.economies) {
            try {
                const pibAtual = economy.pib;

                // Detectar superaquecimento (PIB muito alto)
                if (pibAtual > 60) {
                    console.log(`Economy ${economy.country} overheating (PIB: ${pibAtual}), applying cooling measures`);

                    // Pressões naturais de sobreaquecimento
                    economy.nivelPrecos += 1; // Inflação de demanda
                    economy.consumoFamiliar *= 0.96; // Redução do poder de compra
                    economy.investimentoPrivado *= 0.7; // Cautela dos investidores

                    // Aumentar sensibilidade aos juros (mercado mais volátil)
                    economy.sensibilidadeInvestimentoAoJuros *= 1.05;
                }

                // Detectar recessão prolongada (PIB muito baixo)
                else if (pibAtual < 25) {
                    console.log(`Economy ${economy.country} in recession (PIB: ${pibAtual}), applying natural recovery`);

                    // Forças naturais de recuperação
                    economy.nivelPrecos *= 0.99; // Pressão deflacionária
                    economy.demandaMoeda *= 0.98; // Menor demanda por liquidez

                    // Reduzir sensibilidade aos juros (mercado menos ativo)
                    economy.sensibilidadeInvestimentoAoJuros *= 0.98;
                }

                while (economy.pib < 0) {
                    console.log(`Economy ${economy.country} in deep recession (PIB: ${pibAtual}), applying emergency measures`);

                    economy.nivelPrecos += 5; // Aumentar preços para estimular consumo
                    economy.consumoFamiliar *= 1.05; // Aumentar consumo
                    economy.investimentoPrivado *= 1.1; // Estimular investimento privado
                    economy.gastosPublicos *= 1.2; // Aumentar gastos públicos para estimular a economia
                }



                // Aplicar mínimos e máximos para manter realismo
                economy.nivelPrecos = Math.max(10, Math.min(200, economy.nivelPrecos));
                economy.consumoFamiliar = Math.max(1, Math.min(100, economy.consumoFamiliar));
                economy.investimentoPrivado = Math.max(0, Math.min(80, economy.investimentoPrivado));
                economy.gastosPublicos = Math.max(1, Math.min(60, economy.gastosPublicos));
                economy.sensibilidadeInvestimentoAoJuros = Math.max(50, Math.min(500, economy.sensibilidadeInvestimentoAoJuros));

            } catch (error) {
                console.error(`Error applying economic cycles to ${economy.country}:`, error);
            }
        }
    }

    // Método para categorizar decisões com critérios econômicos refinados
    categorizeDecision(economy, outcome, evento) {
        const impact = outcome.impact;
        const scoreFactor = impact.score_factor;

        // Análise do impacto econômico global
        const economicImpactScore = this.calculateEconomicImpactScore(impact);

        // Análise de sustentabilidade (evita extremos)
        const sustainabilityScore = this.calculateSustainabilityScore(economy, impact);

        // Score combinado (peso: 60% score_factor, 25% impacto econômico, 15% sustentabilidade)
        const combinedScore = (scoreFactor * 0.6) + (economicImpactScore * 0.25) + (sustainabilityScore * 0.15);

        // Categorização refinada
        if (combinedScore >= 1) {
            economy.decisions.good++;
            console.log(`  ✅ DECISÃO BOA: Score combinado ${combinedScore.toFixed(3)} (${evento.name})`);
        } else if (combinedScore > 0.85) {
            economy.decisions.neutral++;
            console.log(`  ⚖️ DECISÃO NEUTRA: Score combinado ${combinedScore.toFixed(3)} (${evento.name})`);
        } else {
            economy.decisions.bad++;
            console.log(`  ❌ DECISÃO RUIM: Score combinado ${combinedScore.toFixed(3)} (${evento.name})`);
        }

        // Log detalhado para debugging
        console.log(`    Score Factor: ${scoreFactor.toFixed(3)}`);
        console.log(`    Economic Impact: ${economicImpactScore.toFixed(3)}`);
        console.log(`    Sustainability: ${sustainabilityScore.toFixed(3)}`);
    }

    // Calcula score do impacto econômico direto
    calculateEconomicImpactScore(impact) {
        let score = 1.0; // Score neutro base

        // Avaliar impactos positivos na economia real
        if (impact.consumoFamiliar && impact.consumoFamiliar > 0) score += 0.1;
        if (impact.investimentoPrivado && impact.investimentoPrivado > 0) score += 0.15;
        if (impact.gastosPublicos && impact.gastosPublicos > 0) score += 0.1;

        // Avaliar impactos negativos severos
        if (impact.consumoFamiliar && impact.consumoFamiliar < -2) score -= 0.2;
        if (impact.investimentoPrivado && impact.investimentoPrivado < -2) score -= 0.25;
        if (impact.nivelPrecos && impact.nivelPrecos > 5) score -= 0.15; // Inflação alta

        // Penalizar mudanças extremas na taxa de juros
        if (impact.taxaDeJuros) {
            const changePercent = Math.abs(impact.taxaDeJuros);
            if (changePercent > 0.05) score -= 0.1; // Mudança > 5%
            if (changePercent > 0.1) score -= 0.2;  // Mudança > 10%
        }

        // Bonificar políticas equilibradas
        const totalPositiveImpacts = [
            impact.consumoFamiliar > 0,
            impact.investimentoPrivado > 0,
            impact.gastosPublicos > 0
        ].filter(Boolean).length;

        if (totalPositiveImpacts >= 2) score += 0.1; // Política abrangente

        return Math.max(0, Math.min(2, score)); // Limitar entre 0 e 2
    }

    // Calcula score de sustentabilidade (evita extremos)
    calculateSustainabilityScore(economy, impact) {
        let score = 1.0; // Score neutro base
        const currentPIB = economy.pib;

        // Projetar PIB após impacto (simplificado)
        const projectedPIB = currentPIB + (impact.consumoFamiliar || 0) +
            (impact.investimentoPrivado || 0) + (impact.gastosPublicos || 0);

        // Bonificar decisões que mantêm PIB em zona saudável (25-50)
        if (projectedPIB >= 25 && projectedPIB <= 50) {
            score += 0.3;
        } else if (projectedPIB < 20 || projectedPIB > 60) {
            score -= 0.3; // Penalizar extremos
        }

        // Avaliar estabilidade de preços
        const projectedInflation = economy.nivelPrecos + (impact.nivelPrecos || 0);
        if (projectedInflation >= 50 && projectedInflation <= 80) {
            score += 0.2; // Inflação controlada
        } else if (projectedInflation > 100 || projectedInflation < 30) {
            score -= 0.3; // Inflação descontrolada ou deflação
        }

        // Penalizar políticas que podem causar instabilidade
        if (impact.ofertaMoeda && Math.abs(impact.ofertaMoeda) > 2) {
            score -= 0.2; // Mudanças drásticas na oferta de moeda
        }

        // Bonificar políticas anticíclicas
        if (currentPIB < 30 && impact.gastosPublicos > 0) {
            score += 0.15; // Estímulo fiscal em recessão
        }
        if (currentPIB > 45 && impact.gastosPublicos < 0) {
            score += 0.15; // Contenção fiscal em aquecimento
        }

        return Math.max(0, Math.min(2, score)); // Limitar entre 0 e 2
    }

    // ...existing code...
}

module.exports = { Server, Economy };