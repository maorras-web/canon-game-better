import type { MapId, UpgradeState } from './types';

const KEYS = {
  coins: 'bb2d_total_coins',
  highScore: 'bb2d_high_score',
  fireRate: 'bb2d_lvl_firerate',
  firePower: 'bb2d_lvl_firepower',
  magnet: 'bb2d_lvl_magnet',
  multishot: 'bb2d_has_multishot',
  map: 'bb2d_selected_map',
  unlockedMaps: 'bb2d_unlocked_maps',
  cannonColor: 'bb2d_cannon_color',
};

function readNum(key: string, fallback = 0): number {
  const v = localStorage.getItem(key);
  if (v === null) return fallback;
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

function readStr(key: string, fallback: string): string {
  return localStorage.getItem(key) ?? fallback;
}

function readBool(key: string, fallback = false): boolean {
  const v = localStorage.getItem(key);
  if (v === null) return fallback;
  return v === 'true';
}

export function loadUpgrades(): UpgradeState {
  return {
    fireRateLevel: readNum(KEYS.fireRate, 1),
    firePowerLevel: readNum(KEYS.firePower, 1),
    magnetLevel: readNum(KEYS.magnet, 0),
    hasMultishot: readBool(KEYS.multishot, false),
  };
}

export function saveUpgrades(u: UpgradeState): void {
  localStorage.setItem(KEYS.fireRate, String(u.fireRateLevel));
  localStorage.setItem(KEYS.firePower, String(u.firePowerLevel));
  localStorage.setItem(KEYS.magnet, String(u.magnetLevel));
  localStorage.setItem(KEYS.multishot, String(u.hasMultishot));
}

export function loadTotalCoins(): number {
  return readNum(KEYS.coins, 0);
}

export function saveTotalCoins(v: number): void {
  localStorage.setItem(KEYS.coins, String(Math.floor(v)));
}

export function loadHighScore(): number {
  return readNum(KEYS.highScore, 0);
}

export function saveHighScore(v: number): void {
  localStorage.setItem(KEYS.highScore, String(Math.floor(v)));
}

export function loadCurrentMap(): MapId {
  const v = readStr(KEYS.map, 'day');
  return (['day', 'sunset', 'space'] as const).includes(v as MapId) ? (v as MapId) : 'day';
}

export function saveCurrentMap(m: MapId): void {
  localStorage.setItem(KEYS.map, m);
}

export function loadUnlockedMaps(): MapId[] {
  try {
    const raw = localStorage.getItem(KEYS.unlockedMaps);
    if (!raw) return ['day'];
    const parsed = JSON.parse(raw) as string[];
    const valid = parsed.filter((m): m is MapId =>
      ['day', 'sunset', 'space'].includes(m)
    );
    return valid.length > 0 ? valid : ['day'];
  } catch {
    return ['day'];
  }
}

export function saveUnlockedMaps(maps: MapId[]): void {
  localStorage.setItem(KEYS.unlockedMaps, JSON.stringify(maps));
}

export function loadCannonColor(): string {
  return readStr(KEYS.cannonColor, '#2563eb');
}

export function saveCannonColor(c: string): void {
  localStorage.setItem(KEYS.cannonColor, c);
}
