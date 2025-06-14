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
        this.serverController?.emit('nextRound', this.currentRound + 1);

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
    }

    handleConnections() {
        //socket io middleware
        this.app.use((socket, next) => {
            const { nickname, role, economy } = socket.handshake.auth;
            if (!nickname || isNaN(role) || isNaN(economy)) {
                return next(new Error('Invalid nickname, role or economy'));
            }
            socket.nickname = nickname;
            socket.role = role;
            socket.economy = economy;
            next();
        });

        this.app.on('connection', (socket) => {
            const client = new Client(socket, this);

            this.addPlayer(client, socket.economy % this.economies.length, socket.role);


            this.clients[socket.id] = client;

            console.log('New client connected:', socket.id);

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

        this.taxaDeJuros = 0.1; // 10%
        this.consumoFamiliar = 20; // R$ 20 bi
        this.investimentoPrivado = 15; // R$ 15 bi
        this.gastosPublicos = 30; // R$ 30 bi
        this.ofertaMoeda = 3;     // R$ 3 bi
        this.nivelPrecos = 60; // Índice de preços (base 100)
        this.demandaMoeda = 7;   // R$ 7 bi
        this.sensibilidadeInvestimentoAoJuros = 250; // Sensibilidade da demanda de moeda à taxa de juros
        this.sensibilidadeDaMoedaAosJuros = 200; // Sensibilidade da oferta de moeda à taxa de juros
        this.sensibilidadeDaMoedaARenda = 12; // Sensibilidade da oferta de moeda à renda

        this.score_factor = 1; // Fator de multiplicação do score
        this.score = 0;
    }

    get pib() {
        return (this.consumoFamiliar + this.investimentoPrivado + this.gastosPublicos);
    }

    // Fórmula IS: Y = C + (I - b*i) + G + (X - M)
    calcularIS(i) {
        const consumoFamiliar = this.consumoFamiliar;
        const investimentoPrivado = this.investimentoPrivado;
        const gastosPublicos = this.gastosPublicos;
        const sensibilidadeInvestimentoAoJuros = this.sensibilidadeInvestimentoAoJuros;

        return consumoFamiliar * (((gastosPublicos + investimentoPrivado) / sensibilidadeInvestimentoAoJuros) - i);
    };

    // Fórmula LM: (M/P) = kY - h*i => Y = (M/P + h*i) / k
    calcularLM(i) {
        const ofertaMoeda = this.ofertaMoeda;
        const nivelPrecos = this.nivelPrecos;
        const demandaMoeda = this.demandaMoeda;
        const sensibilidadeDaMoedaAosJuros = this.sensibilidadeDaMoedaAosJuros;
        const sensibilidadeDaMoedaARenda = this.sensibilidadeDaMoedaARenda;

        return (
            ((sensibilidadeDaMoedaAosJuros / sensibilidadeDaMoedaARenda) * i) - ((1 / sensibilidadeDaMoedaARenda) * (demandaMoeda - (ofertaMoeda / nivelPrecos)))
        )
    };

    get taxaDeJurosEquilibrio() {
        // IS: Y = C * (((G + I) / b) - i)
        // LM: Y = ((k/h) * i) - ((1/h) * (L - (M/P)))
        //
        // Igualando:
        // C * (((G + I) / b) - i) = ((k/h) * i) - ((1/h) * (L - (M/P)))
        //
        // Isolando i:
        // C * ((G + I)/b) - C*i = (k/h)*i - (1/h)*(L - (M/P))
        // C * ((G + I)/b) + (1/h)*(L - (M/P)) = (k/h)*i + C*i
        // C * ((G + I)/b) + (1/h)*(L - (M/P)) = i * (k/h + C)
        // i = [C * ((G + I)/b) + (1/h)*(L - (M/P))] / [ (k/h) + C ]
        const C = this.consumoFamiliar;
        const G = this.gastosPublicos;
        const I = this.investimentoPrivado;
        const b = this.sensibilidadeInvestimentoAoJuros;
        const k = this.sensibilidadeDaMoedaAosJuros;
        const h = this.sensibilidadeDaMoedaARenda;
        const L = this.demandaMoeda;
        const M = this.ofertaMoeda;
        const P = this.nivelPrecos;
        const denom = (k / h) + C;
        const numer = C * ((G + I) / b) + (1 / h) * (L - (M / P));
        const iEquilibrio = numer / denom;
        return Number(iEquilibrio.toFixed(4));
    }

    get pibEquilibrio() {
        // PIB de equilíbrio é o valor de Y quando a taxa de juros está em equilíbrio
        const iEquilibrio = this.taxaDeJurosEquilibrio;
        return this.calcularIS(iEquilibrio);
    }

    get distanciaIS() {
        return Math.abs(this.pib / 100 - this.calcularIS(this.taxaDeJuros));
    }

    get distanciaLM() {
        return Math.abs(this.pib / 100 - this.calcularLM(this.taxaDeJuros));
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
            demandaMoeda: this.demandaMoeda,
            sensibilidadeInvestimentoAoJuros: this.sensibilidadeInvestimentoAoJuros,
            sensibilidadeDaMoedaAosJuros: this.sensibilidadeDaMoedaAosJuros,
            sensibilidadeDaMoedaARenda: this.sensibilidadeDaMoedaARenda,
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
    constructor(optionsLength = 0) {
        this.votes = {};
        this.optionsLength = optionsLength;
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

    getResult() {
        // Obtém o resultado da votação
        const results = this.getResults();
        let maxVotes = -1;
        let winningChoice = null;

        for (const [choice, percentage] of Object.entries(results)) {
            if (percentage > maxVotes) {
                maxVotes = percentage;
                winningChoice = choice;
            }
        }

        // Se não houver votos, sorteia um resultado aleatório
        if (winningChoice === null) {
            const choices = Object.keys(this.votes);
            if (choices.length === 0) {
                return Math.floor(Math.random() * this.optionsLength); // No votes cast
            }
            winningChoice = choices[Math.floor(Math.random() * choices.length)];
        }

        return winningChoice;
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
        this.socket.on("startTimer", () => {
            this.server.round?.startTimer(3) || console.warn("No round to start timer for");
        })

        this.socket.on("nextRound", () => {
            if (this.server.round && !this.server.round.roundEnded) {
                console.warn("Cannot start next round while current round is still active");
                return;
            }
            this.server.nextRound();
        });
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
        this.votes = [];
    }

    onOptionSelected(client, optionIndex) {
        if (!client || !client.entity) {
            console.error('Invalid client or entity');
            return;
        }

        const entity = client.entity;

        try {
            const economy = client.entity.economy;
            if (!economy) {
                throw new Error('Client is not associated with an economy');
            }

            if (this.roundEnded) {
                throw ('Round has already ended, ignoring option selection');
                return;
            }

            //Verificar se o cliente está no banco ou governo
            if (!economy.event) {
                throw ('No event to resolve');
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
        } catch (e) {
            console.error('Error processing option selection:', e);
            return;
        } finally {
            entity.sendMessage("votes", entity.vote.getResults());
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
        economiaAtual.possibleLocalEvents.splice(realIndex, 1); // Remove o evento do pool para não repetir
        return evento;
    }        applyGlobalEvent() {
        if (!this.globalEvent || !this.globalEvent.impact) {
            console.log('No global event or impact to apply');
            return;
        }

        const impact = this.globalEvent.impact;
        console.log(`Applying global event impact: ${this.globalEvent.name}`, impact);

        for (const economy of this.economies) {
            // Aplicar impactos do evento global com escala reduzida
            if (impact.taxaDeJuros) economy.taxaDeJuros += impact.taxaDeJuros * 0.01;
            if (impact.consumoFamiliar) economy.consumoFamiliar += impact.consumoFamiliar;
            if (impact.investimentoPrivado) economy.investimentoPrivado += impact.investimentoPrivado;
            if (impact.gastosPublicos) economy.gastosPublicos += impact.gastosPublicos;
            if (impact.ofertaMoeda) economy.ofertaMoeda += impact.ofertaMoeda;
            if (impact.nivelPrecos) economy.nivelPrecos += impact.nivelPrecos;
            if (impact.demandaMoeda) economy.demandaMoeda += impact.demandaMoeda;

            // Aplicar mudanças nas sensibilidades do evento global
            if (impact.sensibilidadeInvestimentoAoJuros_change) {
                economy.sensibilidadeInvestimentoAoJuros += impact.sensibilidadeInvestimentoAoJuros_change;
            }
            if (impact.sensibilidadeInvestimentoAoJuros_factor) {
                economy.sensibilidadeInvestimentoAoJuros *= impact.sensibilidadeInvestimentoAoJuros_factor;
            }
            if (impact.sensibilidadeDaMoedaAosJuros_change) {
                economy.sensibilidadeDaMoedaAosJuros += impact.sensibilidadeDaMoedaAosJuros_change;
            }
            if (impact.sensibilidadeDaMoedaAosJuros_factor) {
                economy.sensibilidadeDaMoedaAosJuros *= impact.sensibilidadeDaMoedaAosJuros_factor;
            }
            if (impact.sensibilidadeDaMoedaARenda_change) {
                economy.sensibilidadeDaMoedaARenda += impact.sensibilidadeDaMoedaARenda_change;
            }
            if (impact.sensibilidadeDaMoedaARenda_factor) {
                economy.sensibilidadeDaMoedaARenda *= impact.sensibilidadeDaMoedaARenda_factor;
            }

            // Aplicar restrições para manter realismo econômico
            economy.demandaMoeda = Math.max(0.1, economy.demandaMoeda); // Mínimo de 0.1 bi
            economy.ofertaMoeda = Math.max(0.1, economy.ofertaMoeda); // Mínimo de 0.1 bi
            economy.nivelPrecos = Math.max(10, economy.nivelPrecos); // Mínimo índice 10
            economy.consumoFamiliar = Math.max(1, economy.consumoFamiliar); // Mínimo 1 bi
            economy.investimentoPrivado = Math.max(0, economy.investimentoPrivado); // Pode ser 0
            economy.gastosPublicos = Math.max(1, economy.gastosPublicos); // Mínimo 1 bi

            console.log(`Global event impact applied to economy ${economy.country}`);
        }
    }
    
    start() {
        this.globalEvent = this.server.getGlobalRandomEvent();
        console.log(`Global event selected for round ${this.numRound}:`, this.globalEvent ? this.globalEvent.name : 'None');

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
            );

            economy.governo.vote = new VoteInstance(
                evento.options[economy.governo.id].length
            );

            console.log(`Event selected for economy ${economy.country}:`, evento.name);
        }
    }

    startTimer(seconds = 90) {
        if (this.timer) return console.warn("Timer already running");

        this.server.serverController.emit('timeUpdate', seconds);

        this.timer = setInterval(() => {
            seconds--;
            this.server.serverController?.emit('timeUpdate', seconds);
            if (seconds <= 0) {
                clearInterval(this.timer);
                this.timer = null;
                this.resolveRound();
            } else {
                console.log(`Time remaining: ${seconds} seconds`);
            }
        }, 1000);
    }

    resolveRound() {
        this.applyRound();
        this.server.updateSync();

        this.roundEnded = true;
        this.calculateScores();
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
            };

            const outcome = eventResult.impact;

            console.log(`Applying outcome for economy ${economy.country}:`, outcome);

            // Aplicação dos impactos com escala reduzida
            economy.taxaDeJuros += (outcome.taxaDeJuros ? outcome.taxaDeJuros * 0.01 : 0);
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
            }

            // Aplicar modificador de score do outcome
            if (outcome.score_factor) { // Changed from score_modifier
                economy.score_factor = outcome.score_factor;
            }
        }
    }

    calculateScores() {
        // Calcular score para cada economia

        const k = 500;
        const scaleFactor = 2;

        for (const economy of this.economies) {


            const score = Math.max(0, 1000 - (Math.min(economy.distanciaIS, scaleFactor) * k / scaleFactor) - (Math.min(economy.distanciaLM, scaleFactor) * k / scaleFactor));
            economy.score += Math.floor(score * economy.score_factor * (this.globalEvent?.score_factor || 1));
            console.log(`Score for economy ${economy.country}:`, score);
            console.log("Fator de score:", economy.score_factor);
        }
    }
}

module.exports = { Server };