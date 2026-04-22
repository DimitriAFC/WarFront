import { MSG_TYPES, MAP_TYPES, AI_LEVELS } from '/shared/constants.js';

export class Connection {
    constructor() {
        this.socket = io();
        this.gameState = null;
        this.myId = null;
        this.onStateUpdate = null;
        this.onInitialState = null;

        this.setupHandlers();
    }

    setupHandlers() {
        this.socket.on('connect', () => {
            this.myId = this.socket.id;
        });

        this.socket.on(MSG_TYPES.INITIAL_STATE, (state) => {
            console.log('Received initial state for room:', state.roomId);
            this.gameState = state;
            if (this.onInitialState) this.onInitialState(state);
        });

        this.socket.on(MSG_TYPES.GAME_UPDATE, (state) => {
            this.gameState = state;
            if (this.onStateUpdate) this.onStateUpdate(state);
        });

        this.socket.on(MSG_TYPES.ERROR, (msg) => {
            alert('Error: ' + msg);
        });
    }

    createRoom(config) {
        this.socket.emit(MSG_TYPES.CREATE_ROOM, config);
    }

    joinRoom(roomId, nickname) {
        this.socket.emit(MSG_TYPES.JOIN_ROOM, { roomId, nickname });
    }

    sendTroops(sourceId, targetId) {
        this.socket.emit(MSG_TYPES.SEND_TROOPS, { sourceId, targetId });
    }
}
