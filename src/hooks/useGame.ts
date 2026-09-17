import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine, type EngineStats } from '@/game/engine';
import type { GamePhase, MapId, UpgradeState } from '@/game/types';
import {
  loadCannonColor, loadCurrentMap, loadHighScore, loadTotalCoins,
  loadUnlockedMaps, loadUpgrades, saveCannonColor, saveCurrentMap,
  saveHighScore, saveTotalCoins, saveUnlockedMaps, saveUpgrades,
} from '@/game/storage';
import { initAudio, playSound, setMuted } from '@/game/audio';

const DEFAULT_STATS: EngineStats = {
  score: 0,
  currentHp: 1000,
  maxHp: 1000,
  currentLevel: 1,
  levelProgress: 0,
  maxLevelProgress: 100,
  totalCoins: 0,
  highScore: 0,
  combo: 0,
  powerUps: { shield: 0, rapidFire: 0, bomb: 0 },
};

export function useGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [stats, setStats] = useState<EngineStats>(DEFAULT_STATS);
  const [upgrades, setUpgrades] = useState<UpgradeState>(() => loadUpgrades());
  const [currentMap, setCurrentMap] = useState<MapId>(() => loadCurrentMap());
  const [unlockedMaps, setUnlockedMaps] = useState<MapId[]>(() => loadUnlockedMaps());
  const [cannonColor, setCannonColor] = useState<string>(() => loadCannonColor());
  const [totalCoins, setTotalCoins] = useState<number>(() => loadTotalCoins());
  const [highScore, setHighScore] = useState<number>(() => loadHighScore());
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GameEngine(
      canvasRef.current,
      upgrades,
      currentMap,
      cannonColor,
      totalCoins,
      highScore,
      {
        onStatsChange: (s) => {
          setStats(s);
          if (s.totalCoins !== totalCoins) {
            setTotalCoins(s.totalCoins);
            saveTotalCoins(s.totalCoins);
          }
          if (s.highScore !== highScore) {
            setHighScore(s.highScore);
            saveHighScore(s.highScore);
          }
        },
        onGameOver: (finalScore, _coinsEarned) => {
          setPhase('gameover');
          if (finalScore > highScore) {
            setHighScore(finalScore);
            saveHighScore(finalScore);
          }
        },
      }
    );
    engineRef.current = engine;

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      engine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGame = useCallback(() => {
    initAudio();
    engineRef.current?.startGame();
    setPhase('playing');
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.pause();
    setPhase('paused');
  }, []);

  const resume = useCallback(() => {
    engineRef.current?.resume();
    setPhase('playing');
  }, []);

  const goToMenu = useCallback(() => {
    engineRef.current?.goToMenu();
    setPhase('menu');
  }, []);

  const selectMap = useCallback((mapId: MapId, cost: number) => {
    if (unlockedMaps.includes(mapId)) {
      setCurrentMap(mapId);
      saveCurrentMap(mapId);
      engineRef.current?.setMap(mapId);
    } else if (totalCoins >= cost) {
      const newCoins = totalCoins - cost;
      setTotalCoins(newCoins);
      saveTotalCoins(newCoins);
      const newMaps = [...unlockedMaps, mapId];
      setUnlockedMaps(newMaps);
      saveUnlockedMaps(newMaps);
      setCurrentMap(mapId);
      saveCurrentMap(mapId);
      engineRef.current?.setMap(mapId);
      playSound('coin');
    }
  }, [unlockedMaps, totalCoins]);

  const buyUpgrade = useCallback((id: 'fireRateLevel' | 'firePowerLevel' | 'magnetLevel' | 'multishot') => {
    const costs: Record<string, number> = {
      fireRateLevel: upgrades.fireRateLevel * 100,
      firePowerLevel: upgrades.firePowerLevel * 150,
      magnetLevel: (upgrades.magnetLevel + 1) * 200,
      multishot: 500,
    };
    const cost = costs[id];
    if (totalCoins < cost) return;

    const newCoins = totalCoins - cost;
    setTotalCoins(newCoins);
    saveTotalCoins(newCoins);

    const newUpgrades = { ...upgrades };
    if (id === 'multishot') {
      newUpgrades.hasMultishot = true;
    } else {
      newUpgrades[id] = upgrades[id] + 1;
    }
    setUpgrades(newUpgrades);
    saveUpgrades(newUpgrades);
    playSound('coin');
  }, [upgrades, totalCoins]);

  const changeCannonColor = useCallback((color: string) => {
    setCannonColor(color);
    saveCannonColor(color);
    engineRef.current?.setCannonColor(color);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      setMuted(next);
      return next;
    });
  }, []);

  return {
    canvasRef,
    phase,
    stats,
    upgrades,
    currentMap,
    unlockedMaps,
    cannonColor,
    totalCoins,
    highScore,
    muted,
    startGame,
    pause,
    resume,
    goToMenu,
    selectMap,
    buyUpgrade,
    changeCannonColor,
    toggleMute,
  };
}
