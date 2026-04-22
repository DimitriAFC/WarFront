import { MAP_SIZE } from '/shared/constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
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
    }

    setCellsMetadata(cells) {
        cells.forEach(cell => {
            this.cellsMetadata.set(cell.id, { x: cell.x, y: cell.y });
        });
    }

    /**
     * Finds which cell is under the mouse coordinates.
     */
    getCellAt(mouseX, mouseY) {
        for (const [id, meta] of this.cellsMetadata) {
            const dist = Math.hypot(mouseX - meta.x, mouseY - meta.y);
            if (dist < 50) return id; // roughly the radius
        }
        return null;
    }

    draw(gameState, players, myId) {
        if (!gameState) return;

        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawGrid();

        // 1. Draw Troop Movements (Transfers)
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
    }

    drawGrid() {
        this.ctx.strokeStyle = '#1e293b';
        this.ctx.lineWidth = 1;
        const step = 100;
        for (let x = 0; x < MAP_SIZE; x += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, MAP_SIZE);
            this.ctx.stroke();
        }
        for (let y = 0; y < MAP_SIZE; y += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(MAP_SIZE, y);
            this.ctx.stroke();
        }
    }

    drawCell(x, y, pop, color, isSelected, isMine) {
        const radius = 30 + Math.sqrt(pop) * 2;

        this.ctx.shadowBlur = isSelected ? 30 : 15;
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
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        if (isSelected) {
            this.ctx.strokeStyle = '#6366f1';
            this.ctx.lineWidth = 5;
            this.ctx.setLineDash([10, 5]);
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius + 12, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 16px Outfit';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(Math.floor(pop), x, y);
    }

    drawTroopUnit(x, y, amount, color) {
        const radius = 10 + Math.sqrt(amount);
        
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color;
        this.ctx.fillStyle = color;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Simple inner polish
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.beginPath();
        this.ctx.arc(x - radius/4, y - radius/4, radius/2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
    }
}
