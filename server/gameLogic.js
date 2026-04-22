import {
  GRID_WIDTH, GRID_HEIGHT, GROWTH_RATE, CAPTURE_COST_NEUTRAL,
  CAPTURE_COST_ENEMY, MAX_EXPANSION_PER_TICK, AI_LEVELS,
  INITIAL_POPULATION, SPAWN_RADIUS, MAP_TYPES
} from '../shared/constants.js';

export class Game {
  constructor(config = {}) {
    this.id = config.id || Math.random().toString(36).substring(7);
    this.mapType = config.mapType || MAP_TYPES.WORLD;
    this.aiLevel = config.aiLevel || AI_LEVELS.NONE;
    this.players = new Map();       // id -> { id, nickname, color, isAI, population, territoryCount, targetX, targetY, index }
    this.playerIndex = 0;           // Auto-increment for compact grid encoding

    // Grid: flat array, 0 = neutral, N = player index
    this.grid = new Array(GRID_WIDTH * GRID_HEIGHT).fill(0);
    this.changedCells = [];         // Cells changed since last state push

    if (this.aiLevel !== AI_LEVELS.NONE) {
      this.initAI();
    }
  }

  // Get grid value at (x, y)
  getCell(x, y) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return -1;
    return this.grid[y * GRID_WIDTH + x];
  }

  // Set grid value at (x, y)
  setCell(x, y, ownerIndex) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return;
    this.grid[y * GRID_WIDTH + x] = ownerIndex;
    this.changedCells.push([x, y, ownerIndex]);
  }

  // Spawn a player at a position with a cluster of cells
  spawnPlayer(playerData, cx, cy) {
    for (let dy = -SPAWN_RADIUS; dy <= SPAWN_RADIUS; dy++) {
      for (let dx = -SPAWN_RADIUS; dx <= SPAWN_RADIUS; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
          this.setCell(nx, ny, playerData.index);
        }
      }
    }
    playerData.territoryCount = this.countTerritory(playerData.index);
  }

  countTerritory(playerIndex) {
    let count = 0;
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] === playerIndex) count++;
    }
    return count;
  }

  // Find a random open spawn point
  findSpawnPoint() {
    let attempts = 0;
    while (attempts < 100) {
      const x = Math.floor(Math.random() * (GRID_WIDTH - 20)) + 10;
      const y = Math.floor(Math.random() * (GRID_HEIGHT - 20)) + 10;
      // Check area is neutral
      let clear = true;
      for (let dy = -5; dy <= 5; dy++) {
        for (let dx = -5; dx <= 5; dx++) {
          if (this.getCell(x + dx, y + dy) !== 0) { clear = false; break; }
        }
        if (!clear) break;
      }
      if (clear) return { x, y };
      attempts++;
    }
    // Fallback: random position
    return { x: Math.floor(Math.random() * GRID_WIDTH), y: Math.floor(Math.random() * GRID_HEIGHT) };
  }

  initAI() {
    const aiId = 'ai_' + Math.random().toString(36).substring(7);
    this.playerIndex++;
    const aiPlayer = {
      id: aiId, nickname: `Bot`, color: '#ffffff', isAI: true,
      population: INITIAL_POPULATION, territoryCount: 0,
      targetX: GRID_WIDTH / 2, targetY: GRID_HEIGHT / 2,
      index: this.playerIndex
    };
    this.players.set(aiId, aiPlayer);
    const spawn = this.findSpawnPoint();
    this.spawnPlayer(aiPlayer, spawn.x, spawn.y);
  }

  addPlayer(id, nickname, color) {
    this.playerIndex++;
    const player = {
      id, nickname, color, isAI: false,
      population: INITIAL_POPULATION, territoryCount: 0,
      targetX: GRID_WIDTH / 2, targetY: GRID_HEIGHT / 2,
      index: this.playerIndex
    };
    this.players.set(id, player);
    const spawn = this.findSpawnPoint();
    this.spawnPlayer(player, spawn.x, spawn.y);
  }

  removePlayer(id) {
    const player = this.players.get(id);
    if (!player) return;
    // Clear all cells owned by this player
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] === player.index) {
        this.grid[i] = 0;
        const x = i % GRID_WIDTH;
        const y = Math.floor(i / GRID_WIDTH);
        this.changedCells.push([x, y, 0]);
      }
    }
    this.players.delete(id);
  }

  setTarget(playerId, targetX, targetY) {
    const player = this.players.get(playerId);
    if (player) {
      player.targetX = Math.max(0, Math.min(GRID_WIDTH - 1, targetX));
      player.targetY = Math.max(0, Math.min(GRID_HEIGHT - 1, targetY));
    }
  }

  // Find all border cells for a given player index
  findBorderCells(playerIndex) {
    const borders = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (this.grid[y * GRID_WIDTH + x] !== playerIndex) continue;
        // Check if at least one neighbor is different
        const neighbors = [
          this.getCell(x - 1, y), this.getCell(x + 1, y),
          this.getCell(x, y - 1), this.getCell(x, y + 1)
        ];
        if (neighbors.some(n => n !== playerIndex && n !== -1)) {
          borders.push({ x, y });
        }
      }
    }
    return borders;
  }

  update() {
    this.changedCells = [];

    // 1. Population Growth — proportional to territory
    for (const player of this.players.values()) {
      player.territoryCount = this.countTerritory(player.index);
      player.population += player.territoryCount * GROWTH_RATE;
    }

    // 2. Auto-expansion for each player
    for (const player of this.players.values()) {
      this.expandPlayer(player);
    }

    // 3. AI logic
    if (this.aiLevel !== AI_LEVELS.NONE) {
      this.updateAI();
    }

    return this.getState();
  }

  expandPlayer(player) {
    if (player.population < CAPTURE_COST_NEUTRAL) return;

    const borders = this.findBorderCells(player.index);
    if (borders.length === 0) return;

    // Sort by distance to target (closest first = prioritized expansion)
    borders.sort((a, b) => {
      const distA = Math.hypot(a.x - player.targetX, a.y - player.targetY);
      const distB = Math.hypot(b.x - player.targetX, b.y - player.targetY);
      return distA - distB;
    });

    let expansions = 0;
    const maxExpansions = MAX_EXPANSION_PER_TICK;

    for (const border of borders) {
      if (expansions >= maxExpansions || player.population < CAPTURE_COST_NEUTRAL) break;

      // Try each neighbor of this border cell
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      // Shuffle directions for organic look
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
      }

      for (const [dx, dy] of dirs) {
        if (expansions >= maxExpansions || player.population < CAPTURE_COST_NEUTRAL) break;
        const nx = border.x + dx;
        const ny = border.y + dy;
        const neighborOwner = this.getCell(nx, ny);

        if (neighborOwner === -1 || neighborOwner === player.index) continue;

        if (neighborOwner === 0) {
          // Neutral cell
          player.population -= CAPTURE_COST_NEUTRAL;
          this.setCell(nx, ny, player.index);
          expansions++;
        } else {
          // Enemy cell
          if (player.population >= CAPTURE_COST_ENEMY) {
            player.population -= CAPTURE_COST_ENEMY;
            this.setCell(nx, ny, player.index);
            expansions++;
          }
        }
      }
    }
  }

  updateAI() {
    for (const player of this.players.values()) {
      if (!player.isAI) continue;

      // Change target periodically
      const changeChance = this.aiLevel === AI_LEVELS.EASY ? 0.01 :
                           this.aiLevel === AI_LEVELS.MEDIUM ? 0.02 :
                           this.aiLevel === AI_LEVELS.HARD ? 0.03 : 0.05;

      if (Math.random() < changeChance) {
        if (this.aiLevel === AI_LEVELS.EASY) {
          // Random target
          player.targetX = Math.floor(Math.random() * GRID_WIDTH);
          player.targetY = Math.floor(Math.random() * GRID_HEIGHT);
        } else {
          // Target nearest human player territory
          let bestTarget = null;
          let bestDist = Infinity;

          for (const other of this.players.values()) {
            if (other.id === player.id || other.isAI) continue;
            // Find center of other player's territory
            let sumX = 0, sumY = 0, count = 0;
            for (let i = 0; i < this.grid.length; i++) {
              if (this.grid[i] === other.index) {
                sumX += i % GRID_WIDTH;
                sumY += Math.floor(i / GRID_WIDTH);
                count++;
              }
            }
            if (count > 0) {
              const cx = sumX / count;
              const cy = sumY / count;
              const aiCenterX = player.targetX;
              const aiCenterY = player.targetY;
              const dist = Math.hypot(cx - aiCenterX, cy - aiCenterY);
              if (dist < bestDist) {
                bestDist = dist;
                bestTarget = { x: cx, y: cy };
              }
            }
          }

          if (bestTarget) {
            player.targetX = Math.floor(bestTarget.x);
            player.targetY = Math.floor(bestTarget.y);
          } else {
            player.targetX = Math.floor(Math.random() * GRID_WIDTH);
            player.targetY = Math.floor(Math.random() * GRID_HEIGHT);
          }
        }
      }
    }
  }

  getState() {
    return {
      players: Array.from(this.players.values()).map(p => ({
        id: p.id, nickname: p.nickname, color: p.color,
        index: p.index, population: Math.floor(p.population),
        territoryCount: p.territoryCount
      })),
      changes: this.changedCells
    };
  }

  getFullState() {
    return {
      mapType: this.mapType,
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      grid: [...this.grid],
      players: Array.from(this.players.values()).map(p => ({
        id: p.id, nickname: p.nickname, color: p.color,
        index: p.index, population: Math.floor(p.population),
        territoryCount: p.territoryCount
      }))
    };
  }
}
