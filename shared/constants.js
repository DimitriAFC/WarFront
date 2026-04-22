/**
 * Shared game constants for both Client and Server.
 */

export const MAP_SIZE = 2000;
export const TICK_RATE = 15; // 15 ticks per second
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
  [MAP_TYPES.WORLD]: '/assets/maps/world.png',
  [MAP_TYPES.EUROPE]: '/assets/maps/europe.png',
  [MAP_TYPES.NA]: '/assets/maps/north_america.png',
  [MAP_TYPES.SA]: '/assets/maps/south_america.png',
  [MAP_TYPES.ASIA]: '/assets/maps/asia.png',
  [MAP_TYPES.AFRICA]: '/assets/maps/africa.png',
  [MAP_TYPES.JAPAN]: '/assets/maps/japan.png',
};

export const AI_LEVELS = {
  NONE: 'None',
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

export const INITIAL_POPULATION = 10;
export const MAX_CELL_POPULATION = 500;
export const GROWTH_RATE = 0.5;
export const UNIT_SPEED = 2.5; // Pixels per tick
export const TROOP_PERCENTAGE = 0.5; // Send 50% by default

export const MSG_TYPES = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  ROOM_LIST: 'room_list',
  INITIAL_STATE: 'initial_state',
  GAME_UPDATE: 'game_update',
  SEND_TROOPS: 'send_troops',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  ERROR: 'error',
};
