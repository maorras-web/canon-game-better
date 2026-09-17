export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover';

export type MapId = 'day' | 'sunset' | 'space';

export interface UpgradeState {
  fireRateLevel: number;
  firePowerLevel: number;
  magnetLevel: number;
  hasMultishot: boolean;
}

export interface GameStats {
  score: number;
  currentHp: number;
  maxHp: number;
  currentLevel: number;
  levelProgress: number;
  maxLevelProgress: number;
  totalCoins: number;
  highScore: number;
  combo: number;
}

export interface PowerUpState {
  shield: number;
  rapidFire: number;
  bomb: number;
}

export type PowerUpType = 'shield' | 'rapidFire' | 'bomb';

export interface GameState {
  phase: GamePhase;
  stats: GameStats;
  upgrades: UpgradeState;
  currentMap: MapId;
  unlockedMaps: MapId[];
  cannonColor: string;
  powerUps: PowerUpState;
}

export interface UpgradeDef {
  id: keyof UpgradeState | 'multishot';
  name: string;
  description: string;
  getLevel: (u: UpgradeState) => number;
  getCost: (u: UpgradeState) => number;
  canBuy: (u: UpgradeState, coins: number) => boolean;
}

export interface MapDef {
  id: MapId;
  name: string;
  emoji: string;
  cost: number;
  gradient: [string, string, string];
}

export const MAP_DEFS: MapDef[] = [
  { id: 'day', name: 'Day Mountains', emoji: '☀', cost: 0, gradient: ['#38bdf8', '#bae6fd', '#e0f2fe'] },
  { id: 'sunset', name: 'Sunset Hills', emoji: '◐', cost: 500, gradient: ['#4c1d95', '#c026d3', '#f97316'] },
  { id: 'space', name: 'Neon Space', emoji: '✦', cost: 1500, gradient: ['#030712', '#1e1b4b', '#0f172a'] },
];

export const CANNON_COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#f59e0b',
  '#0891b2',
];
