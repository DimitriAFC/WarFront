import { MAP_TYPES, AI_LEVELS, MAP_ASSETS, GAME_MODES } from '/shared/constants.js';

export class MenuManager {
    constructor() {
        this.screens = {
            main: document.getElementById('main-menu'),
            solo: document.getElementById('solo-config'),
            hud: document.getElementById('hud')
        };

        this.config = {
            mode: 'solo',
            mapType: MAP_TYPES.WORLD,
            aiLevel: AI_LEVELS.MEDIUM,
            gameMode: GAME_MODES.FFA,
            nickname: ''
        };

        this.init();
    }

    init() {
        this.renderMapOptions();
        this.renderDifficultyOptions();
        this.initGenericSelection('game-mode-selection', (val) => this.config.gameMode = val);
        this.initModeSelection();
        this.initAccordion();

        const nickInput = document.getElementById('nickname-input');
        const badgeName = document.getElementById('badge-name');

        // Load saved nickname
        const savedNick = localStorage.getItem('warfront_nickname');
        if (savedNick) {
            nickInput.value = savedNick;
            badgeName.textContent = savedNick.toUpperCase();
        }

        // Reactive ID Badge
        nickInput.oninput = () => {
            const val = nickInput.value.trim();
            badgeName.textContent = val ? val.toUpperCase() : 'UNKNOWN';
        };

        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.onclick = () => this.showScreen('main');
        });
    }

    initAccordion() {
        const sections = document.querySelectorAll('.accordion-section');
        sections.forEach(section => {
            const title = section.querySelector('.section-title');
            title.onclick = () => {
                const isActive = section.classList.contains('active');
                
                // Collapse all
                sections.forEach(s => s.classList.remove('active'));
                
                // If it wasn't active, open it
                if (!isActive) {
                    section.classList.add('active');
                }
            };
        });
    }

    renderMapOptions() {
        const container = document.getElementById('map-selection');
        container.innerHTML = '';
        
        Object.values(MAP_TYPES).forEach(val => {
            const card = document.createElement('div');
            card.className = 'option-card';
            if (val === this.config.mapType) card.classList.add('selected');

            const imgPath = MAP_ASSETS[val];
            if (imgPath) {
                const img = document.createElement('img');
                img.src = imgPath;
                card.appendChild(img);
            }

            const label = document.createElement('span');
            label.textContent = val;
            card.appendChild(label);

            card.onclick = () => {
                container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.config.mapType = val;
            };
            container.appendChild(card);
        });
    }

    renderDifficultyOptions() {
        const container = document.getElementById('ai-selection');
        container.innerHTML = '';

        const difficultyData = [
            { level: AI_LEVELS.EASY, skulls: 1, flame: false },
            { level: AI_LEVELS.MEDIUM, skulls: 2, flame: false },
            { level: AI_LEVELS.HARD, skulls: 3, flame: false },
            { level: AI_LEVELS.IMPOSSIBLE, skulls: 1, flame: true }
        ];

        difficultyData.forEach(data => {
            const card = document.createElement('div');
            card.className = 'option-card';
            if (data.level === this.config.aiLevel) card.classList.add('selected');

            const content = document.createElement('div');
            content.className = 'difficulty-content';

            // Skull Icons
            const skullSet = document.createElement('div');
            skullSet.className = `skull-set ${data.flame ? 'flame-skull' : ''}`;
            
            for (let i = 0; i < 3; i++) {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#icon-skull');
                svg.appendChild(use);
                if (i < data.skulls || data.flame) svg.classList.add('active');
                skullSet.appendChild(svg);
            }
            content.appendChild(skullSet);

            const label = document.createElement('span');
            label.textContent = data.level;
            content.appendChild(label);

            card.appendChild(content);

            card.onclick = () => {
                container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.config.aiLevel = data.level;
            };
            container.appendChild(card);
        });
    }

    initGenericSelection(containerId, onSelect) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const cards = container.querySelectorAll('.option-card');
        cards.forEach(card => {
            card.onclick = () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const val = card.dataset.gameMode || card.textContent.trim();
                onSelect(val);
            };
        });
    }

    initModeSelection() {
        const cards = document.querySelectorAll('#mode-selection .option-card');
        cards.forEach(card => {
            card.onclick = () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.config.mode = card.dataset.mode;
            };
        });
    }

    showScreen(screenKey) {
        Object.values(this.screens).forEach(s => {
            if (s) s.style.display = 'none';
        });
        if (this.screens[screenKey]) {
            this.screens[screenKey].style.display = 'block';
        }
    }

    getNickname() {
        const nick = document.getElementById('nickname-input').value.trim();
        if (nick) localStorage.setItem('warfront_nickname', nick);
        return nick;
    }
}
