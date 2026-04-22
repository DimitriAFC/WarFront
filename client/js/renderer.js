import { MAP_SIZE, GRID_WIDTH, GRID_HEIGHT, CELL_SIZE, MAP_ASSETS } from '/shared/constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        // Grid state (local copy)
        this.grid = new Array(GRID_WIDTH * GRID_HEIGHT).fill(0);
        this.playerColors = new Map(); // index -> { r, g, b }
        this.playerInfos = [];         // Full player data for labels

        // Offscreen canvas for territory (200x200, scaled up)
        this.gridCanvas = document.createElement('canvas');
        this.gridCanvas.width = GRID_WIDTH;
        this.gridCanvas.height = GRID_HEIGHT;
        this.gridCtx = this.gridCanvas.getContext('2d');

        // Offscreen for borders
        this.borderCanvas = document.createElement('canvas');
        this.borderCanvas.width = GRID_WIDTH;
        this.borderCanvas.height = GRID_HEIGHT;
        this.borderCtx = this.borderCanvas.getContext('2d');

        // Map background image
        this.mapImage = null;
        this.mapLoaded = false;

        // Target reticle
        this.targetX = GRID_WIDTH / 2;
        this.targetY = GRID_HEIGHT / 2;

        // Dirty flag for border recalc
        this.borderDirty = true;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        const scaleX = this.width / MAP_SIZE;
        const scaleY = this.height / MAP_SIZE;
        this.scale = Math.min(scaleX, scaleY) * 0.95;
        this.offsetX = (this.width - MAP_SIZE * this.scale) / 2;
        this.offsetY = (this.height - MAP_SIZE * this.scale) / 2;
    }

    loadMapImage(mapType) {
        const src = MAP_ASSETS[mapType];
        if (!src) return;
        this.mapImage = new Image();
        this.mapImage.onload = () => { this.mapLoaded = true; };
        this.mapImage.src = src;
    }

    // Parse hex color to { r, g, b }
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 128, g: 128, b: 128 };
    }

    // Darken a color for borders
    darkenRgb(rgb, factor = 0.5) {
        return {
            r: Math.floor(rgb.r * factor),
            g: Math.floor(rgb.g * factor),
            b: Math.floor(rgb.b * factor)
        };
    }

    // Initialize grid from full state
    initGrid(grid, players) {
        this.grid = [...grid];
        this.updatePlayerColors(players);
        this.rebuildGridCanvas();
        this.borderDirty = true;
    }

    updatePlayerColors(players) {
        this.playerColors.clear();
        this.playerInfos = players;
        players.forEach(p => {
            this.playerColors.set(p.index, this.hexToRgb(p.color));
        });
    }

    // Rebuild the entire offscreen grid canvas using ImageData for speed
    rebuildGridCanvas() {
        const imgData = this.gridCtx.createImageData(GRID_WIDTH, GRID_HEIGHT);
        const data = imgData.data;

        for (let i = 0; i < this.grid.length; i++) {
            const owner = this.grid[i];
            const pi = i * 4;
            if (owner === 0) {
                // Neutral: dark background
                data[pi] = 15;
                data[pi + 1] = 23;
                data[pi + 2] = 42;
                data[pi + 3] = 255;
            } else {
                const rgb = this.playerColors.get(owner) || { r: 128, g: 128, b: 128 };
                data[pi] = rgb.r;
                data[pi + 1] = rgb.g;
                data[pi + 2] = rgb.b;
                data[pi + 3] = 255;
            }
        }
        this.gridCtx.putImageData(imgData, 0, 0);
    }

    // Rebuild border overlay
    rebuildBorders() {
        const imgData = this.borderCtx.createImageData(GRID_WIDTH, GRID_HEIGHT);
        const data = imgData.data;

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const idx = y * GRID_WIDTH + x;
                const owner = this.grid[idx];
                const pi = idx * 4;

                if (owner === 0) continue;

                // Check if this cell is on the border of its territory
                let isBorder = false;
                if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
                    isBorder = true;
                } else {
                    const left = this.grid[idx - 1];
                    const right = this.grid[idx + 1];
                    const top = this.grid[idx - GRID_WIDTH];
                    const bottom = this.grid[idx + GRID_WIDTH];
                    if (left !== owner || right !== owner || top !== owner || bottom !== owner) {
                        isBorder = true;
                    }
                }

                if (isBorder) {
                    // Dark border line
                    const rgb = this.playerColors.get(owner) || { r: 128, g: 128, b: 128 };
                    const dark = this.darkenRgb(rgb, 0.35);
                    data[pi] = dark.r;
                    data[pi + 1] = dark.g;
                    data[pi + 2] = dark.b;
                    data[pi + 3] = 255;
                }
            }
        }
        this.borderCtx.putImageData(imgData, 0, 0);
        this.borderDirty = false;
    }

    // Apply delta changes (efficient per-pixel update)
    applyChanges(changes, players) {
        this.updatePlayerColors(players);

        const imgData = this.gridCtx.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT);
        const data = imgData.data;

        for (const [x, y, ownerIndex] of changes) {
            const idx = y * GRID_WIDTH + x;
            this.grid[idx] = ownerIndex;
            const pi = idx * 4;

            if (ownerIndex === 0) {
                data[pi] = 15;
                data[pi + 1] = 23;
                data[pi + 2] = 42;
                data[pi + 3] = 255;
            } else {
                const rgb = this.playerColors.get(ownerIndex) || { r: 128, g: 128, b: 128 };
                data[pi] = rgb.r;
                data[pi + 1] = rgb.g;
                data[pi + 2] = rgb.b;
                data[pi + 3] = 255;
            }
        }
        this.gridCtx.putImageData(imgData, 0, 0);
        this.borderDirty = true;
    }

    // Convert screen coordinates to grid coordinates
    screenToGrid(screenX, screenY) {
        const mapX = (screenX - this.offsetX) / this.scale;
        const mapY = (screenY - this.offsetY) / this.scale;
        const gridX = Math.floor(mapX / CELL_SIZE);
        const gridY = Math.floor(mapY / CELL_SIZE);
        return { x: gridX, y: gridY };
    }

    setTarget(gridX, gridY) {
        this.targetX = gridX;
        this.targetY = gridY;
    }

    draw(players, myId) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Dark background
        this.ctx.fillStyle = '#0a0e1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        // 1. Draw map background (dimmed, just for geography reference)
        if (this.mapLoaded && this.mapImage) {
            this.ctx.globalAlpha = 0.15;
            this.ctx.drawImage(this.mapImage, 0, 0, MAP_SIZE, MAP_SIZE);
            this.ctx.globalAlpha = 1;
        }

        // 2. Draw territory grid (opaque, pixelated — OpenFront style)
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(this.gridCanvas, 0, 0, MAP_SIZE, MAP_SIZE);

        // 3. Draw border overlay
        if (this.borderDirty) this.rebuildBorders();
        this.ctx.drawImage(this.borderCanvas, 0, 0, MAP_SIZE, MAP_SIZE);
        this.ctx.imageSmoothingEnabled = true;

        // 4. Draw player names on their territory center
        this.drawPlayerLabels(players);

        // 5. Draw target reticle for current player
        this.drawTarget(myId, players);

        this.ctx.restore();

        // 6. Draw leaderboard HUD
        this.drawLeaderboard(players, myId);
    }

    // Calculate center of mass of a player's territory
    getTerritoryCenter(playerIndex) {
        let sumX = 0, sumY = 0, count = 0;
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i] === playerIndex) {
                sumX += (i % GRID_WIDTH);
                sumY += Math.floor(i / GRID_WIDTH);
                count++;
            }
        }
        if (count === 0) return null;
        return {
            x: (sumX / count) * CELL_SIZE,
            y: (sumY / count) * CELL_SIZE
        };
    }

    drawPlayerLabels(players) {
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (const p of players) {
            if (p.territoryCount < 5) continue; // Don't label tiny territories
            const center = this.getTerritoryCenter(p.index);
            if (!center) continue;

            // Player name
            this.ctx.font = `bold ${16}px Outfit, sans-serif`;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(p.nickname, center.x, center.y - 8);
            this.ctx.fillText(p.nickname, center.x, center.y - 8);

            // Territory percentage
            const totalCells = GRID_WIDTH * GRID_HEIGHT;
            const pct = ((p.territoryCount / totalCells) * 100).toFixed(1) + '%';
            this.ctx.font = `bold ${12}px monospace`;
            this.ctx.strokeText(pct, center.x, center.y + 10);
            this.ctx.fillText(pct, center.x, center.y + 10);
        }
    }

    drawTarget(myId, players) {
        const me = players.find(p => p.id === myId);
        if (!me) return;

        const tx = this.targetX * CELL_SIZE + CELL_SIZE / 2;
        const ty = this.targetY * CELL_SIZE + CELL_SIZE / 2;
        const size = 12;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([4, 4]);

        // Crosshair
        this.ctx.beginPath();
        this.ctx.moveTo(tx - size, ty);
        this.ctx.lineTo(tx + size, ty);
        this.ctx.moveTo(tx, ty - size);
        this.ctx.lineTo(tx, ty + size);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(tx, ty, size * 0.7, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawLeaderboard(players, myId) {
        const totalCells = GRID_WIDTH * GRID_HEIGHT;
        // Sort by territory count descending
        const sorted = [...players].sort((a, b) => b.territoryCount - a.territoryCount);

        const x = this.width - 230;
        const y = 15;
        const lineH = 28;
        const panelH = 40 + sorted.length * lineH;

        // Panel background
        this.ctx.fillStyle = 'rgba(10, 14, 26, 0.85)';
        this.ctx.fillRect(x, y, 215, panelH);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, 215, panelH);

        // Header
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '11px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('LEADERBOARD', x + 10, y + 20);

        // Players
        sorted.forEach((p, i) => {
            const py = y + 35 + i * lineH;
            const pct = ((p.territoryCount / totalCells) * 100).toFixed(1);
            const isMe = p.id === myId;

            // Highlight current player
            if (isMe) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                this.ctx.fillRect(x + 2, py - 8, 211, lineH);
            }

            // Color dot
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(x + 18, py + 5, 5, 0, Math.PI * 2);
            this.ctx.fill();

            // Name
            this.ctx.fillStyle = isMe ? '#fff' : 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = `${isMe ? 'bold ' : ''}13px Outfit, sans-serif`;
            this.ctx.fillText(p.nickname, x + 30, py + 9);

            // Percentage
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(pct + '%', x + 205, py + 9);
            this.ctx.textAlign = 'left';
        });
    }
}
