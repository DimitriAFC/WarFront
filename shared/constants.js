/**
 * Shared game constants for both Client and Server.
 * v2 — Pixel Grid Conquest System
 */

export const MAP_SIZE = 2000;       // Display size in pixels
export const GRID_WIDTH = 200;      // Grid columns
export const GRID_HEIGHT = 200;     // Grid rows
export const CELL_SIZE = MAP_SIZE / GRID_WIDTH; // 10px per cell

export const TICK_RATE = 15;
export const TICK_INTERVAL = 1000 / TICK_RATE;

export const PLAYER_COLORS = [
  '#FF5252', // Red
  '#448AFF', // Blue
  '#4CAF50', // Green
  '#FFEB3B', // Yellow
  '#E040FB', // Purple
  '#00BCD4', // Cyan
  '#FF9800', // Orange
];

export const MAP_TYPES = {
  WORLD: 'MONDE',
  EUROPE: 'EUROPE',
  NA: 'AMÉRIQUE DU NORD',
  SA: 'AMÉRIQUE DU SUD',
  ASIA: 'ASIE',
  AFRICA: 'AFRIQUE',
  JAPAN: 'JAPAN',
};

export const MAP_ASSETS = {
  [MAP_TYPES.WORLD]: '/assets/maps/v2/world.png',
  [MAP_TYPES.EUROPE]: '/assets/maps/v2/europe.png',
  [MAP_TYPES.NA]: '/assets/maps/v2/north_america.png',
  [MAP_TYPES.SA]: '/assets/maps/v2/south_america.png',
  [MAP_TYPES.ASIA]: '/assets/maps/v2/asia.png',
  [MAP_TYPES.AFRICA]: '/assets/maps/v2/africa.png',
  [MAP_TYPES.JAPAN]: '/assets/maps/v2/japan.png',
};

export const AI_LEVELS = {
  NONE: 'None',
  EASY: 'FACILE',
  MEDIUM: 'MOYEN',
  HARD: 'DIFFICILE',
  IMPOSSIBLE: 'IMPOSSIBLE',
};

export const GAME_MODES = {
  FFA: 'CHACUN POUR SOI',
  TEAMS: 'ÉQUIPES',
};

// Gameplay tuning
export const GROWTH_RATE = 0.15;           // Pop gained per owned cell per tick
export const CAPTURE_COST_NEUTRAL = 1;     // Pop cost to capture a neutral cell
export const CAPTURE_COST_ENEMY = 2;       // Pop cost to capture an enemy cell
export const MAX_EXPANSION_PER_TICK = 6;   // Max cells a player can capture per tick
export const INITIAL_POPULATION = 50;      // Starting population
export const SPAWN_RADIUS = 2;             // Radius of starting territory (5x5 block)

export const MSG_TYPES = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  INITIAL_STATE: 'initial_state',
  GAME_UPDATE: 'game_update',
  SET_TARGET: 'set_target',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  ERROR: 'error',
};
