import { Connection } from './connection.js';
import { Renderer } from './renderer.js';
import { MenuManager } from './menuManager.js';
import { BackgroundRenderer } from './backgroundRenderer.js';

const canvas = document.getElementById('game-canvas');
const connection = new Connection();
const renderer = new Renderer(canvas);
const menu = new MenuManager();
const background = new BackgroundRenderer('bg-canvas');
background.start();

const lancerBtn = document.getElementById('lancer-btn');
const nicknameError = document.getElementById('nickname-error');
const aiSection = document.getElementById('ai-section');

let currentGameState = null;

// Interaction logic
canvas.onclick = (e) => {
    if (!currentGameState) return;

    const cellId = renderer.getCellAt(e.clientX, e.clientY);
    
    if (cellId !== null) {
        // If clicking a cell you own
        const cell = currentGameState.cells.find(c => c.id === cellId);
        
        if (cell.ownerId === connection.myId) {
            renderer.selectedCellId = cellId;
        } else if (renderer.selectedCellId !== null) {
            // If already have a selection, attack this target
            connection.sendTroops(renderer.selectedCellId, cellId);
            renderer.selectedCellId = null; // Clear selection after attack order
        }
    } else {
        renderer.selectedCellId = null;
    }
};

// The big LANCER button
lancerBtn.onclick = () => {
    const nick = menu.getNickname();
    if (!nick) {
        nicknameError.style.display = 'block';
        return;
    }
    nicknameError.style.display = 'none';

    if (menu.config.mode === 'solo' || menu.config.mode === 'sandbox') {
        aiSection.style.display = (menu.config.mode === 'sandbox') ? 'none' : 'block';
        if (menu.config.mode === 'sandbox') menu.config.aiLevel = 'None';
        menu.showScreen('solo');
    } else {
        menu.showScreen('multi');
    }
};

// Start Solo Game
document.getElementById('start-solo-btn').onclick = () => {
    connection.createRoom({
        nickname: menu.getNickname(),
        mapType: menu.config.mapType,
        aiLevel: menu.config.aiLevel
    });
    menu.showScreen('hud');
};

// State Handlers
connection.onInitialState = (state) => {
    renderer.setCellsMetadata(state.cells);
    document.getElementById('room-display').textContent = state.roomId;
    
    const me = state.players.find(p => p.id === connection.myId);
    if (me) {
        document.getElementById('player-name').textContent = me.nickname;
        document.querySelector('.color-dot').style.backgroundColor = me.color;
    }
};

connection.onStateUpdate = (state) => {
    currentGameState = state;
};

function loop() {
    renderer.draw(currentGameState, currentGameState?.players || [], connection.myId);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
