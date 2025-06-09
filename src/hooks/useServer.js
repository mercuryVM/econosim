import { useEffect, useState } from 'react';
import { EventEmitter } from 'events';
import { SoundManager } from './useClient';
import RoundStart from '../sounds/econosim round start.mp3';
import BgSound from '../sounds/econosim_bg.mp3';
import DrumRollSound from '../sounds/drumroll.mp3';
import BadSound from '../sounds/badEvent.ogg';
import GoodEventSound from '../sounds/goodEvent.mp3';
import RoundEndSound from '../sounds/roundEnd.mp3';

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

    off(event, listener) {
        this.events.off(event, listener);
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
        this.soundManager.loadSound('drumRoll', DrumRollSound);
        this.soundManager.loadSound('badEvent', BadSound);
        this.soundManager.loadSound('goodEvent', GoodEventSound);
        this.soundManager.loadSound('roundEnd', RoundEndSound);

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

        this.socket.on("timeUpdate", (data) => {
            console.log('Timer update received:', data);
            this.emit('timeUpdate', data);
        });
    }

    sendMessage(event, data) {
        console.log('Sending message:', event, data);
        this.socket.emit(event, data);
    }

    updateState(data) {
        // Update the client state based on the received data
        this.state = { ...this.state, ...data };
        console.log('Client state updated:', this.state);

        this.emit('stateUpdate', this.state);
    }
}