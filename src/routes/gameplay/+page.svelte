<script lang="ts">
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/systems/LocalizationStore";
  import Page from "$lib/components/Page.svelte";
  import { wait, waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { onMount, onDestroy } from "svelte";
  import { PopupStore, PopupResult } from "$lib/systems/PopupStore";
  import { Play, Pause, Heart, Keyboard, Smartphone, Gamepad2, ArrowUpFromLine, Sword, Clock, Trophy, DollarSign, Zap, CircleDollarSign, Target } from "lucide-svelte";
  import { isPortrait } from "$lib/systems/Orientation";
  import { FontAssets } from "$lib/assets/FontAssets";
  import { playerStore } from "../../lib/systems/PlayerStore";
  import { characterAttackImageKey, characterJumpImageKey, characterRunImageKey, characterAttackEffectImageKey, stageBackgroundImageKey, stageBgmAudioKey, characterWalkAudioKey, characterAttackAudioKey } from "$lib/utils/KeyHelper";
  import { AudioManager } from "$lib/systems/AudioManager";

  let goToNextScene: Writable<string | null>;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  $: selectedCharacter = $playerStore.selectedCharacter;
  $: selectedStage = $playerStore.selectedStage;

  // Game state
  let gameState: 'playing' | 'paused' | 'gameOver' = 'playing';
  let survivalTime = 0;
  let lastSurvivalSecond = 0;
  let coins = 0;
  let lives = 3;
  let score = 0;
  let isPaused = false;
  let isInvincible = false;
  let invincibleTimer = 0;
  const INVINCIBLE_DURATION = 1500;
  
  // Game entities (4x size for player, 2x size for others) with separate collision boxes
  let player = {
    x: 50, // Moved further left as requested
    y: 300,
    width: 256, // Increased from 128 to 256 as requested
    height: 256, // Increased from 128 to 256 as requested
    // Collision box (smaller than visual sprite)
    collisionOffsetX: 40, // Scaled proportionally
    collisionOffsetY: 20, // Scaled proportionally
    collisionWidth: 176, // Scaled proportionally
    collisionHeight: 216, // Scaled proportionally
    velocityY: 0,
    onGround: false,
    animation: 'run',
    animationFrame: 0,
    animationTimer: 0
  };
  
  // Background scrolling
  let backgroundOffset = 0;
  
  let enemies: Array<{x: number, y: number, width: number, height: number, facingLeft: boolean, collisionOffsetX: number, collisionOffsetY: number, collisionWidth: number, collisionHeight: number}> = [];
  let gameCoins: Array<{x: number, y: number, width: number, height: number, collected: boolean, collisionOffsetX: number, collisionOffsetY: number, collisionWidth: number, collisionHeight: number}> = [];
  let projectiles: Array<{x: number, y: number, width: number, height: number, velocityX: number, animationFrame: number, animationTimer: number}> = [];
  let traps: Array<{x: number, y: number, width: number, height: number, collisionOffsetX: number, collisionOffsetY: number, collisionWidth: number, collisionHeight: number}> = [];
  let explosions: Array<{x: number, y: number, width: number, height: number, animationFrame: number, animationTimer: number}> = [];

  // Game settings
  const GRAVITY = 0.8;
  const JUMP_FORCE = -20; // Increased from -15 to account for larger objects
  const GROUND_Y = 480; // Moved down 160px as requested (was 320)
  const BASE_SCROLL_SPEED = 8; 

  // Trap spawning control - increased interval 3x
  let lastTrapSpawnTime = 0;
  const MIN_TRAP_INTERVAL = 3000; // Minimum 5 seconds between traps (3x from 3 seconds)
  
  // Asset loading
  let assetsLoaded = false;
  let loadedImages: Record<string, HTMLImageElement> = {};
  
  // Input handling
  let keysPressed: Record<string, boolean> = {};
  let gamepadIndex: number | null = null;
  
  async function loadAssets() {
    // Show loading popup with condition-based auto-close
    PopupStore.open({
      title: $t("loadingGameTitle"),
      content: $t("loadingGameContent"),
      buttons: [],
      autoClose: () => assetsLoaded
    });

    const imagePromises = Object.entries({
      background: imageAssets[stageBackgroundImageKey(selectedStage)],
      run: imageAssets[characterRunImageKey(selectedCharacter)],
      jump: imageAssets[characterJumpImageKey(selectedCharacter)],
      attack: imageAssets[characterAttackImageKey(selectedCharacter)],
      attackEffect: imageAssets[characterAttackEffectImageKey(selectedCharacter)],
      enemy: imageAssets.enemy,
      coin: imageAssets.coin,
      trap: imageAssets.trap,
      explosion: imageAssets.explosion,
    }).map(([key, src]) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedImages[key] = img;
          resolve();
        };
        img.src = src;
      });
    });
    
    // Preload audio assets
    const audioPreloadPromises = [
      // Stage BGM
      AudioManager.preload(stageBgmAudioKey(selectedStage)),
      // Character audio
      AudioManager.preload(characterWalkAudioKey(selectedCharacter)),
      AudioManager.preload(characterAttackAudioKey(selectedCharacter)),
      // Game SFX
      AudioManager.preload("sfx_coin"),
      AudioManager.preload("sfx_hurt"),
      AudioManager.preload("sfx_explosion"),
      AudioManager.preload("sfx_countdown"),
      AudioManager.preload("sfx_countdownFinish"),
      AudioManager.preload("sfx_pause"),
      AudioManager.preload("sfx_gameover"),
    ];
    
    await Promise.all([...imagePromises, ...audioPreloadPromises]);
    assetsLoaded = true;
    // Popup will auto-close when assetsLoaded becomes true
  }
  
  // Input handling functions
  function handleKeyDown(event: KeyboardEvent) {
    keysPressed[event.code] = true;
    
    switch(event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        event.preventDefault();
        jump();
        break;
      case 'ArrowRight':
      case 'KeyD':
      case 'Enter':
      case 'KeyX':
      case 'KeyZ':
        event.preventDefault();
        attack();
        break;
      case 'Escape':
      case 'KeyP':
        event.preventDefault();
        togglePause();
        break;
    }
  }
  
  function handleKeyUp(event: KeyboardEvent) {
    keysPressed[event.code] = false;
  }
  
  function setupGamepadSupport() {
    // Check for gamepad connection
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad);
      gamepadIndex = e.gamepad.index;
    });
    
    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected:', e.gamepad);
      if (gamepadIndex === e.gamepad.index) {
        gamepadIndex = null;
      }
    });
  }
  
  function handleGamepadInput() {
    if (gamepadIndex === null) return;
    
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[gamepadIndex];
    
    if (!gamepad) return;
    
    // Button mapping: A button (0) = jump, B button (1) = attack, Start button (9) = pause
    if (gamepad.buttons[0]?.pressed) {
      jump();
    }
    if (gamepad.buttons[1]?.pressed || gamepad.buttons[2]?.pressed) {
      attack();
    }
    if (gamepad.buttons[9]?.pressed) {
      togglePause();
    }
  }
  
  function initGame() {
    if (!canvas || !ctx) return;
    
    // Set canvas internal resolution
    canvas.width = 800;
    canvas.height = 600;
    
    // Reset game state
    gameState = 'playing';
    survivalTime = 0;
    lastSurvivalSecond = 0;
    lastTrapSpawnTime = 0;
    coins = 0;
    lives = 3;
    score = 0;
    isPaused = false;
    backgroundOffset = 0;
    isInvincible = false;
    invincibleTimer = 0;
    
    // Reset player (4x original size for better visibility)
    player = {
      x: 50, // Moved further left as requested
      y: GROUND_Y - 256, // Adjusted for new player height
      width: 256, // Increased from 128 to 256
      height: 256, // Increased from 128 to 256
      // Collision box (smaller than visual sprite)
      collisionOffsetX: 40, // Scaled proportionally
      collisionOffsetY: 20, // Scaled proportionally
      collisionWidth: 176, // Scaled proportionally
      collisionHeight: 216, // Scaled proportionally
      velocityY: 0,
      onGround: true,
      animation: 'run',
      animationFrame: 0,
      animationTimer: 0
    };
    
    // Reset entities
    enemies = [];
    gameCoins = [];
    projectiles = [];
    traps = [];
    explosions = [];

    waitForCountdown = true;
    setTimeout(() => startCountdown(false), 1000);
  }
  
  let countdown = 3; // 秒數
  let waitForCountdown = true;
  let showCountdown = true;
  let countdownText = "3";
  let countdownTimer = 0;
  let isStop = false;

  function startCountdown(shouldStop: boolean = false) {
    isStop = shouldStop;
    countdown = 3;
    countdownText = "3";
    showCountdown = true;
    countdownTimer = 0;
    waitForCountdown = false;
    
    // Start playing stage BGM when countdown begins
    if (!shouldStop) {
      AudioManager.stopBGM();
      AudioManager.play(stageBgmAudioKey(selectedStage));
      AudioManager.play("sfx_countdown");
    }
  }

  function jump() {
    if (player.onGround && gameState === 'playing') {
      player.velocityY = JUMP_FORCE;
      player.onGround = false;
      player.animation = 'jump';
    }
  }
  
  function attack() {
    if (player.animation !== 'attack' && gameState === 'playing') {
      player.animation = 'attack';
      player.animationTimer = 0;
      
      // Play attack audio
      AudioManager.play(characterAttackAudioKey(selectedCharacter));
      
      projectiles.push({
        x: player.x + player.width,
        y: player.y,
        width: 128, // Increased from 64 to 128 (2x scale)
        height: 256, // Increased from 128 to 256 (2x scale)
        velocityX: 8,
        animationFrame: 0,
        animationTimer: 0
      });
    }
  }
  
  function spawnEnemy() {
    enemies.push({
      x: canvas.width + 50,
      y: GROUND_Y - 192, // Adjusted for new enemy height
      width: 192, // Increased from 96 to 192 (2x scale)
      height: 192, // Increased from 96 to 192 (2x scale)
      facingLeft: true,
      // Collision box (smaller than visual sprite)
      collisionOffsetX: 24, // Scaled proportionally
      collisionOffsetY: 16, // Scaled proportionally
      collisionWidth: 144, // Scaled proportionally
      collisionHeight: 160 // Scaled proportionally
    });
  }

  function spawnExplosion(enemy: {x: number, y: number, width: number, height: number}) {
    explosions.push({
      x: enemy.x - enemy.width / 2,
      y: enemy.y - enemy.height / 2 - 20,
      width: enemy.width * 2,
      height: enemy.height * 2,
      animationFrame: 0,
      animationTimer: 0
    });
  }
  
  function spawnCoin() {
    gameCoins.push({
      x: canvas.width + 50 + Math.random() * 200,
      y: GROUND_Y - 200 - Math.random() * 300,
      width: 128, // Increased from 64 to 128 (2x scale)
      height: 128, // Increased from 64 to 128 (2x scale)
      collected: false,
      // Collision box (smaller than visual sprite)
      collisionOffsetX: 16, // Scaled proportionally
      collisionOffsetY: 16, // Scaled proportionally
      collisionWidth: 96, // Scaled proportionally
      collisionHeight: 96 // Scaled proportionally
    });
  }
  
  function spawnTrap() {
    traps.push({
      x: canvas.width + 50,
      y: GROUND_Y - 96, // Adjusted for new trap height (halved back)
      width: 128, // Reduced from 256 to 128 (halved back)
      height: 96,
      // Collision box (smaller than visual sprite for better gameplay)
      collisionOffsetX: 16, // Scaled proportionally
      collisionOffsetY: 8, // Scaled proportionally
      collisionWidth: 96, // Scaled proportionally
      collisionHeight: 32 // Scaled proportionally
    });
  }
  
  let spawnChance = 0.0001; // 0.01%
  const spawnChanceIncreasePerFrame = (1 - 0.0001) / (60 * 25); // 25秒內從0.01%到100%，假設60FPS

  function getCurrentScrollSpeed(): number {
    // Speed increases over time, starting at BASE_SCROLL_SPEED and increasing by 0.05 every 10 seconds (reduced from 0.1)
    return BASE_SCROLL_SPEED + Math.floor(survivalTime / 10) * 0.05;
  }
  
  function updateGame(deltaTime: number) {
    if (gameState !== 'playing' || !assetsLoaded) return;

    const currentScrollSpeed = getCurrentScrollSpeed();
    if (!isStop) {
      backgroundOffset -= currentScrollSpeed;
    
      // Update player physics
      player.velocityY += GRAVITY;
      player.y += player.velocityY;

      if (player.y >= GROUND_Y - player.height) {
        player.y = GROUND_Y - player.height;
        player.velocityY = 0;
        player.onGround = true;
        if (player.animation === 'jump') {
          player.animation = 'run';
        }
      }
      
      // Update animation (6 frames per sprite sheet)
      player.animationTimer += deltaTime;
      const animationSpeed = player.animation === 'attack' ? 150 : 100; // Slower for attack animation
      if (player.animationTimer > animationSpeed) {
        const previousFrame = player.animationFrame;
        player.animationFrame = (player.animationFrame + 1) % 6;
        player.animationTimer = 0;
        
        // Play walk audio on specific frames
        if (player.animation === 'run' && (player.animationFrame === 0 || player.animationFrame === 3)) {
          AudioManager.play(characterWalkAudioKey(selectedCharacter));
        } else if (player.animation === 'jump' && (player.animationFrame === 0 || player.animationFrame === 5)) {
          AudioManager.play(characterWalkAudioKey(selectedCharacter));
        }
        
        if (player.animation === 'attack' && player.animationFrame === 0) {
          player.animation = player.onGround ? 'run' : 'jump';
        }
      }

      // Update explosions animation (optimized)
      for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        explosion.animationTimer += deltaTime;
        if (explosion.animationTimer > 100) {
          explosion.animationTimer %= 100;
          explosion.animationFrame = (explosion.animationFrame + 1); 
          if (explosion.animationFrame >= 6) {
            explosions.splice(i, 1);
            continue;
          }
        }
        explosion.x -= currentScrollSpeed;
        if (explosion.x < -explosion.width) {
          explosions.splice(i, 1);
        }
      }

      // Update projectiles (optimized)
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        projectile.x += projectile.velocityX;
        if (projectile.x > canvas.width + 50) {
          projectiles.splice(i, 1);
        }
      }
    }

    if (waitForCountdown) {
      return;
    }

    if (showCountdown) {
      countdownTimer += deltaTime;
      if (countdownTimer >= 1000) {
        countdownTimer -= 1000;
        countdown--;
        if (countdown > 0) {
          countdownText = countdown.toString();
          AudioManager.play("sfx_countdown");
        } else if (countdown === 0) {
          countdownText = "GO!";
          AudioManager.play("sfx_countdownFinish");
        } else {
          showCountdown = false;
          isStop = false;
          countdownText = "";
        }
      }
      
      return;
    }

    
    survivalTime += deltaTime / 1000;
    
    // Award 1 point per second for survival
    const currentSecond = Math.floor(survivalTime);
    if (currentSecond > lastSurvivalSecond) {
      score += (currentSecond - lastSurvivalSecond);
      lastSurvivalSecond = currentSecond;
    }
    
    // Update enemies with progressive speed and early exit optimization
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      enemy.x -= currentScrollSpeed;
      if (enemy.x < -enemy.width) {
        enemies.splice(i, 1);
      }
    }

    // Update coins with progressive speed and remove off-screen coins
    for (let i = gameCoins.length - 1; i >= 0; i--) {
      const coin = gameCoins[i];
      coin.x -= currentScrollSpeed;
      if (coin.x < -coin.width) {
        gameCoins.splice(i, 1);
      }
    }
    
    // Update traps with progressive speed and early exit optimization
    for (let i = traps.length - 1; i >= 0; i--) {
      const trap = traps[i];
      trap.x -= currentScrollSpeed;
      if (trap.x < -trap.width) {
        traps.splice(i, 1);
      }
    }
    
    // Collision detection - coins (optimized for performance)
    for (let i = 0; i < gameCoins.length; i++) {
      const coin = gameCoins[i];
      if (!coin.collected && coin.x < canvas.width && coin.x + coin.width > 0) {
        if (checkCollision(player, coin)) {
          coin.collected = true;
          coins++;
          score += 10; // Award 10 points for collecting a coin
          // Play coin audio
          AudioManager.play("sfx_coin");
        }
      }
    }
    
    // Collision detection - enemies (only if player is vulnerable and on screen)
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (enemy.x < canvas.width && enemy.x + enemy.width > 0) {
        if (checkCollision(player, enemy)) {
          if (!isInvincible) {
            lives--;
            isInvincible = true;
            invincibleTimer = INVINCIBLE_DURATION;
            // Play hurt audio
            AudioManager.play("sfx_hurt");
          }
          // Remove the enemy that hit the player
          enemies.splice(i, 1);
          if (lives <= 0) {
            handleGameOver();
          }
          break; // Early exit after collision
        }
      }
    }
    
    // Collision detection - traps (optimized for performance)
    for (let i = 0; i < traps.length; i++) {
      const trap = traps[i];
      if (trap.x < canvas.width && trap.x + trap.width > 0) {
        if (checkCollision(player, trap)) {
          if (!isInvincible) {
            lives--;
            isInvincible = true;
            invincibleTimer = INVINCIBLE_DURATION;
            // Play hurt audio
            AudioManager.play("sfx_hurt");
          }
          if (lives <= 0) {
            handleGameOver();
          }
          break; // Early exit after collision
        }
      }
    }
    
    // Collision detection - projectiles vs enemies (optimized)
    for (let p = projectiles.length - 1; p >= 0; p--) {
      const projectile = projectiles[p];
      let projectileHit = false;
      
      for (let e = enemies.length - 1; e >= 0; e--) {
        const enemy = enemies[e];
        // Only check collision if entities are on screen
        if (projectile.x < canvas.width && enemy.x < canvas.width) {
          if (projectile.x < enemy.x + enemy.width &&
              projectile.x + projectile.width > enemy.x &&
              projectile.y < enemy.y + enemy.height &&
              projectile.y + projectile.height > enemy.y) {
            enemies.splice(e, 1);
            projectiles.splice(p, 1);
            spawnExplosion(enemy);
            score += 10; // Award 10 points for defeating an enemy
            // Play explosion audio
            AudioManager.play("sfx_explosion");
            projectileHit = true;
            break; // Exit enemy loop when projectile hits
          }
        }
      }
      
      if (projectileHit) break; // Exit projectile loop if hit occurred
    }
    
    // 每 frame 增加機率
    spawnChance += spawnChanceIncreasePerFrame;
    if (spawnChance > 1) spawnChance = 1;

    // 1~10000的隨機值
    const rand = Math.random();

    if (rand < spawnChance) {
      // 決定生什麼
      const typeRand = Math.random();
      const now = performance.now();
      if (typeRand < 0.4) {
        spawnEnemy();
      } else if (typeRand < 0.75) {
        if (now - lastTrapSpawnTime > MIN_TRAP_INTERVAL) {
          spawnTrap();
          lastTrapSpawnTime = now;
        }
      } else {
        spawnCoin();
      }
      // 歸回初始機率
      spawnChance = 0.0001;
    }

    if (isInvincible) {
      invincibleTimer -= deltaTime;
      if (invincibleTimer <= 0) {
        isInvincible = false;
        invincibleTimer = 0;
      }
    }
  }
  
  function render() {
    if (!ctx || !assetsLoaded) return;
    
    // Clear canvas efficiently
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mobile performance optimization: reduce quality on performance mode
    if (performanceMode === 'performance') {
      ctx.imageSmoothingEnabled = false;
    }
    
    // Draw scrolling background with optimized rendering
    if (loadedImages.background) {
      const bgWidth = canvas.width;
      const bgHeight = canvas.height;
      
      // Background moved down 160px, need to fill the top and draw extended background
      const backgroundYOffset = bgHeight - 160;
      const extendedHeight = bgHeight + backgroundYOffset;

      const bgX1 = backgroundOffset % bgWidth;
      const bgX2 = bgX1 + bgWidth;
      
      // Optimize background rendering for mobile
      if (isMobile && performanceMode === 'performance') {
        // Simplified background for mobile performance
        ctx.drawImage(loadedImages.background, bgX1, 0, bgWidth, bgHeight);
        if (bgX2 < bgWidth) {
          ctx.drawImage(loadedImages.background, bgX2, 0, bgWidth, bgHeight);
        }
      } else {
        // Full quality background rendering
        for (let y = -backgroundYOffset; y < extendedHeight; y += bgHeight) {
          ctx.drawImage(loadedImages.background, bgX1, y, bgWidth, bgHeight);
          ctx.drawImage(loadedImages.background, bgX2, y, bgWidth, bgHeight);
        }
      }
    } else {
      // Fallback background
      ctx.fillStyle = '#4a90e2';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#8b5a3c';
      ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    }
    
    // Draw explosions (only those on screen)
    explosions.forEach(explosion => {
      if (explosion.x < canvas.width && explosion.x + explosion.width > 0) {
        if (loadedImages.explosion) {
          const frameWidth = loadedImages.explosion.width / 6; // 6 frames per sprite sheet
          const frameHeight = loadedImages.explosion.height;
          const frameX = explosion.animationFrame * frameWidth;
          ctx.drawImage(loadedImages.explosion, frameX, 0, frameWidth, frameHeight, explosion.x, explosion.y, explosion.width, explosion.height);
        }
      }
    });

    // Draw player with sprite sheet animation (6 frames horizontally)
    let playerImage = loadedImages.run;
    if (player.animation === 'jump') playerImage = loadedImages.jump;
    if (player.animation === 'attack') playerImage = loadedImages.attack;
    
    let shouldDrawPlayer = true;
    if (isInvincible) {
      // 每 100ms 閃爍一次
      shouldDrawPlayer = Math.floor(invincibleTimer / 100) % 2 === 0;
    }

    if (shouldDrawPlayer) {
      if (playerImage) {
        const frameWidth = playerImage.width / 6; // 6 frames per sprite sheet
        const frameHeight = playerImage.height;
        const frameX = player.animationFrame * frameWidth;
        
        ctx.drawImage(
          playerImage,
          frameX, 0, frameWidth, frameHeight, // Source rectangle (sprite frame)
          player.x, player.y, player.width, player.height // Destination rectangle
        );
      } else {
        // Fallback player rectangle
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(player.x, player.y, player.width, player.height);
      }
    }
    
    // Draw enemies with horizontal flipping (only those on screen)
    enemies.forEach(enemy => {
      if (enemy.x < canvas.width && enemy.x + enemy.width > 0) {
        if (loadedImages.enemy) {
          ctx.save();
          if (enemy.facingLeft) {
            ctx.scale(-1, 1);
            ctx.drawImage(loadedImages.enemy, -enemy.x - enemy.width, enemy.y, enemy.width, enemy.height);
          } else {
            ctx.drawImage(loadedImages.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
          }
          ctx.restore();
        } else {
          // Fallback enemy rectangle
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
      }
    });
    
    // Draw coins (only those on screen and not collected)
    gameCoins.forEach(coin => {
      if (!coin.collected && coin.x < canvas.width && coin.x + coin.width > 0) {
        if (loadedImages.coin) {
          ctx.drawImage(loadedImages.coin, coin.x, coin.y, coin.width, coin.height);
        } else {
          // Fallback coin circle
          ctx.fillStyle = '#f1c40f';
          ctx.beginPath();
          ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    });
    
    // Draw traps (only those on screen)
    traps.forEach(trap => {
      if (trap.x < canvas.width && trap.x + trap.width > 0) {
        if (loadedImages.trap) {
          ctx.drawImage(loadedImages.trap, trap.x, trap.y, trap.width, trap.height);
        } else {
          // Fallback trap spikes
          ctx.fillStyle = '#8b0000';
          ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
          // Draw spike pattern
          ctx.fillStyle = '#ff0000';
          const spikeCount = 4;
          const spikeWidth = trap.width / spikeCount;
          for (let i = 0; i < spikeCount; i++) {
            ctx.beginPath();
            ctx.moveTo(trap.x + i * spikeWidth, trap.y + trap.height);
            ctx.lineTo(trap.x + i * spikeWidth + spikeWidth/2, trap.y);
            ctx.lineTo(trap.x + (i + 1) * spikeWidth, trap.y + trap.height);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    });
    
    // Draw projectiles (only those on screen)
    projectiles.forEach(projectile => {
      if (projectile.x < canvas.width && projectile.x + projectile.width > 0) {
        if (loadedImages.attackEffect) {
          const frameWidth = loadedImages.attackEffect.width; // Assume 6 frames
          const frameHeight = loadedImages.attackEffect.height;
          
          ctx.drawImage(
            loadedImages.attackEffect,
            0, 0, frameWidth, frameHeight, // Source rectangle (sprite frame)
            projectile.x, projectile.y, projectile.width, projectile.height // Destination rectangle
          );
        } else {
          // Fallback projectile rectangle
          ctx.fillStyle = '#9b59b6';
          ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
        }
      }
    });
    
    if (!waitForCountdown && showCountdown) {
      ctx.save();

      // 純藍底框
      const boxWidth = 480; // 左右較長
      const boxHeight = 80; // 沒有上下間隔
      const boxX = canvas.width / 2 - boxWidth / 2;
      const boxY = canvas.height / 2 - boxHeight / 2;
      const radius = 0; // 無圓角

      // 畫純色藍底矩形
      ctx.beginPath();
      ctx.rect(boxX, boxY, boxWidth, boxHeight);
      ctx.closePath();
      ctx.fillStyle = "#0021ff"; // 或 "#0000ff"
      ctx.fill();

      // 白色大字
      ctx.font = `bold 80px ${FontAssets.getFamily("englishNumberBold")}, 'Orbitron', Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(countdownText, canvas.width / 2, canvas.height / 2);

      ctx.restore();
    }
    
  }
  
  // Game loop and performance variables
  let lastFrameTime = 0;
  let frameTimeAccumulator = 0;
  const TARGET_FPS = 60;
  const FRAME_TIME = 1000 / TARGET_FPS;
  const MAX_DELTA_TIME = 50; // Cap delta time to prevent large jumps
  
  // Mobile performance optimizations
  let isMobile = false;
  let performanceMode = 'auto'; // 'auto', 'performance', 'quality'
  
  function detectMobile() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
    
    // Auto-adjust performance mode for mobile
    if (isMobile && performanceMode === 'auto') {
      performanceMode = 'performance';
    }
  }
  
  function gameLoop() {
    const now = performance.now();
    let deltaTime = Math.min(now - lastFrameTime, MAX_DELTA_TIME);
    lastFrameTime = now;
    
    // Frame rate limiting for mobile devices
    if (isMobile) {
      frameTimeAccumulator += deltaTime;
      if (frameTimeAccumulator < FRAME_TIME) {
        requestAnimationFrame(gameLoop);
        return;
      }
      deltaTime = frameTimeAccumulator;
      frameTimeAccumulator = 0;
    }
    
    if (!isPaused) {
      handleGamepadInput();
      updateGame(deltaTime);
    }
    render();
    requestAnimationFrame(gameLoop);
  }
  
  async function handleGameOver() {
    AudioManager.play("sfx_gameover");
    gameState = 'gameOver';
    
    const result = await PopupStore.open({
      title: $t("gameOver"),
      content: `<div style="background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; text-align: left; line-height: 1.2; font-size: 1rem;">
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          <strong>${$t("survivalTimeLabel")}:</strong> ${formatTime(survivalTime)}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
          <strong>${$t("coinsCollectedLabel")}:</strong> ${coins}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
          <strong>${$t("finalScoreLabel")}:</strong> ${score}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
          <strong>${$t("finalSpeedLabel")}:</strong> ${getCurrentScrollSpeed().toFixed(1)}x
        </div>

        <div style="margin-top: 5px; font-style: italic; color: #fbbf24;">
          ${$t("encouragementMessage")}
        </div>
      </div>`,
      buttons: [
        {
          text: $t("playAgain"),
          onClick: () => {
            initGame();
            return PopupResult.Close;
          }
        },
        {
          text: $t("backToMenu"),
          onClick: () => {
            goToNextScene.set("/stage");
            return PopupResult.Close;
          }
        }
      ]
    });
  }

  async function togglePause() {
    AudioManager.play("sfx_pause");
    if (gameState === 'playing') {
      isPaused = true;
      gameState = 'paused';
      
      const result = await PopupStore.open({
        title: $t("gamePaused"),
        content: `<div style="background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; text-align: left; line-height: 1.2; font-size: 1rem;">
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            <strong>${$t("pauseTimeLabel")}:</strong> ${formatTime(survivalTime)}
          </div>
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
            <strong>${$t("pauseScoreLabel")}:</strong> ${score}
          </div>
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
            <strong>${$t("pauseCoinsLabel")}:</strong> ${coins}
          </div>
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>
            <strong>${$t("pauseLivesLabel")}:</strong> ${lives}
          </div>
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
            <strong>${$t("currentSpeedLabel")}:</strong> ${getCurrentScrollSpeed().toFixed(1)}x
          </div>
          
          <div style="margin-top: 5px; font-style: italic; color: #fbbf24;">
            ${$t("pauseMessage")}
          </div>
        </div>`,
        buttons: [
          {
            text: $t("resume"),
            onClick: () => PopupResult.Close
          },
          {
            text: $t("quitToMenu"),
            onClick: () => {
              goToNextScene.set("/stage");
              return PopupResult.Close;
            }
          }
        ]
      });
      
      // Resume game if popup was closed without quitting
      if (gameState === 'paused') {
        isPaused = false;
        gameState = 'playing';
        startCountdown(true);
      }
    }
  }
  
  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Helper function for collision detection using collision boxes
  function checkCollision(a: any, b: any): boolean {
    const aLeft = a.x + (a.collisionOffsetX || 0);
    const aRight = aLeft + (a.collisionWidth || a.width);
    const aTop = a.y + (a.collisionOffsetY || 0);
    const aBottom = aTop + (a.collisionHeight || a.height);

    const bLeft = b.x + (b.collisionOffsetX || 0);
    const bRight = bLeft + (b.collisionWidth || b.width);
    const bTop = b.y + (b.collisionOffsetY || 0);
    const bBottom = bTop + (b.collisionHeight || b.height);

    return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
  }
  
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/stage";
  }

  onMount(() => {
    // Detect mobile device for performance optimizations
    detectMobile();
    
    if (canvas) {
      ctx = canvas.getContext('2d')!;
      
      // Mobile-specific canvas optimizations
      if (isMobile) {
        ctx.imageSmoothingQuality = 'low';
      }
      
      loadAssets().then(() => {
        // Setup input event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        setupGamepadSupport();
        
        initGame();      // 這時才會 startCountdown()
        gameLoop(); 
      });
    }
    
    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  });

  onDestroy(() => {
    // Stop BGM when leaving the gameplay page
    AudioManager.stopBGM();
  });
</script>

<Page mainProgress={main} 
  contentStyle="box-sizing: border-box; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
  
  <!-- Layered background effects for page wrapper -->
  <div slot="outside" class="pageBackground" style="background-image: url({imageAssets[stageBackgroundImageKey(selectedStage)]});">


  </div>
  
  <div class="gameContainer">
    <!-- Game UI -->
    <div class="gameUI">
      <div class="topUI">
        <div class="gameStats">
          <div class="statItem">
            <span class="statLabel">{$t("timeLabel")}:</span>
            <span class="statValue">{formatTime(survivalTime)}</span>
          </div>
          <div class="statItem">
            <span class="statLabel">{$t("scoreLabel")}:</span>
            <span class="statValue">{score}</span>
          </div>
          <div class="statItem">
            <span class="statLabel">{$t("coinsLabel")}:</span>
            <span class="statValue">{coins}</span>
          </div>
          <div class="statItem">
            <span class="statLabel">{$t("livesLabel")}:</span>
            <span class="statValue">
              {#each Array(lives) as _, i}
                <Heart size={16} fill="currentColor" class="heartIcon" />
              {/each}
            </span>
          </div>
        </div>
        <button class="pauseBtn" on:click={togglePause}>
          {#if isPaused}
            <Play size={20} />
          {:else}
            <Pause size={20} />
          {/if}
        </button>
      </div>
    </div>

    <!-- Game Canvas -->
    <canvas 
      bind:this={canvas}
      class="gameCanvas"
    ></canvas>

    <!-- Hidden Touch Controls (without text overlay) -->
    <div class="touchControls">
      <div class="touchZone left" 
           role="button" 
           tabindex="0" 
           on:touchstart={() => jump()} 
           on:click={() => jump()}
           on:keydown={(e) => e.key === 'Enter' && jump()}
           aria-label="Jump"></div>
      <div class="touchZone right" 
           role="button" 
           tabindex="0" 
           on:touchstart={() => attack()} 
           on:click={() => attack()}
           on:keydown={(e) => e.key === 'Enter' && attack()}
           aria-label="Attack"></div>
    </div>

    <!-- Game Instructions with Simplified Icon Format -->
    <div class="instructions" class:portrait={$isPortrait}>
      <div class="objective">
        <strong>{$t("gameObjective")}</strong>
      </div>
      <div class="controlsCompact">
        <div class="controlGroup">
          <ArrowUpFromLine size={16} />
          <span class="actionLabel">Jump:</span>
          <span class="controls">
            <Keyboard size={12} />: Space/W/↑ | 
            <Smartphone size={12} />: {$t("touchLeft")} | 
            <Gamepad2 size={12} />: A
          </span>
        </div>
        <div class="controlGroup">
          <Sword size={16} />
          <span class="actionLabel">Attack:</span>
          <span class="controls">
            <Keyboard size={12} />: Enter/X/Z/D/→ | 
            <Smartphone size={12} />: {$t("touchRight")} | 
            <Gamepad2 size={12} />: B/X
          </span>
        </div>
      </div>
    </div>
  </div>
</Page>

<style>
  .gameContainer {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .gameUI {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    padding: 1rem;
  }

.topUI {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
    backdrop-filter: blur(10px);
    border: 1px solid rgba(148, 163, 184, 0.3);
    box-shadow: 
      0 0 20px rgba(59, 130, 246, 0.3),
      inset 0 1px 0 rgba(148, 163, 184, 0.1);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    position: relative;
    overflow: hidden;
  }

  .topUI::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
    animation: techScan 3s ease-in-out infinite;
    z-index: 1;
  }

  @keyframes techScan {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }

  .topUI > * {
    position: relative;
    z-index: 2;
  }

  .gameStats {
    display: flex;
    gap: 1.5rem;
  }

  .statItem {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .statLabel {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .statValue {
    font-size: 1.1rem;
    font-weight: bold;
    color: #fbbf24;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .statValue :global(.heartIcon) {
    color: #ef4444;
  }

  .pauseBtn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 0.5rem;
    border-radius: 0.5rem;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.3s;
  }

  .pauseBtn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .gameCanvas {
    border: 2px solid rgba(148, 163, 184, 0.3);
    border-radius: 0.5rem;
    background: transparent;
    cursor: pointer;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .touchControls {
    position: absolute;
    top: 4rem;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    pointer-events: none;
    z-index: 5;
  }

  .touchZone {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    cursor: pointer;
    transition: background 0.3s;
  }

  .instructions {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    transform: none;
    width: 30%;
    max-width: 30%;
    text-align: center;
    color: white;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
    backdrop-filter: blur(10px);
    border: 1px solid rgba(148, 163, 184, 0.3);
    padding: 1rem;
    border-radius: 0.75rem;
    font-size: max(2vh, 0.5rem);
    line-height: 1.4;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
  }

  .instructions.portrait {
    bottom: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 95%;
  }

  .objective {
    margin-bottom: 0.2em;
    color: #fbbf24;
    font-weight: bold;
  }

  .controlsCompact {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
  }

  .controlGroup {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  .actionLabel {
    font-weight: bold;
    color: #34d399;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 0.25em;
    flex-wrap: wrap;
    font-size: 0.85em;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .gameContainer {
      height: 100vh;
    }
    
    .gameCanvas {
      height: 100%;
    }
    
    .gameStats {
      gap: 0.75rem;
    }
    
    .statItem {
      font-size: 0.85em;
    }
    
    .statLabel {
      font-size: 0.7em;
    }
    
    .statValue {
      font-size: 1em;
    }
    
    .instructions {
      padding: 0.75em;
      max-width: 95%;
    }

    .controlGroup {
      align-items: flex-start;
      gap: 0.25em;
    }

    .controls {
      font-size: 0.75em;
    }
  }

  .pageBackground {
    position: absolute;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background-size: repeat;
    background-position: center;
    z-index: 0;
  }

  .pageBackground::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
  }

  .pageBackground::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      repeating-linear-gradient(
        45deg,
        rgba(255,255,255,0.2) 0 1px,
        transparent 1px 40px
      ),
      repeating-linear-gradient(
        -45deg,
        rgba(255,255,255,0.2) 0 1px,
        transparent 1px 40px
      );
    /* 40px 是格線間距，可依需求調整 */
  }
</style>