import { useEffect, useState } from 'react';
import {EventEmitter} from 'events';

let client = undefined;

export function useServer() {
    const [socket, setSocket] = useState(client);
    const [playerState, setPlayerState] = useState(null);
    const [gameState, setGameState] = useState(null);

    useEffect(() => {
        if (!client) {
            const socketIo = require('socket.io-client');
            client = new Server(
                socketIo('http://localhost:3001/server', {
                    transports: ['websocket'],
                    auth: {
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

export class EventSource {
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

class Server extends EventSource {
    constructor(socket) {
        super();
        this.socket = socket;

        this.state = {

        }

        this.handleMessages();
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

        this.emit('stateUpdate', this.state);
    }
}