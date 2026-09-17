import { RotateCcw, Home, Coins, Trophy } from 'lucide-react';

interface GameOverModalProps {
  finalScore: number;
  totalCoins: number;
  highScore: number;
  onRestart: () => void;
  onHome: () => void;
}

export function GameOverModal({ finalScore, totalCoins, highScore, onRestart, onHome }: GameOverModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <div className="w-[88%] max-w-xs rounded-3xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
        <h2 className="mb-4 text-2xl font-black text-red-500">GAME OVER</h2>

        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-center gap-2 text-lg text-white">
            <span className="text-sm text-slate-400">SCORE</span>
            <span className="font-black text-sky-400">{finalScore}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-base text-yellow-400">
            <Coins className="h-4 w-4" />
            <span className="font-black">{totalCoins}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Trophy className="h-3.5 w-3.5" />
            <span>Best: {highScore}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={onRestart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 font-bold text-white transition-all hover:bg-green-500 active:scale-95"
          >
            <RotateCcw className="h-5 w-5" /> PLAY AGAIN
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
