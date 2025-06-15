import { useEffect, useState } from 'react';
import { EventEmitter } from 'events';
import RoundStart from '../sounds/econosim round start.mp3';

let client = undefined;

export function useClient(role, economy) {
    const [socket, setSocket] = useState(client);
    const [playerState, setPlayerState] = useState(null);
    const [gameState, setGameState] = useState(null);

    useEffect(() => {
        if (!client) {
            const socketIo = require('socket.io-client');
            client = new Client(
                socketIo(process.env.REACT_APP_API_PATH, {
                    transports: ['websocket'],
                    auth: {
                        nickname: 'User' + Math.floor(Math.random() * 1000),
                        role: Number(role), // 0 for bank, 1 for government,
                        economy: Number(economy) // 0 for capitalist,
                    }
                })
            );
            setSocket(client); client.on('stateUpdate', (state) => {
                setPlayerState(state);
                setGameState(state.gameState);
            });
        }
    }, [role, economy]);

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

class Client extends EventSource {
    constructor(socket) {
        super();
        this.socket = socket;
        this.game = new Game(this);
        this.state = {

        }
        this.soundManager = new SoundManager();
        this.soundManager.loadSound('roundStart', RoundStart);

        this.handleMessages();
    } sendMessage(event, ...data) {
        this.socket.emit(event, ...data);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    playSound(name, volume = 1) {
        return this.soundManager.playSound(name, volume);
    }

    get nickname() {
        return this.socket.auth.nickname;
    }

    get role() {
        return this.socket.auth.role;
    } handleMessages() {
        this.socket.on('stateUpdate', (data) => {
            this.updateState(data);
        });

        this.socket.on("votes", (data) => {
            this.emit('votes', data);
        })
    } updateState(data) {
        // Update the client state based on the received data
        this.state = { ...this.state, ...data };

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
    } handleGameEvents() {
        this.client.socket.on('gameEvent', (event) => {
            // Handle the game event here
            this.updateState(event);
        });
    } updateState(event) {
        // Update the game state based on the event
        this.state = { ...this.state, ...event };
    }
}

export class SoundManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.buffers = {};
    }

    // Carrega e decodifica o áudio via AudioContext
    async loadSound(name, url) {
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.buffers[name] = audioBuffer;
    }

    // Cria um BufferSource + GainNode para tocar instantaneamente
    playSound(name, volume = 1) {
        const buffer = this.buffers[name];
        if (!buffer) {
            console.warn(`Sound ${name} not found`);
            return;
        }
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode).connect(this.audioContext.destination);
        source.start(0);

        return {
            stop: () => {
                source.stop();
            },
            length: buffer.duration
        };
    }
}