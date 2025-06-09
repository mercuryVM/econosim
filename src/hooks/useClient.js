import { useEffect, useState } from 'react';
import {EventEmitter} from 'events';
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
                socketIo('http://localhost:3001', {
                    transports: ['websocket'],
                    auth: {
                        nickname: 'User' + Math.floor(Math.random() * 1000),
                        role: Number(role), // 0 for bank, 1 for government,
                        economy: Number(economy) // 0 for capitalist,
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
    }

    sendMessage(event, ...data) {
        console.log(`Emitting event: ${event}`, data);
        this.socket.emit(event, ...data);
    }

    playSound(name, volume = 1) {
        return this.soundManager.playSound(name, volume);
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

        this.socket.on("votes", (data) => {
            console.log('Votes received:', data);
            this.emit('votes', data);
        })
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

export class SoundManager {
    constructor() {
        this.sounds = {};
    }

    loadSound(name, url) {
        const audio = new Audio(url);
        this.sounds[name] = audio;
    }

    playSound(name, volume = 1) {
        if (this.sounds[name]) {
            this.sounds[name].volume = volume;
            this.sounds[name].play().catch(error => {
                console.error(`Error playing sound ${name}:`, error);
            });

            return {
                stop: () => {
                    this.sounds[name].pause();
                    this.sounds[name].currentTime = 0; // Reset to start
                }
            }
        } else {
            console.warn(`Sound ${name} not found`);
        }
    }
}