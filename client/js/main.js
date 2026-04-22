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

let currentPlayers = [];
let gameActive = false;

// Click on map = set expansion target
canvas.onclick = (e) => {
    if (!gameActive) return;

    const grid = renderer.screenToGrid(e.clientX, e.clientY);
    if (grid.x >= 0 && grid.x < 200 && grid.y >= 0 && grid.y < 200) {
        renderer.setTarget(grid.x, grid.y);
        connection.setTarget(grid.x, grid.y);
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
        "GENERATING TERRITORIAL GRID [200x200]...",
        "DECRYPTING REGIONAL SATELLITE DATA...",
        "SYNCING WITH COMMAND CENTER 01...",
        "CALIBRATING TACTICAL OVERLAY...",
        "NATION THREAT LEVEL EVALUATED: " + (menu.config.aiLevel),
        "DEPLOYING ADVANCED AI AGENTS...",
        "GRID ONLINE. EXPANSION AUTHORIZED.",
        "ALL SYSTEMS NOMINAL. ENGAGING..."
    ];

    for (const msg of messages) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = "> " + msg;
        log.appendChild(entry);
        await new Promise(r => setTimeout(r, 180));
    }

    await new Promise(r => setTimeout(r, 400));
    screen.style.display = 'none';
}

// Initial State — full grid received
connection.onInitialState = (state) => {
    gameActive = true;
    renderer.loadMapImage(state.mapType);
    renderer.initGrid(state.grid, state.players);
    currentPlayers = state.players;

    document.getElementById('room-display').textContent = state.roomId;
    
    const me = state.players.find(p => p.id === connection.myId);
    if (me) {
        document.getElementById('player-name').textContent = me.nickname;
        document.querySelector('.color-dot').style.backgroundColor = me.color;
    }
};

// Delta updates — only changed cells
connection.onStateUpdate = (state) => {
    if (state.changes && state.changes.length > 0) {
        renderer.applyChanges(state.changes, state.players);
    }
    currentPlayers = state.players;
};

// Render loop
function loop() {
    if (gameActive) {
        renderer.draw(currentPlayers, connection.myId);
    }
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
