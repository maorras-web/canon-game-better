import { Pause, Volume2, VolumeX, Coins } from 'lucide-react';
import type { EngineStats } from '@/game/engine';

interface HUDProps {
  stats: EngineStats;
  muted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
}

export function HUD({ stats, muted, onPause, onToggleMute }: HUDProps) {
  const hpPct = Math.max(0, (stats.currentHp / stats.maxHp) * 100);
  const hpColor = hpPct < 30 ? '#ef4444' : hpPct < 60 ? '#eab308' : '#22c55e';
  const levelPct = Math.min(100, (stats.levelProgress / stats.maxLevelProgress) * 100);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3">
      {/* HP bar */}
      <div className="pointer-events-auto">
        <div className="relative h-6 w-24 overflow-hidden rounded-full border-2 border-white/30 bg-black/60">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: `${hpPct}%`, backgroundColor: hpColor }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow">
            {Math.max(0, stats.currentHp)} / {stats.maxHp}
          </span>
        </div>
      </div>

      {/* Level + combo */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-black tracking-wider text-white drop-shadow-lg">
          LEVEL {stats.currentLevel}
        </span>
        <div className="h-2 w-20 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full bg-yellow-400 transition-all duration-100"
            style={{ width: `${levelPct}%` }}
          />
        </div>
        {stats.combo >= 5 && (
          <span className="mt-0.5 rounded-full bg-yellow-400/90 px-2 py-0.5 text-[10px] font-black text-black">
            {stats.combo}x COMBO
          </span>
        )}
      </div>

      {/* Coins + score */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-yellow-400/40 bg-slate-900/75 px-2 py-1">
          <Coins className="h-3.5 w-3.5 text-yellow-400" />
          <span className="text-sm font-black text-yellow-400">{stats.totalCoins}</span>
        </div>
        <div className="flex flex-col items-center rounded-lg border border-white/20 bg-slate-900/75 px-2.5 py-0.5">
          <span className="text-[8px] font-bold text-slate-400">SCORE</span>
          <span className="text-sm font-black text-white">{stats.score}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="pointer-events-auto flex gap-1.5">
        <button
          onClick={onToggleMute}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-slate-900/80 text-white"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          onClick={onPause}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-slate-900/80 text-white"
        >
          <Pause className="h-4 w-4" />
        </button>
      </div>

      {/* Power-up indicators */}
      <div className="pointer-events-none absolute left-1/2 top-14 flex -translate-x-1/2 gap-2">
        {stats.powerUps.shield > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-cyan-500/80 px-2.5 py-1 text-[10px] font-bold text-white">
            SHIELD {Math.ceil(stats.powerUps.shield)}s
          </div>
        )}
        {stats.powerUps.rapidFire > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-amber-500/80 px-2.5 py-1 text-[10px] font-bold text-white">
            RAPID {Math.ceil(stats.powerUps.rapidFire)}s
          </div>
        )}
      </div>
    </div>
  );
}
