import { useState } from 'react';
import { Play, Coins, Zap, Target, Magnet, GitBranch, Mountain, Check } from 'lucide-react';
import type { MapId, UpgradeState } from '@/game/types';
import { MAP_DEFS, CANNON_COLORS } from '@/game/types';

interface StartMenuProps {
  totalCoins: number;
  highScore: number;
  upgrades: UpgradeState;
  currentMap: MapId;
  unlockedMaps: MapId[];
  cannonColor: string;
  onStart: () => void;
  onBuyUpgrade: (id: 'fireRateLevel' | 'firePowerLevel' | 'magnetLevel' | 'multishot') => void;
  onSelectMap: (mapId: MapId, cost: number) => void;
  onChangeCannonColor: (color: string) => void;
}

type Tab = 'play' | 'shop' | 'maps';

export function StartMenu(props: StartMenuProps) {
  const [tab, setTab] = useState<Tab>('play');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <div className="w-[90%] max-w-sm rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h1 className="text-center text-3xl font-black tracking-tight text-sky-400">BALL BLAST</h1>
        <p className="mb-4 text-center text-xs text-slate-400">Upgrade your cannon & unlock maps</p>

        <div className="mb-4 flex justify-center gap-3">
          <div className="rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-slate-200">
            BEST: <span className="text-white">{props.highScore}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-yellow-400">
            <Coins className="h-3.5 w-3.5" />
            {props.totalCoins}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1.5 rounded-xl bg-white/5 p-1">
          {(['play', 'shop', 'maps'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wide transition-all ${
                tab === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'play' && (
          <div className="space-y-3">
            <button
              onClick={props.onStart}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-bold text-white transition-all hover:bg-blue-500 active:scale-95"
            >
              <Play className="h-5 w-5 fill-white" />
              START GAME
            </button>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Cannon Color</p>
              <div className="flex justify-center gap-2.5">
                {CANNON_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => props.onChangeCannonColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      props.cannonColor === c ? 'border-white scale-110' : 'border-white/30'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'shop' && <ShopTab {...props} />}

        {tab === 'maps' && <MapsTab {...props} />}
      </div>
    </div>
  );
}

function ShopTab({ upgrades, totalCoins, onBuyUpgrade }: StartMenuProps) {
  const items = [
    {
      id: 'fireRateLevel' as const,
      name: 'Fire Rate',
      icon: Zap,
      level: upgrades.fireRateLevel,
      cost: upgrades.fireRateLevel * 100,
    },
    {
      id: 'firePowerLevel' as const,
      name: 'Fire Power',
      icon: Target,
      level: upgrades.firePowerLevel,
      cost: upgrades.firePowerLevel * 150,
    },
    {
      id: 'magnetLevel' as const,
      name: 'Coin Magnet',
      icon: Magnet,
      level: upgrades.magnetLevel,
      cost: (upgrades.magnetLevel + 1) * 200,
    },
    {
      id: 'multishot' as const,
      name: 'Triple Cannon',
      icon: GitBranch,
      level: upgrades.hasMultishot ? 1 : 0,
      cost: 500,
      owned: upgrades.hasMultishot,
    },
  ];

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        const canAfford = totalCoins >= item.cost;
        const isOwned = 'owned' in item && item.owned;
        return (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 p-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
                <Icon className="h-4.5 w-4.5 text-sky-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{item.name}</p>
                <p className="text-[10px] text-sky-400">
                  {isOwned ? 'Unlocked' : `Level ${item.level}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => onBuyUpgrade(item.id)}
              disabled={isOwned || !canAfford}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                isOwned
                  ? 'bg-green-600/30 text-green-400'
                  : canAfford
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300 active:scale-95'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {isOwned ? (
                <>
                  <Check className="h-3.5 w-3.5" /> OWNED
                </>
              ) : (
                <>
                  <Coins className="h-3.5 w-3.5" /> {item.cost}
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MapsTab({ currentMap, unlockedMaps, totalCoins, onSelectMap }: StartMenuProps) {
  return (
    <div className="space-y-2">
      {MAP_DEFS.map((m) => {
        const isUnlocked = unlockedMaps.includes(m.id);
        const isSelected = currentMap === m.id;
        const canAfford = totalCoins >= m.cost;
        return (
          <div
            key={m.id}
            className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
              isSelected
                ? 'border-green-500 bg-green-500/10'
                : 'border-white/8 bg-white/4'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                style={{ background: `linear-gradient(135deg, ${m.gradient[0]}, ${m.gradient[2]})` }}
              >
                <Mountain className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-xs font-bold text-white">{m.name}</span>
            </div>
            <button
              onClick={() => onSelectMap(m.id, m.cost)}
              disabled={!isUnlocked && !canAfford}
              className={`rounded-lg px-3 py-1.5 text-xs font-black transition-all ${
                isSelected
                  ? 'bg-green-600 text-white'
                  : isUnlocked
                  ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'
                  : canAfford
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300 active:scale-95'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="mr-1 inline h-3.5 w-3.5" /> SELECTED
                </>
              ) : isUnlocked ? (
                'USE'
              ) : (
                <>
                  <Coins className="mr-1 inline h-3.5 w-3.5" /> {m.cost}
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
