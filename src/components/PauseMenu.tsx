import { Play, Home } from 'lucide-react';
import { CANNON_COLORS } from '@/game/types';

interface PauseMenuProps {
  cannonColor: string;
  onResume: () => void;
  onHome: () => void;
  onChangeCannonColor: (color: string) => void;
}

export function PauseMenu({ cannonColor, onResume, onHome, onChangeCannonColor }: PauseMenuProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <div className="w-[88%] max-w-xs rounded-3xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
        <h2 className="mb-5 text-xl font-black text-white">GAME PAUSED</h2>

        <div className="mb-5">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Cannon Color</p>
          <div className="flex justify-center gap-2.5">
            {CANNON_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onChangeCannonColor(c)}
                className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  cannonColor === c ? 'border-white scale-110' : 'border-white/30'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 font-bold text-white transition-all hover:bg-blue-500 active:scale-95"
          >
            <Play className="h-5 w-5 fill-white" /> RESUME
          </button>
          <button
            onClick={onHome}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-700 py-3.5 font-bold text-white transition-all hover:bg-slate-600 active:scale-95"
          >
            <Home className="h-5 w-5" /> MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
