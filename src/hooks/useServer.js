import { useEffect, useState } from 'react';
import { EventEmitter } from 'events';
import { SoundManager } from './useClient';
import RoundStart from '../sounds/econosim round start.mp3';
import BgSound from '../sounds/econosim_bg.mp3';

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
                setGameState(state);
            });
        }
    }, []);

    return { client: socket, playerState, gameState };
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

        this.soundManager = new SoundManager();
        this.soundManager.loadSound('roundStart', RoundStart);
        this.soundManager.loadSound('bgSound', BgSound);

        this.handleMessages();
    }

    playSound(name, volume = 1) {
        return this.soundManager.playSound(name, volume);
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