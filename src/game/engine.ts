import type { GamePhase, MapId, UpgradeState, PowerUpState } from './types';
import { playSound } from './audio';

interface Vec2 { x: number; y: number; }

interface Rock {
  x: number; y: number; vx: number; vy: number;
  gravity: number; bounceForce: number;
  radius: number; hp: number; maxHp: number;
  sizeIndex: number; color: string;
  vertices: Vec2[];
  rotation: number; rotationSpeed: number;
}

interface Bullet {
  x: number; y: number; radius: number; dmg: number;
  vx: number; vy: number; trail: Vec2[];
}

interface Coin {
  x: number; y: number; vx: number; vy: number;
  radius: number; gravity: number; value: number;
  rotation: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  radius: number; color: string; alpha: number; decay: number;
  gravity: number;
}

interface FloatingText {
  x: number; y: number; text: string; alpha: number; vy: number;
  color: string; size: number;
}

interface PowerUpDrop {
  x: number; y: number; vx: number; vy: number;
  radius: number; type: 'shield' | 'rapidFire' | 'bomb';
  gravity: number; rotation: number;
}

interface Cloud {
  x: number; y: number; speed: number; scale: number;
}

interface Star {
  x: number; y: number; size: number; twinkle: number;
}

export interface EngineCallbacks {
  onStatsChange: (stats: EngineStats) => void;
  onGameOver: (finalScore: number, coinsEarned: number) => void;
}

export interface EngineStats {
  score: number;
  currentHp: number;
  maxHp: number;
  currentLevel: number;
  levelProgress: number;
  maxLevelProgress: number;
  totalCoins: number;
  highScore: number;
  combo: number;
  powerUps: PowerUpState;
}

