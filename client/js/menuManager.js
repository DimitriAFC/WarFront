import { MAP_TYPES, AI_LEVELS, MAP_ASSETS } from '/shared/constants.js';

export class MenuManager {
    constructor() {
        this.screens = {
            main: document.getElementById('main-menu'),
            solo: document.getElementById('solo-config'),
            multi: document.getElementById('multi-lobby'),
            hud: document.getElementById('hud')
        };

        this.config = {
            mode: 'solo',
            mapType: MAP_TYPES.WORLD,
            aiLevel: AI_LEVELS.MEDIUM,
            nickname: ''
        };

        this.init();
    }

    init() {
        this.renderMapOptions();
        this.renderOptions('ai-selection', AI_LEVELS, (val) => this.config.aiLevel = val);
        this.initModeSelection();

        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.onclick = () => this.showScreen('main');
        });
    }

    renderMapOptions() {
        const container = document.getElementById('map-selection');
        container.innerHTML = ''; // Clear
        
        Object.values(MAP_TYPES).forEach(val => {
            const card = document.createElement('div');
            card.className = 'option-card';
            if (val === this.config.mapType) card.classList.add('selected');

            // Image Thumbnail
            const imgPath = MAP_ASSETS[val];
            if (imgPath) {
                const img = document.createElement('img');
                img.src = imgPath;
                img.alt = val;
                card.appendChild(img);
            } else {
                // Placeholder for Grid or empty
                const placeholder = document.createElement('div');
                placeholder.className = 'map-placeholder';
                card.appendChild(placeholder);
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

    renderOptions(containerId, options, onSelect) {
        const container = document.getElementById(containerId);
        Object.values(options).forEach(val => {
            const card = document.createElement('div');
            card.className = 'option-card';
            if (val === this.config.aiLevel) {
                card.classList.add('selected');
            }
            const label = document.createElement('span');
            label.textContent = val;
            card.appendChild(label);

            card.onclick = () => {
                container.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                onSelect(val);
            };
            container.appendChild(card);
        });
    }

    showScreen(screenKey) {
        Object.values(this.screens).forEach(s => s.style.display = 'none');
        if (this.screens[screenKey]) {
            this.screens[screenKey].style.display = 'block';
        }
    }

    getNickname() {
        return document.getElementById('nickname-input').value.trim();
    }
}
