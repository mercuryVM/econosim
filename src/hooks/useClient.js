import { useEffect, useState } from 'react';
import {EventEmitter} from 'events';

let client = undefined;

export function useClient() {
    const [socket, setSocket] = useState(client);
    const [playerState, setPlayerState] = useState(null);
    const [gameState, setGameState] = useState(null);

    useEffect(() => {
        if (!client) {
            const socketIo = require('socket.io-client');
            client = new Client(
                socketIo('http://localhost:3001', {
                    transports: ['websocket'],
                    auth: {
                        nickname: 'User' + Math.floor(Math.random() * 1000),
                        role: 0 // 0 for bank, 1 for government
                    }
                })
            );
            setSocket(client);

            client.on('stateUpdate', (state) => {
                setPlayerState(state);
                setGameState(state.gameState);
            });
        }
    }, []);

    return {client: socket, playerState, gameState};
}

class EventSource {
    constructor() {
        this.events = new EventEmitter();
    }

    on(event, listener) {
        this.events.on(event, listener);
    }

    emit(event, data) {
        this.events.emit(event, data);
    }
}

class Client extends EventSource {
    constructor(socket) {
        super();
        this.socket = socket;
        this.game = new Game(this);
        this.state = {

        }

        this.handleMessages();
    }

    get nickname() {
        return this.socket.auth.nickname;
    }

    get role() {
        return this.socket.auth.role;
    }

    handleMessages() {
        this.socket.on('stateUpdate', (data) => {
            console.log('State update received:', data);
            this.updateState(data);
        });
    }

    updateState(data) {
        // Update the client state based on the received data
        this.state = { ...this.state, ...data };
        console.log('Client state updated:', this.state);

        this.game.updateState(data.gameState);

        this.emit('stateUpdate', this.state);
    }
}

class Game {
    constructor(client) {
        this.client = client;
        this.state = {};
        this.handleGameEvents();
    }

    get inLobby() {
        return this.state.inLobby || false;
    }

    handleGameEvents() {
        this.client.socket.on('gameEvent', (event) => {
            console.log('Game event received:', event);
            // Handle the game event here
            this.updateState(event);
        });
    }

    updateState(event) {
        // Update the game state based on the event
        this.state = { ...this.state, ...event };
        console.log('Game state updated:', this.state);
    }
}