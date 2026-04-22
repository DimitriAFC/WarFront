import { MAP_SIZE } from '/shared/constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.scale = 1;
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.cellsMetadata = new Map();
        this.selectedCellId = null;
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Calculate scale to fit the 2000x2000 map into the screen
        const scaleX = this.width / MAP_SIZE;
        const scaleY = this.height / MAP_SIZE;
        this.scale = Math.min(scaleX, scaleY) * 0.95; // 0.95 to leave a small margin
    }

    setCellsMetadata(cells) {
        cells.forEach(cell => {
            this.cellsMetadata.set(cell.id, { x: cell.x, y: cell.y });
        });
    }

    getCellAt(mouseX, mouseY) {
        // Adjust mouse coordinates for scaling and centering
        const offsetX = (this.width - MAP_SIZE * this.scale) / 2;
        const offsetY = (this.height - MAP_SIZE * this.scale) / 2;
        
        const adjX = (mouseX - offsetX) / this.scale;
        const adjY = (mouseY - offsetY) / this.scale;

        for (const [id, meta] of this.cellsMetadata) {
            const dist = Math.hypot(adjX - meta.x, adjY - meta.y);
            if (dist < 60) return id;
        }
        return null;
    }

    draw(gameState, players, myId) {
        if (!gameState) return;

        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.ctx.save();
        
        // Center the map on the screen
        const offsetX = (this.width - MAP_SIZE * this.scale) / 2;
        const offsetY = (this.height - MAP_SIZE * this.scale) / 2;
        this.ctx.translate(offsetX, offsetY);
        this.ctx.scale(this.scale, this.scale);

        this.drawGrid();

        // 1. Draw Troop Movements
        if (gameState.transfers) {
            gameState.transfers.forEach(t => {
                const owner = players.find(p => p.id === t.ownerId);
                const color = owner ? owner.color : '#fff';
                this.drawTroopUnit(t.x, t.y, t.amount, color);
            });
        }

        // 2. Draw Cells
        gameState.cells.forEach(cell => {
            const meta = this.cellsMetadata.get(cell.id);
            if (!meta) return;

            const owner = players.find(p => p.id === cell.ownerId);
            const color = owner ? owner.color : '#475569';
            
            this.drawCell(meta.x, meta.y, cell.population, color, cell.id === this.selectedCellId, cell.ownerId === myId);
        });

        this.ctx.restore();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
        this.ctx.lineWidth = 2 / this.scale;
        const step = 200;
        for (let x = 0; x <= MAP_SIZE; x += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, MAP_SIZE);
            this.ctx.stroke();
        }
        for (let y = 0; y <= MAP_SIZE; y += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(MAP_SIZE, y);
            this.ctx.stroke();
        }
        
        // Map border
        this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
        this.ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);
    }

    drawCell(x, y, pop, color, isSelected, isMine) {
        const radius = 30 + Math.sqrt(pop) * 2;

        this.ctx.shadowBlur = (isSelected ? 30 : 15) / this.scale;
        this.ctx.shadowColor = color;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        const gradient = this.ctx.createRadialGradient(x - radius/3, y - radius/3, 2, x, y, radius);
        gradient.addColorStop(0, 'rgba(255,255,255,0.4)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        this.ctx.shadowBlur = 0;

        if (isMine) {
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 3 / this.scale;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        if (isSelected) {
            this.ctx.strokeStyle = '#6366f1';
            this.ctx.lineWidth = 5 / this.scale;
            this.ctx.setLineDash([10 / this.scale, 5 / this.scale]);
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius + 12, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${Math.floor(16 / this.scale)}px Outfit`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(Math.floor(pop), x, y);
    }

    drawTroopUnit(x, y, amount, color) {
        const radius = (10 + Math.sqrt(amount)) / this.scale;
        
        this.ctx.shadowBlur = 10 / this.scale;
        this.ctx.shadowColor = color;
        this.ctx.fillStyle = color;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x - radius/4, y - radius/4, radius/2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
    }
}
