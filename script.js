// ─── GAME CONFIG ───────────────────────────────────────────────
const GAME_W = 480;
const GAME_H = 600;
const CAT_SPEED = 220;
const FISH_SPEED_MIN = 100;
const FISH_SPEED_MAX = 220;
const FISH_SPAWN_DELAY = 900; // ms between spawns
const COIN_VALUE = 10;

// ─── SCENE ─────────────────────────────────────────────────────
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  // ── preload: create all assets programmatically (no files needed)
  preload() {
    // Cat sprite (drawn on a canvas)
    // this.textures.addCanvas('cat', makeCatCanvas());
    this.load.image("cat", "/assets/florence.png");
    this.load.image("warm", "/assets/fish/5/warm.png")
    this.load.image("octopus", "/assets/fish/6/octopus.png")
    this.load.image("light-fish", "/assets/fish/4/light-fish.png")
    this.load.image("sword-fish", "/assets/fish/3/sword-fish.png")
    this.load.image("turtle", "/assets/fish/2/turtle.png")
    this.load.image("jelly", "/assets/fish/1/jellyfish.png")
    this.load.image("nyc", "/assets/backgrounds/NYC.avif")

    this.load.audio('catch', '/assets/Florence-Soundeffect.mp3');
  

 
    // Coin sprite
    this.textures.addCanvas('coin', makeCoinCanvas());
    // Background stars
    this.textures.addCanvas('bg', makeBgCanvas());
  }

  create() {
    // ── Background
    this.add.image(GAME_W / 2, GAME_H / 2, 'nyc');
 
    // ── Mobile touch buttons
    const btnLeft = this.add.rectangle(60, GAME_H - 40, 60, 60, 0xffffff, 0.10)
        .setInteractive().setDepth(10);
    const btnRight = this.add.rectangle(GAME_W - 60, GAME_H - 40, 60, 60, 0xffffff, 0.10)
        .setInteractive().setDepth(10);

    // button labels
    this.add.text(60, GAME_H - 40, '◀', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5).setDepth(6);
    this.add.text(GAME_W - 60, GAME_H - 40, '▶', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5).setDepth(6);

    // track which buttons are held
    this.touchLeft = false;
    this.touchRight = false;

    btnLeft.on('pointerdown', () => this.touchLeft = true);
    btnLeft.on('pointerup', () => this.touchLeft = false);
    btnLeft.on('pointerout', () => this.touchLeft = false);

    btnRight.on('pointerdown', () => this.touchRight = true);
    btnRight.on('pointerup', () => this.touchRight = false);
    btnRight.on('pointerout', () => this.touchRight = false);

    // ── Ground line
    this.add.rectangle(GAME_W / 2, GAME_H - 20, GAME_W, 2, 0x334455);

    // ── Player (cat)
    this.cat = this.physics.add.sprite(GAME_W / 2, GAME_H - 60, 'cat');
    this.cat.setScale(0.16);
    this.cat.setCollideWorldBounds(true);
    this.cat.body.setGravityY(0);

    // ── Fish group
    this.fishGroup = this.physics.add.group();
    

    // ── Coins (score)
    this.coins = 0;
    this.coinText = this.add.text(16, 16, '🪙 0', {
      fontSize: '22px',
      fill: '#ffd93d',
      fontFamily: 'Courier New',
      stroke: '#000',
      strokeThickness: 4
    }).setDepth(10);

    // ── Overlap: cat catches fish
    this.physics.add.overlap(
      this.cat,
      this.fishGroup,
      this.catchFish,
      null,
      this
    );

    // ── Keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    

    // ── Spawn fish on a timer
    this.time.addEvent({
      delay: FISH_SPAWN_DELAY,
      callback: this.spawnFish,
      callbackScope: this,
      loop: true
    });

    // ── Particle-like coin pop group
    this.popTexts = this.add.group();

    // ── Title hint
    const hint = this.add.text(GAME_W / 2, GAME_H - 8, '← → or A D to move', {
      fontSize: '11px', fill: '#445566',
      fontFamily: 'Courier New'
    }).setOrigin(0.5, 1).setDepth(10);
  }

  // ── Spawn one random fish from the top
  spawnFish() {
    const fishes = ['octopus', 'warm', 'light-fish', 'sword-fish', 'turtle', 'jelly'];
    const randomFish = fishes[Phaser.Math.Between(0, fishes.length - 1)];
    const x = Phaser.Math.Between(24, GAME_W - 24);
    const fish = this.fishGroup.create(x, -30, randomFish);
    fish.setVelocityY(Phaser.Math.Between(FISH_SPEED_MIN, FISH_SPEED_MAX));
    // slight horizontal drift
    fish.setVelocityX(Phaser.Math.Between(-30, 30));
    fish.setCollideWorldBounds(false);
    fish.body.setGravityY(0);
    // wobble rotation
    this.tweens.add({
      targets: fish,
      angle: { from: -12, to: 12 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // ── Called when cat overlaps a fish
  catchFish(cat, fish) {
    const x = fish.x;
    const y = fish.y;

    // coin pop text
    const pop = this.add.text(x, y, `+${COIN_VALUE}`, {
      fontSize: '18px',
      fill: '#ffd93d',
      fontFamily: 'Courier New',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: pop,
      y: y - 50,
      alpha: 0,
      duration: 700,
      ease: 'Power2',
      onComplete: () => pop.destroy()
    });

    // flash cat
    this.tweens.add({
      targets: cat,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 80,
      yoyo: true,
      ease: 'Power1'
    });

    this.sound.play('catch');

    fish.destroy();
    this.coins += COIN_VALUE;
    this.coinText.setText(`🪙 ${this.coins}`);
  }

  update() {
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown || this.touchLeft;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchRight;

    if (left) {
      this.cat.setVelocityX(-CAT_SPEED);
      this.cat.setFlipX(true);
    } else if (right) {
      this.cat.setVelocityX(CAT_SPEED);
      this.cat.setFlipX(false);
    } else {
      this.cat.setVelocityX(0);
    }

    // destroy fish that fell off screen
    this.fishGroup.getChildren().forEach(fish => {
      if (fish.y > GAME_H + 40) fish.destroy();
    });
  }
}

// ─── ASSET HELPERS (draw sprites on HTML canvas) ───────────────

function makeCoinCanvas() {
  const c = document.createElement('canvas');
  c.width = 20; c.height = 20;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffd93d';
  ctx.beginPath(); ctx.arc(10, 10, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c8a600';
  ctx.font = 'bold 12px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('$', 10, 11);
  return c;
}

function makeBgCanvas() {
  const c = document.createElement('canvas');
  c.width = GAME_W; c.height = GAME_H;
  const ctx = c.getContext('2d');
  // gradient sky
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_H);
  grad.addColorStop(0, '#0a0a2e');
  grad.addColorStop(1, '#0d1f3c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_W, GAME_H);
  // stars
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * GAME_W;
    const y = Math.random() * GAME_H * 0.7;
    const r = Math.random() * 1.2 + 0.3;
    ctx.globalAlpha = Math.random() * 0.8 + 0.2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // ground
  const groundGrad = ctx.createLinearGradient(0, GAME_H - 40, 0, GAME_H);
  groundGrad.addColorStop(0, '#1a2a3a');
  groundGrad.addColorStop(1, '#0d1520');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GAME_H - 40, GAME_W, 40);
  return c;
}

// ─── LAUNCH ────────────────────────────────────────────────────
const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0a0a1a',
  physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
  scene: GameScene
};

new Phaser.Game(config);
