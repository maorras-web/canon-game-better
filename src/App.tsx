import { useGame } from '@/hooks/useGame';
import { HUD } from '@/components/HUD';
import { StartMenu } from '@/components/StartMenu';
import { PauseMenu } from '@/components/PauseMenu';
import { GameOverModal } from '@/components/GameOverModal';

function App() {
  const game = useGame();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <canvas
        ref={game.canvasRef}
        className="absolute inset-0 z-0 touch-none"
      />

      {game.phase === 'playing' && (
        <HUD
          stats={game.stats}
          muted={game.muted}
          onPause={game.pause}
          onToggleMute={game.toggleMute}
        />
      )}

      {game.phase === 'menu' && (
        <StartMenu
          totalCoins={game.totalCoins}
          highScore={game.highScore}
          upgrades={game.upgrades}
          currentMap={game.currentMap}
          unlockedMaps={game.unlockedMaps}
          cannonColor={game.cannonColor}
          onStart={game.startGame}
          onBuyUpgrade={game.buyUpgrade}
          onSelectMap={game.selectMap}
          onChangeCannonColor={game.changeCannonColor}
        />
      )}

      {game.phase === 'paused' && (
        <PauseMenu
          cannonColor={game.cannonColor}
          onResume={game.resume}
          onHome={game.goToMenu}
          onChangeCannonColor={game.changeCannonColor}
        />
      )}

      {game.phase === 'gameover' && (
        <GameOverModal
          finalScore={game.stats.score}
          totalCoins={game.totalCoins}
          highScore={game.highScore}
          onRestart={game.startGame}
          onHome={game.goToMenu}
        />
      )}
    </div>
  );
}

export default App;
