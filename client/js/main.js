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
const startSoloBtn = document.getElementById('start-solo-btn');
startSoloBtn.onclick = async () => {
    const nickname = menu.getNickname();
    if (!nickname) {
        menu.showScreen('main');
        return;
    }

    await startDeploymentEffect();
    
    connection.createRoom({
        nickname,
        mapType: menu.config.mapType,
        aiLevel: menu.config.aiLevel,
        gameMode: menu.config.gameMode
    });
    menu.showScreen('hud');
};

async function startDeploymentEffect() {
    const screen = document.getElementById('deployment-screen');
    const log = document.getElementById('deployment-log');
    screen.style.display = 'flex';
    log.innerHTML = '';

    const messages = [
        "INITIALIZING DEPLOYMENT SEQUENCE...",
        "ESTABLISHING SECURE PROTOCOLS...",
        "DECRYPTING REGIONAL SATELLITE DATA...",
        "SYNCING WITH COMMAND CENTER 01...",
        "CALIBRATING TACTICAL OVERLAY...",
        "NATION THREAT LEVEL EVALUATED: " + (menu.config.aiLevel),
        "DEPLOYING ADVANCED AI AGENTS...",
        "ALL SYSTEMS NOMINAL. ENGAGING..."
    ];

    for (const msg of messages) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = "> " + msg;
        log.appendChild(entry);
        await new Promise(r => setTimeout(r, 200));
    }

    await new Promise(r => setTimeout(r, 500));
    screen.style.display = 'none';
}

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
