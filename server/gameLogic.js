import { GROWTH_RATE, MAX_CELL_POPULATION, MAP_TYPES, AI_LEVELS, UNIT_SPEED, TROOP_PERCENTAGE } from '../shared/constants.js';

export class Game {
  constructor(config = {}) {
    this.id = config.id || Math.random().toString(36).substring(7);
    this.mapType = config.mapType || MAP_TYPES.GRID;
    this.aiLevel = config.aiLevel || AI_LEVELS.NONE;
    this.players = new Map();
    this.cells = [];
    this.transfers = []; // ongoing troop movements
    this.lastTickTime = Date.now();
    
    this.initMap();
    if (this.aiLevel !== AI_LEVELS.NONE) {
      this.initAI();
    }
  }

  initMap() {
    switch(this.mapType) {
      case MAP_TYPES.WORLD: this.generateWorldMap(); break;
      case MAP_TYPES.EUROPE: this.generateEuropeMap(); break;
      case MAP_TYPES.NA: this.generateNAMap(); break;
      case MAP_TYPES.SA: this.generateSAMap(); break;
      case MAP_TYPES.ASIA: this.generateAsiaMap(); break;
      case MAP_TYPES.AFRICA: this.generateAfricaMap(); break;
      case MAP_TYPES.JAPAN: this.generateJapanMap(); break;
      default: this.generateGridMap();
    }
  }

  generateGridMap() {
    let idCounter = 0;
    const spacing = 150;
    for (let x = spacing; x < 2000; x += spacing) {
      for (let y = spacing; y < 2000; y += spacing) {
        this.addCell(idCounter++, x, y);
      }
    }
  }

  generateWorldMap() {
    const points = [
      { x: 400, y: 800 }, { x: 950, y: 600 }, { x: 1750, y: 850 },
      { x: 1700, y: 1600 }, { x: 650, y: 1500 }, { x: 1050, y: 1700 },
      { x: 1100, y: 1000 }, { x: 1400, y: 1100 }, { x: 1000, y: 700 },
      { x: 1200, y: 600 }, { x: 1600, y: 800 }, { x: 200, y: 600 },
      { x: 1300, y: 400 }, { x: 800, y: 1100 }, { x: 1500, y: 1400 }
    ];
    points.forEach((p, i) => this.addCell(i, p.x, p.y));
  }

  generateEuropeMap() {
    const points = [
      { x: 500, y: 500 }, { x: 600, y: 700 }, { x: 900, y: 600 },
      { x: 1000, y: 1100 }, { x: 400, y: 1200 }, { x: 1600, y: 500 },
      { x: 1100, y: 300 }, { x: 1300, y: 1300 }, { x: 1400, y: 700 },
      { x: 1100, y: 650 }, { x: 1000, y: 800 }, { x: 650, y: 650 },
      { x: 800, y: 450 }, { x: 1400, y: 400 }, { x: 1200, y: 1000 }
    ];
    points.forEach((p, i) => this.addCell(i, p.x, p.y));
  }

  generateNAMap() {
    const points = [
      { x: 400, y: 400 }, { x: 700, y: 300 }, { x: 1000, y: 600 },
      { x: 1200, y: 800 }, { x: 1000, y: 1200 }, { x: 600, y: 1000 },
      { x: 300, y: 800 }, { x: 500, y: 1400 }, { x: 1400, y: 500 },
      { x: 1500, y: 1000 }, { x: 800, y: 1600 }
    ];
    points.forEach((p, i) => this.addCell(i, p.x, p.y));
  }

  generateSAMap() {
    const points = [
      { x: 800, y: 400 }, { x: 1200, y: 600 }, { x: 1000, y: 1000 },
      { x: 1100, y: 1500 }, { x: 800, y: 1800 }, { x: 600, y: 1400 },
      { x: 500, y: 800 }, { x: 1400, y: 900 }, { x: 900, y: 1200 }
    ];
    points.forEach((p, i) => this.addCell(i, p.x, p.y));
  }

  generateAsiaMap() {
    const points = [
      { x: 400, y: 600 }, { x: 800, y: 400 }, { x: 1200, y: 600 },
      { x: 1600, y: 400 }, { x: 1800, y: 800 }, { x: 1400, y: 1000 },
      { x: 1000, y: 1200 }, { x: 600, y: 1000 }, { x: 1200, y: 1400 },
      { x: 1550, y: 1500 }, { x: 1750, y: 1200 }
    ];
    points.forEach((p, i) => this.addCell(i, p.x, p.y));
  }

  generateAfricaMap() {
    const points = [
      { x: 1000, y: 400 }, { x: 600, y: 600 }, { x: 400, y: 1000 },
      { x: 600, y: 1400 }, { x: 1000, y: 1800 }, { x: 1400, y: 1400 },
      { x: 1600, y: 1000 }, { x: 1300, y: 600 }, { x: 1000, y: 1000 },
      { x: 800, y: 1200 }, { x: 1200, y: 1200 }
    ];
    points.forEach((p, i) => this.addCell(i, p.x, p.y));
  }