const MAX_HP = 1000;
const MAX_LEVEL_PROGRESS = 100;
const ROCK_COLORS = ['#ef4444', '#f97316', '#22c55e', '#06b6d4', '#ec4899', '#8b5cf6'];

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cb: EngineCallbacks;
  private upgrades: UpgradeState;
  private mapId: MapId;
  private cannonColor: string;

  private width = 0;
  private height = 0;
  private dpr = 1;

  private phase: GamePhase = 'menu';
  private rocks: Rock[] = [];
  private bullets: Bullet[] = [];
  private coinsList: Coin[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private powerUpDrops: PowerUpDrop[] = [];
  private clouds: Cloud[] = [];
  private stars: Star[] = [];

  private score = 0;
  private currentHp = MAX_HP;
  private currentLevel = 1;
  private levelProgress = 0;
  private totalCoins = 0;
  private highScore = 0;
  private coinsEarned = 0;
  private combo = 0;
  private comboTimer = 0;

  private powerUps: PowerUpState = { shield: 0, rapidFire: 0, bomb: 0 };
  private hasShield = false;
  private rapidFireTimer = 0;

  private cannon = { x: 0, y: 0, targetX: 0 };
  private shootTimer = 0;
  private lastTime = 0;
  private rafId = 0;

  private isFiring = false;
  private pointerActive = false;
  private pointerX = 0;
  private pointerY = 0;

  private spawnTimer = 0;
  private screenShake = 0;
  private flashAlpha = 0;

  constructor(
    canvas: HTMLCanvasElement,
    upgrades: UpgradeState,
    mapId: MapId,
    cannonColor: string,
    totalCoins: number,
    highScore: number,
    cb: EngineCallbacks
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;
    this.upgrades = upgrades;
    this.mapId = mapId;
    this.cannonColor = cannonColor;
    this.totalCoins = totalCoins;
    this.highScore = highScore;
    this.cb = cb;

    this.resize();
    this.initClouds();
    this.initStars();
    this.bindEvents();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  // --- Setup ---

  resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.initClouds();
    this.initStars();
  }

  private initClouds(): void {
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.25) + 40,
        speed: Math.random() * 15 + 10,
        scale: Math.random() * 0.5 + 0.8,
      });
    }
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.7),
        size: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  // --- Event binding ---

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.pointerActive = true;
    this.isFiring = true;
    this.pointerX = e.clientX;
    this.pointerY = e.clientY;
    if (this.phase === 'playing') {
      this.cannon.targetX = e.clientX;
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    this.pointerX = e.clientX;
    this.pointerY = e.clientY;
    if (this.pointerActive && this.phase === 'playing') {
      this.cannon.targetX = e.clientX;
    }
  };

  private onPointerUp = (): void => {
    this.pointerActive = false;
    this.isFiring = false;
  };

  // --- Public controls ---

  startGame(): void {
    this.resetGame();
    this.phase = 'playing';
    this.emitStats();
  }

  pause(): void {
    if (this.phase === 'playing') this.phase = 'paused';
  }

  resume(): void {
    if (this.phase === 'paused') this.phase = 'playing';
  }

  goToMenu(): void {
    this.phase = 'menu';
    this.resetGame();
  }

  setMap(mapId: MapId): void {
    this.mapId = mapId;
  }

  setCannonColor(color: string): void {
    this.cannonColor = color;
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  // --- Game logic ---

  private resetGame(): void {
    this.score = 0;
    this.currentHp = MAX_HP;
    this.currentLevel = 1;
    this.levelProgress = 0;
    this.coinsEarned = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.powerUps = { shield: 0, rapidFire: 0, bomb: 0 };
    this.hasShield = false;
    this.rapidFireTimer = 0;
    this.rocks = [];
    this.bullets = [];
    this.coinsList = [];
    this.particles = [];
    this.floatingTexts = [];
    this.powerUpDrops = [];
    this.cannon.x = this.width / 2;
    this.cannon.targetX = this.width / 2;
    this.shootTimer = 0;
    this.spawnTimer = 0;
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.emitStats();
  }

  private emitStats(): void {
    this.cb.onStatsChange({
      score: this.score,
      currentHp: this.currentHp,
      maxHp: MAX_HP,
      currentLevel: this.currentLevel,
      levelProgress: this.levelProgress,
      maxLevelProgress: MAX_LEVEL_PROGRESS,
      totalCoins: this.totalCoins,
      highScore: this.highScore,
      combo: this.combo,
      powerUps: { ...this.powerUps },
    });
  }

  private spawnCoins(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI + Math.PI;
      const speed = Math.random() * 180 + 120;
      this.coinsList.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 10,
        gravity: 450,
        value: 1,
        rotation: 0,
      });
    }
  }

  private maybeSpawnPowerUp(x: number, y: number): void {
    if (Math.random() > 0.08) return;
    const types: ('shield' | 'rapidFire' | 'bomb')[] = ['shield', 'rapidFire', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerUpDrops.push({
      x, y, vx: (Math.random() - 0.5) * 100, vy: -150,
      radius: 16, type, gravity: 400, rotation: 0,
    });
  }

  private createExplosion(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 200 + 40;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 1.5 + 1,
        gravity: 200,
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color: string, size: number): void {
    this.floatingTexts.push({ x, y, text, alpha: 1, vy: -60, color, size });
  }

  private createRockVertices(radius: number): Vec2[] {
    const points: Vec2[] = [];
    const numSides = 8;
    for (let i = 0; i < numSides; i++) {
      const angle = (i / numSides) * Math.PI * 2;
      const variance = radius * (0.82 + Math.random() * 0.36);
      points.push({ x: Math.cos(angle) * variance, y: Math.sin(angle) * variance });
    }
    return points;
  }

  private spawnRock(x: number | undefined, y: number | undefined, hp: number, sizeIndex: number): void {
    const radii = [28, 42, 60];
    const radius = radii[sizeIndex];
    const color = ROCK_COLORS[Math.floor(Math.random() * ROCK_COLORS.length)];
    this.rocks.push({
      x: x !== undefined ? x : Math.random() * (this.width - 100) + 50,
      y: y !== undefined ? y : 80,
      vx: (Math.random() > 0.5 ? 1 : -1) * (70 + Math.random() * 40 + this.currentLevel * 5),
      vy: 0,
      gravity: 350,
      bounceForce: -(260 + sizeIndex * 40),
      radius,
      hp,
      maxHp: hp,
      sizeIndex,
      color,
      vertices: this.createRockVertices(radius),
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 2,
    });
  }

  private spawnBullet(): void {
    const damage = this.upgrades.firePowerLevel;
    const speed = 1400;
    if (this.upgrades.hasMultishot) {
      this.bullets.push({ x: this.cannon.x - 16, y: this.cannon.y - 30, radius: 6, dmg: damage, vx: 0, vy: -speed, trail: [] });
      this.bullets.push({ x: this.cannon.x, y: this.cannon.y - 34, radius: 6, dmg: damage, vx: 0, vy: -speed, trail: [] });
      this.bullets.push({ x: this.cannon.x + 16, y: this.cannon.y - 30, radius: 6, dmg: damage, vx: 0, vy: -speed, trail: [] });
    } else {
      this.bullets.push({ x: this.cannon.x - 11, y: this.cannon.y - 30, radius: 6, dmg: damage, vx: 0, vy: -speed, trail: [] });
      this.bullets.push({ x: this.cannon.x + 11, y: this.cannon.y - 30, radius: 6, dmg: damage, vx: 0, vy: -speed, trail: [] });
    }
  }

  private gameOver(): void {
    this.phase = 'gameover';
    playSound('gameover');
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    this.cb.onGameOver(this.score, this.coinsEarned);
  }

  private updateCombo(dt: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }
  }

  private activatePowerUp(type: 'shield' | 'rapidFire' | 'bomb'): void {
    playSound('powerup');
    if (type === 'shield') {
      this.hasShield = true;
      this.powerUps.shield = 10;
      this.addFloatingText(this.cannon.x, this.cannon.y - 50, 'SHIELD!', '#06b6d4', 22);
    } else if (type === 'rapidFire') {
      this.rapidFireTimer = 8;
      this.powerUps.rapidFire = 8;
      this.addFloatingText(this.cannon.x, this.cannon.y - 50, 'RAPID FIRE!', '#f59e0b', 22);
    } else if (type === 'bomb') {
      this.powerUps.bomb = 5;
      for (const r of this.rocks) {
        this.createExplosion(r.x, r.y, r.color, 15);
        this.spawnCoins(r.x, r.y, (r.sizeIndex + 1) * 2);
      }
      this.rocks = [];
      this.screenShake = 20;
      this.flashAlpha = 0.5;
      this.addFloatingText(this.width / 2, this.height / 2, 'BOOM!', '#ef4444', 40);
    }
    this.emitStats();
  }

  // --- Update systems ---

  private updateBullets(dt: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 5) b.trail.shift();
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Draw trail
      for (let t = 0; t < b.trail.length; t++) {
        const tp = b.trail[t];
        const alpha = (t / b.trail.length) * 0.4;
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.beginPath();
        this.ctx.arc(tp.x, tp.y, b.radius * (t / b.trail.length), 0, Math.PI * 2);
        this.ctx.fillStyle = '#fde047';
        this.ctx.fill();
        this.ctx.restore();
      }

      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#facc15';
      this.ctx.fill();
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = '#fde047';
      this.ctx.stroke();

      if (b.y < -10 || b.x < -10 || b.x > this.width + 10) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private updateRocks(dt: number): void {
    const floorY = this.height - 60;

    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      r.vy += r.gravity * dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.rotation += r.rotationSpeed * dt;

      if (r.x - r.radius <= 0) {
        r.x = r.radius;
        r.vx = Math.abs(r.vx);
      } else if (r.x + r.radius >= this.width) {
        r.x = this.width - r.radius;
        r.vx = -Math.abs(r.vx);
      }

      if (r.y + r.radius >= floorY) {
        r.y = floorY - r.radius;
        r.vy = r.bounceForce;
      }

      // Cannon collision
      const distToCannon = Math.hypot(r.x - this.cannon.x, r.y - this.cannon.y);
      if (distToCannon < r.radius + 26) {
        if (this.hasShield) {
          r.vy = r.bounceForce * 1.5;
          r.vx = (r.x < this.cannon.x ? -1 : 1) * 200;
          this.createExplosion(this.cannon.x, this.cannon.y - 10, '#06b6d4', 8);
          playSound('hit');
        } else {
          this.currentHp -= 25;
          playSound('hit');
          this.createExplosion(this.cannon.x, this.cannon.y - 10, '#ef4444', 12);
          this.screenShake = 12;
          this.flashAlpha = 0.3;
          r.vy = r.bounceForce;
          r.vx = (r.x < this.cannon.x ? -1 : 1) * 150;
          this.emitStats();
          if (this.currentHp <= 0) {
            this.gameOver();
            return;
          }
        }
      }

      // Bullet collisions
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        const distToBullet = Math.hypot(r.x - b.x, r.y - b.y);
        if (distToBullet < r.radius + b.radius) {
          this.bullets.splice(j, 1);
          r.hp -= b.dmg;
          this.combo++;
          this.comboTimer = 2;
          const comboMultiplier = 1 + Math.floor(this.combo / 10) * 0.5;
          const points = Math.floor(10 * comboMultiplier);
          this.score += points;
          this.levelProgress += 3;

          if (this.combo > 0 && this.combo % 10 === 0) {
            this.addFloatingText(r.x, r.y - 20, `${this.combo} COMBO!`, '#fde047', 18);
            playSound('levelup');
          }

          this.emitStats();
          playSound('hit');
          this.createExplosion(b.x, b.y, r.color, 4);

          if (r.hp <= 0) {
            playSound('explode');
            this.createExplosion(r.x, r.y, r.color, 20);
            this.spawnCoins(r.x, r.y, (r.sizeIndex + 1) * 3);
            this.maybeSpawnPowerUp(r.x, r.y);
            this.screenShake = Math.min(15, this.screenShake + 3);

            if (r.sizeIndex > 0) {
              const newHp = Math.ceil(r.maxHp / 2);
              this.spawnRock(r.x - 18, r.y, newHp, r.sizeIndex - 1);
              this.spawnRock(r.x + 18, r.y, newHp, r.sizeIndex - 1);
            }

            this.rocks.splice(i, 1);

            if (this.levelProgress >= MAX_LEVEL_PROGRESS) {
              this.currentLevel++;
              this.levelProgress = 0;
              this.addFloatingText(this.width / 2, this.height / 2, `LEVEL ${this.currentLevel}`, '#38bdf8', 32);
              playSound('levelup');
              this.emitStats();
            }
            break;
          }
        }
      }

      // Draw rock
      if (this.rocks[i]) {
        const rock = this.rocks[i];
        this.ctx.save();
        this.ctx.translate(rock.x, rock.y);
        this.ctx.rotate(rock.rotation);
        this.ctx.beginPath();
        this.ctx.moveTo(rock.vertices[0].x, rock.vertices[0].y);
        for (let v = 1; v < rock.vertices.length; v++) {
          this.ctx.lineTo(rock.vertices[v].x, rock.vertices[v].y);
        }
        this.ctx.closePath();

        const grad = this.ctx.createRadialGradient(-rock.radius * 0.3, -rock.radius * 0.3, 0, 0, 0, rock.radius);
        grad.addColorStop(0, this.lightenColor(rock.color, 30));
        grad.addColorStop(1, rock.color);
        this.ctx.fillStyle = grad;
        this.ctx.fill();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        this.ctx.stroke();

        this.ctx.rotate(-rock.rotation);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `900 ${Math.max(14, rock.radius * 0.55)}px system-ui, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(String(Math.max(0, rock.hp)), 0, 0);
        this.ctx.restore();
      }
    }

    // Spawn rocks
    this.spawnTimer += dt;
    const spawnInterval = Math.max(1.5, 4 - this.currentLevel * 0.2);
    if (this.rocks.length === 0 && this.phase === 'playing') {
      this.spawnRock(this.width * 0.3, 80, Math.max(5, 8 * this.currentLevel), 2);
      this.spawnRock(this.width * 0.7, 80, Math.max(4, 6 * this.currentLevel), 1);
    } else if (this.spawnTimer >= spawnInterval && this.rocks.length < 3 + Math.floor(this.currentLevel / 3)) {
      this.spawnTimer = 0;
      const sizeIdx = Math.random() > 0.6 ? 2 : Math.random() > 0.5 ? 1 : 0;
      this.spawnRock(undefined, 80, Math.max(3, (5 + sizeIdx * 3) * this.currentLevel), sizeIdx);
    }
  }

  private updateCoins(dt: number): void {
    const floorY = this.height - 60;
    const magnetRadius = 150 + this.upgrades.magnetLevel * 120;
    const magnetSpeed = 5 + this.upgrades.magnetLevel * 4;

    for (let i = this.coinsList.length - 1; i >= 0; i--) {
      const c = this.coinsList[i];
      c.vy += c.gravity * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rotation += dt * 5;

      if (c.y + c.radius >= floorY) {
        c.y = floorY - c.radius;
        c.vy = -c.vy * 0.4;
        c.vx *= 0.8;
      }

      const distToCannon = Math.hypot(c.x - this.cannon.x, c.y - this.cannon.y);
      if (distToCannon < magnetRadius) {
        c.vx += (this.cannon.x - c.x) * magnetSpeed * dt;
        c.vy += (this.cannon.y - c.y) * magnetSpeed * dt;
      }

      if (distToCannon < c.radius + 28) {
        this.totalCoins += c.value;
        this.coinsEarned += c.value;
        playSound('coin');
        this.coinsList.splice(i, 1);
        this.emitStats();
        continue;
      }

      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.rotate(c.rotation);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      const cgrad = this.ctx.createRadialGradient(-3, -3, 1, 0, 0, c.radius);
      cgrad.addColorStop(0, '#fde047');
      cgrad.addColorStop(1, '#ca8a04');
      this.ctx.fillStyle = cgrad;
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#a16207';
      this.ctx.stroke();
      this.ctx.fillStyle = '#a16207';
      this.ctx.font = 'bold 10px system-ui, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('$', 0, 0);
      this.ctx.restore();
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * dt;
      t.alpha -= dt * 0.8;
      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, t.alpha);
      this.ctx.fillStyle = t.color;
      this.ctx.font = `900 ${t.size}px system-ui, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
      this.ctx.shadowBlur = 8;
      this.ctx.fillText(t.text, t.x, t.y);
      this.ctx.restore();
    }
  }

  private updatePowerUpDrops(dt: number): void {
    const floorY = this.height - 60;
    for (let i = this.powerUpDrops.length - 1; i >= 0; i--) {
      const p = this.powerUpDrops[i];
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += dt * 3;

      if (p.y + p.radius >= floorY) {
        p.y = floorY - p.radius;
        p.vy = -p.vy * 0.5;
        p.vx *= 0.7;
      }

      const distToCannon = Math.hypot(p.x - this.cannon.x, p.y - this.cannon.y);
      if (distToCannon < p.radius + 28) {
        this.activatePowerUp(p.type);
        this.powerUpDrops.splice(i, 1);
        continue;
      }

      // Draw
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      const colors: Record<string, string> = {
        shield: '#06b6d4',
        rapidFire: '#f59e0b',
        bomb: '#ef4444',
      };
      const icons: Record<string, string> = { shield: 'S', rapidFire: 'R', bomb: 'B' };
      this.ctx.beginPath();
      this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      const pgrad = this.ctx.createRadialGradient(0, 0, 2, 0, 0, p.radius);
      pgrad.addColorStop(0, this.lightenColor(colors[p.type], 40));
      pgrad.addColorStop(1, colors[p.type]);
      this.ctx.fillStyle = pgrad;
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.stroke();
      this.ctx.rotate(-p.rotation);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 14px system-ui, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(icons[p.type], 0, 0);
      this.ctx.restore();
    }
  }

  // --- Drawing ---

  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + percent);
    const g = Math.min(255, ((num >> 8) & 0x00ff) + percent);
    const b = Math.min(255, (num & 0x0000ff) + percent);
    return `rgb(${r},${g},${b})`;
  }

  private drawEnvironment(dt: number): void {
    const ctx = this.ctx;
    if (this.mapId === 'sunset') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      skyGrad.addColorStop(0, '#4c1d95');
      skyGrad.addColorStop(0.5, '#c026d3');
      skyGrad.addColorStop(1, '#f97316');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#31104b';
      ctx.beginPath();
      ctx.moveTo(0, this.height - 60);
      ctx.lineTo(this.width * 0.25, this.height - 190);
      ctx.lineTo(this.width * 0.5, this.height - 60);
      ctx.lineTo(this.width * 0.8, this.height - 220);
      ctx.lineTo(this.width, this.height - 60);
      ctx.lineTo(this.width, this.height);
      ctx.lineTo(0, this.height);
      ctx.fill();
    } else if (this.mapId === 'space') {
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, this.width, this.height);

      for (const s of this.stars) {
        s.twinkle += dt * 2;
        const alpha = 0.4 + Math.sin(s.twinkle) * 0.3;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(s.x, s.y, s.size, s.size);
        ctx.restore();
      }

      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(0, this.height - 60);
      ctx.lineTo(this.width * 0.3, this.height - 160);
      ctx.lineTo(this.width * 0.6, this.height - 60);
      ctx.lineTo(this.width, this.height - 140);
      ctx.lineTo(this.width, this.height);
      ctx.lineTo(0, this.height);
      ctx.fill();
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.6, '#bae6fd');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(0, this.height - 60);
      ctx.lineTo(this.width * 0.2, this.height - 180);
      ctx.lineTo(this.width * 0.45, this.height - 60);
      ctx.lineTo(this.width * 0.75, this.height - 210);
      ctx.lineTo(this.width, this.height - 60);
      ctx.lineTo(this.width, this.height);
      ctx.lineTo(0, this.height);
      ctx.fill();
    }

    // Clouds
    if (this.mapId !== 'space') {
      ctx.fillStyle = this.mapId === 'sunset' ? 'rgba(253, 186, 116, 0.6)' : 'rgba(255, 255, 255, 0.85)';
      for (const c of this.clouds) {
        if (this.phase === 'playing') c.x += c.speed * dt;
        if (c.x - 100 > this.width) c.x = -100;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.scale, c.scale);
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.arc(20, -10, 20, 0, Math.PI * 2);
        ctx.arc(40, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Floor
    const floorY = this.height - 60;
    ctx.fillStyle = this.mapId === 'space' ? '#0f172a' : this.mapId === 'sunset' ? '#451a03' : '#15803d';
    ctx.fillRect(0, floorY, this.width, 20);
    ctx.fillStyle = this.mapId === 'space' ? '#020617' : this.mapId === 'sunset' ? '#292524' : '#78350f';
    ctx.fillRect(0, floorY + 20, this.width, 40);
    ctx.strokeStyle = this.mapId === 'space' ? '#38bdf8' : this.mapId === 'sunset' ? '#f97316' : '#4ade80';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(this.width, floorY);
    ctx.stroke();
  }

  private drawCannon(): void {
    const ctx = this.ctx;
    const floorY = this.height - 60;
    this.cannon.y = floorY - 20;

    ctx.save();
    ctx.translate(this.cannon.x, this.cannon.y);

    // Shield aura
    if (this.hasShield) {
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(performance.now() * 0.005) * 0.15;
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.restore();
    }

    // Wheels
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(-22, 10, 12, 0, Math.PI * 2);
    ctx.arc(22, 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Barrels
    ctx.fillStyle = '#1e293b';
    if (this.upgrades.hasMultishot) {
      ctx.fillRect(-20, -30, 8, 30);
      ctx.fillRect(-4, -34, 8, 34);
      ctx.fillRect(12, -30, 8, 30);
    } else {
      ctx.fillRect(-16, -30, 10, 30);
      ctx.fillRect(6, -30, 10, 30);
    }

    // Body
    const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 30);
    gradient.addColorStop(0, this.lightenColor(this.cannonColor, 60));
    gradient.addColorStop(1, this.cannonColor);
    ctx.beginPath();
    ctx.arc(0, 0, 26, Math.PI, 0, false);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.restore();
  }

  // --- Main loop ---

  private loop = (now: number): void => {
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (this.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake;
      shakeY = (Math.random() - 0.5) * this.screenShake;
      this.screenShake = Math.max(0, this.screenShake - dt * 40);
    }

    this.ctx.save();
    this.ctx.translate(shakeX, shakeY);

    this.drawEnvironment(dt);

    if (this.phase === 'playing') {
      this.cannon.targetX = Math.max(30, Math.min(this.width - 30, this.cannon.targetX));
      this.cannon.x += (this.cannon.targetX - this.cannon.x) * 0.25;

      // Power-up timers
      if (this.hasShield) {
        this.powerUps.shield -= dt;
        if (this.powerUps.shield <= 0) {
          this.hasShield = false;
          this.powerUps.shield = 0;
          this.emitStats();
        }
      }
      if (this.rapidFireTimer > 0) {
        this.rapidFireTimer -= dt;
        this.powerUps.rapidFire = Math.max(0, this.rapidFireTimer);
        if (this.rapidFireTimer <= 0) {
          this.rapidFireTimer = 0;
          this.emitStats();
        }
      }

      this.updateCombo(dt);

      const baseInterval = Math.max(0.02, 0.075 - this.upgrades.fireRateLevel * 0.007);
      const fireInterval = this.rapidFireTimer > 0 ? baseInterval * 0.4 : baseInterval;

      this.shootTimer += dt;
      if (this.isFiring && this.shootTimer >= fireInterval) {
        this.shootTimer = 0;
        this.spawnBullet();
        playSound('shoot');
      }

      this.updateBullets(dt);
      this.updateRocks(dt);
      this.updateCoins(dt);
      this.updateParticles(dt);
      this.updatePowerUpDrops(dt);
      this.updateFloatingTexts(dt);
    } else {
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);
    }

    this.drawCannon();

    // Flash overlay
    if (this.flashAlpha > 0) {
      this.ctx.save();
      this.ctx.globalAlpha = this.flashAlpha;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.restore();
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 3);
    }

    this.ctx.restore();

    this.rafId = requestAnimationFrame(this.loop);
  };
}