  generateJapanMap() {
    const points = [
      { x: 1600, y: 400 }, { x: 1400, y: 600 }, { x: 1200, y: 800 },
      { x: 1000, y: 1000 }, { x: 800, y: 1200 }, { x: 600, y: 1400 },
      { x: 400, y: 1600 }, { x: 700, y: 1000 }, { x: 1100, y: 700 }
    ];
    points.forEach((p, i) => this.addCell(i, p.x, p.y));
  }

  addCell(id, x, y) {
    this.cells.push({
      id, x, y, ownerId: null,
      population: Math.floor(Math.random() * 50) + 10,
    });
  }

  initAI() {
    const aiId = 'ai_' + Math.random().toString(36).substring(7);
    this.players.set(aiId, { id: aiId, nickname: `Bot (${this.aiLevel})`, color: '#ffffff', isAI: true });
    // AI Start cell
    const cell = this.cells.filter(c => c.ownerId === null)[Math.floor(Math.random() * this.cells.length)];
    if (cell) {
      cell.ownerId = aiId;
      cell.population = 50;
    }
  }

  addPlayer(id, nickname, color) {
    this.players.set(id, { id, nickname, color, isAI: false });
    const neutralCells = this.cells.filter(c => c.ownerId === null);
    if (neutralCells.length > 0) {
      const startCell = neutralCells[Math.floor(Math.random() * neutralCells.length)];
      startCell.ownerId = id;
      startCell.population = 50;
    }
  }

  removePlayer(id) {
    this.players.delete(id);
    this.cells.forEach(cell => { if (cell.ownerId === id) cell.ownerId = null; });
    this.transfers = this.transfers.filter(t => t.ownerId !== id);
  }

  handleSendTroops(playerId, sourceId, targetId) {
    const source = this.cells.find(c => c.id === sourceId);
    const target = this.cells.find(c => c.id === targetId);
    
    if (!source || !target || source.ownerId !== playerId || sourceId === targetId) return;
    if (source.population < 10) return;

    const amount = Math.floor(source.population * TROOP_PERCENTAGE);
    source.population -= amount;

    const distance = Math.hypot(target.x - source.x, target.y - source.y);

    this.transfers.push({
      id: Math.random().toString(36).substring(7),
      ownerId: playerId,
      sourceId,
      targetId,
      amount,
      x: source.x,
      y: source.y,
      targetX: target.x,
      targetY: target.y,
      progress: 0,
      totalDistance: distance
    });
  }

  update() {
    // 1. Population Growth
    this.cells.forEach(cell => {
      if (cell.ownerId !== null && cell.population < MAX_CELL_POPULATION) cell.population += GROWTH_RATE;
    });

    // 2. Transfer Movement
    this.transfers.forEach((t, index) => {
      t.progress += UNIT_SPEED;
      
      // Calculate current position
      const ratio = t.progress / t.totalDistance;
      t.x = t.x + (t.targetX - t.x) * (UNIT_SPEED / (t.totalDistance - (t.progress - UNIT_SPEED))); // Linear interpolation step

      if (t.progress >= t.totalDistance) {
        this.resolveTransfer(t);
        this.transfers.splice(index, 1);
      }
    });

    // 3. AI Tick
    if (this.aiLevel !== AI_LEVELS.NONE) this.updateAI();

    this.lastTickTime = Date.now();
    return this.getState();
  }

  resolveTransfer(t) {
    const target = this.cells.find(c => c.id === t.targetId);
    if (!target) return;

    if (target.ownerId === t.ownerId) {
      target.population += t.amount;
    } else {
      target.population -= t.amount;
      if (target.population < 0) {
        target.population = Math.abs(target.population);
        target.ownerId = t.ownerId;
      }
    }
  }

  updateAI() {
    const aiPlayer = Array.from(this.players.values()).find(p => p.isAI);
    if (!aiPlayer || Math.random() > 0.05) return;
    const myCells = this.cells.filter(c => c.ownerId === aiPlayer.id && c.population > 30);
    if (myCells.length === 0) return;
    const source = myCells[Math.floor(Math.random() * myCells.length)];
    
    // AI Target logic
    let target = null;
    if (this.aiLevel === AI_LEVELS.EASY) {
      target = this.cells[Math.floor(Math.random() * this.cells.length)];
    } else {
      // Find closest or weakest neighbor
      target = this.cells
        .filter(c => c.ownerId !== aiPlayer.id)
        .sort((a, b) => {
          const distA = Math.hypot(a.x - source.x, a.y - source.y);
          const distB = Math.hypot(b.x - source.x, b.y - source.y);
          return (a.population + distA*0.1) - (b.population + distB*0.1);
        })[0];
    }

    if (target && target.id !== source.id) {
      this.handleSendTroops(aiPlayer.id, source.id, target.id);
    }
  }

  getState() {
    return {
      players: Array.from(this.players.values()).map(p => ({ id: p.id, nickname: p.nickname, color: p.color })),
      cells: this.cells.map(c => ({ id: c.id, ownerId: c.ownerId, population: Math.floor(c.population) })),
      transfers: this.transfers.map(t => ({
        id: t.id,
        ownerId: t.ownerId,
        x: Math.floor(t.x),
        y: Math.floor(t.y),
        amount: t.amount
      }))
    };
  }

  getFullState() {
    return { 
      players: Array.from(this.players.values()).map(p => ({ id: p.id, nickname: p.nickname, color: p.color })), 
      cells: this.cells,
      transfers: [] 
    };
  }
}
