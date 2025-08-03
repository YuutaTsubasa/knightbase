<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/assets/LocalizationAssets";
  import Page from "$lib/components/Page.svelte";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { onMount } from "svelte";
  import { PopupStore, PopupResult } from "$lib/systems/PopupStore";
  import { Play, Pause, Heart, Keyboard, Smartphone, Gamepad2, ArrowUpFromLine, Sword, Clock, Trophy, DollarSign, Zap, CircleDollarSign, Target } from "lucide-svelte";
  import { isPortrait } from "$lib/systems/Orientation";

  let goToNextScene: Writable<string | null>;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  // Game state
  let gameState: 'playing' | 'paused' | 'gameOver' = 'playing';
  let survivalTime = 0;
  let lastSurvivalSecond = 0;
  let coins = 0;
  let lives = 3;
  let score = 0;
  let isPaused = false;
  
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
  
  // Game settings
  const GRAVITY = 0.8;
  const JUMP_FORCE = -20; // Increased from -15 to account for larger objects
  const GROUND_Y = 480; // Moved down 160px as requested (was 320)
  const BASE_SCROLL_SPEED = 4.5; // Increased 3x from 1.5 to make gameplay faster

  // Trap spawning control - increased interval 3x
  let lastTrapSpawnTime = 0;
  const MIN_TRAP_INTERVAL = 5000; // Minimum 5 seconds between traps (3x from 3 seconds)
  
  // Asset loading
  let assetsLoaded = false;
  let loadedImages: Record<string, HTMLImageElement> = {};
  
  // Input handling
  let keysPressed: Record<string, boolean> = {};
  let gamepadIndex: number | null = null;
  
  async function loadAssets() {
    const imagePromises = Object.entries({
      background: imageAssets.stage01background,
      yuutaRun: imageAssets.yuutaRun,
      yuutaJump: imageAssets.yuutaJump,
      yuutaAttack: imageAssets.yuutaAttack,
      attackEffect: imageAssets.attackEffect,
      enemy: imageAssets.enemy,
      coin: imageAssets.coin,
      trap: imageAssets.trap
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
    
    await Promise.all(imagePromises);
    assetsLoaded = true;
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
    
    // Spawn initial coins (4x size for better visibility)
    for (let i = 0; i < 5; i++) {
      gameCoins.push({
        x: 300 + i * 200,
        y: GROUND_Y - 200 - Math.random() * 100,
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
  }
  
  function jump() {
    if (player.onGround && gameState === 'playing') {
      player.velocityY = JUMP_FORCE;
      player.onGround = false;
      player.animation = 'jump';
    }
  }
  
  function attack() {
    if (gameState === 'playing') {
      player.animation = 'attack';
      player.animationTimer = 0;
      
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
  
  function spawnCoin() {
    gameCoins.push({
      x: canvas.width + 50 + Math.random() * 200,
      y: GROUND_Y - 200 - Math.random() * 100,
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
      y: GROUND_Y - 48, // Adjusted for new trap height (halved back)
      width: 128, // Reduced from 256 to 128 (halved back)
      height: 48, // Reduced from 96 to 48 (halved back)
      // Collision box (smaller than visual sprite for better gameplay)
      collisionOffsetX: 16, // Scaled proportionally
      collisionOffsetY: 8, // Scaled proportionally
      collisionWidth: 96, // Scaled proportionally
      collisionHeight: 32 // Scaled proportionally
    });
  }
  
  function getCurrentScrollSpeed(): number {
    // Speed increases over time, starting at BASE_SCROLL_SPEED and increasing by 0.05 every 10 seconds (reduced from 0.1)
    return BASE_SCROLL_SPEED + Math.floor(survivalTime / 10) * 0.05;
  }
  
  function updateGame(deltaTime: number) {
    if (gameState !== 'playing' || !assetsLoaded) return;
    
    survivalTime += deltaTime / 1000;
    const currentScrollSpeed = getCurrentScrollSpeed();
    
    // Award 1 point per second for survival
    const currentSecond = Math.floor(survivalTime);
    if (currentSecond > lastSurvivalSecond) {
      score += (currentSecond - lastSurvivalSecond);
      lastSurvivalSecond = currentSecond;
    }
    
    // Update background scrolling with progressive speed
    backgroundOffset -= currentScrollSpeed;
    
    // Update player physics
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    
    // No horizontal movement during jump - removed to avoid unintended movement
    
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
      player.animationFrame = (player.animationFrame + 1) % 6;
      player.animationTimer = 0;
      
      if (player.animation === 'attack' && player.animationFrame === 0) {
        player.animation = player.onGround ? 'run' : 'jump';
      }
    }
    
    // Update enemies with progressive speed
    enemies = enemies.filter(enemy => {
      enemy.x -= currentScrollSpeed;
      return enemy.x > -enemy.width;
    });
    
    // Update coins with progressive speed
    gameCoins.forEach(coin => {
      coin.x -= currentScrollSpeed;
    });
    
    // Update traps with progressive speed
    traps = traps.filter(trap => {
      trap.x -= currentScrollSpeed;
      return trap.x > -trap.width;
    });
    
    // Update projectiles
    projectiles = projectiles.filter(projectile => {
      projectile.x += projectile.velocityX;
      
      // Update projectile animation
      // projectile.animationTimer += deltaTime;
      // if (projectile.animationTimer > 100) {
      //   projectile.animationFrame = (projectile.animationFrame + 1) % 6; // Assume 6 frames for attack effect
      //   projectile.animationTimer = 0;
      // }
      
      return projectile.x < canvas.width + 50;
    });
    
    // Collision detection - coins
    gameCoins.forEach(coin => {
      if (!coin.collected && checkCollision(player, coin)) {
        coin.collected = true;
        coins++;
        score += 10; // Award 10 points for collecting a coin
      }
    });
    
    // Collision detection - enemies (only if player is vulnerable)
    enemies.forEach((enemy, enemyIndex) => {
      if (checkCollision(player, enemy)) {
        lives--;
        // Remove the enemy that hit the player
        enemies.splice(enemyIndex, 1);
        if (lives <= 0) {
          handleGameOver();
        }
        // No backward movement on hit - removed as requested
      }
    });
    
    // Collision detection - traps
    traps.forEach(trap => {
      if (checkCollision(player, trap)) {
        lives--;
        if (lives <= 0) {
          handleGameOver();
        }
        // No backward movement on hit - removed as requested
      }
    });
    
    // Collision detection - projectiles vs enemies
    projectiles.forEach((projectile, projIndex) => {
      enemies.forEach((enemy, enemyIndex) => {
        if (projectile.x < enemy.x + enemy.width &&
            projectile.x + projectile.width > enemy.x &&
            projectile.y < enemy.y + enemy.height &&
            projectile.y + projectile.height > enemy.y) {
          enemies.splice(enemyIndex, 1);
          projectiles.splice(projIndex, 1);
          score += 10; // Award 10 points for defeating an enemy
        }
      });
    });
    
    // Spawn enemies more frequently (reduced by 3x to compensate for increased speed)
    if (Math.random() < Math.min(0.0027 + survivalTime * 0.00017, 0.0083)) {
      spawnEnemy();
    }
    
    // Spawn coins more frequently (reduced by 3x to compensate for increased speed)
    if (Math.random() < Math.min(0.002 + survivalTime * 0.0001, 0.006)) {
      spawnCoin();
    }
    
    // Spawn traps occasionally with minimum interval (reduced by 3x to compensate for increased speed)
    const currentTime = Date.now();
    if (Math.random() < Math.min(0.001 + survivalTime * 0.00007, 0.004) && 
        currentTime - lastTrapSpawnTime > MIN_TRAP_INTERVAL) {
      spawnTrap();
      lastTrapSpawnTime = currentTime;
    }
  }
  
  function render() {
    if (!ctx || !assetsLoaded) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw scrolling background with enhanced layered effects
    if (loadedImages.background) {
      const bgWidth = canvas.width;
      const bgHeight = canvas.height;
      
      // Background moved down 160px, need to fill the top and draw extended background
      const backgroundYOffset = 160;
      const extendedHeight = bgHeight + backgroundYOffset;
      
      const bgX1 = backgroundOffset % bgWidth;
      const bgX2 = bgX1 + bgWidth;
      
      // Draw background pattern to fill entire extended area including top 160px
      for (let y = -backgroundYOffset; y < extendedHeight; y += bgHeight) {
        ctx.drawImage(loadedImages.background, bgX1, y, bgWidth, bgHeight);
        ctx.drawImage(loadedImages.background, bgX2, y, bgWidth, bgHeight);
      }
      
      // Add 0.5 transparent black overlay with blur effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add white diagonal grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      // Draw diagonal lines
      const gridSize = 50;
      for (let x = -gridSize; x < canvas.width + gridSize; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x + canvas.height, canvas.height);
      }
      for (let x = 0; x < canvas.width + gridSize; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x - canvas.height, canvas.height);
      }
      ctx.stroke();
    } else {
      // Fallback background
      ctx.fillStyle = '#4a90e2';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#8b5a3c';
      ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    }
    
    // Draw player with sprite sheet animation (6 frames horizontally)
    let playerImage = loadedImages.yuutaRun;
    if (player.animation === 'jump') playerImage = loadedImages.yuutaJump;
    if (player.animation === 'attack') playerImage = loadedImages.yuutaAttack;
    
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
    
    // Draw enemies with horizontal flipping
    enemies.forEach(enemy => {
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
    });
    
    // Draw coins
    gameCoins.forEach(coin => {
      if (!coin.collected) {
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
    
    // Draw traps
    traps.forEach(trap => {
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
    });
    
    // Draw projectiles
    projectiles.forEach(projectile => {
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
    });
  }
  
  function gameLoop() {
    if (!isPaused) {
      handleGamepadInput(); // Check gamepad input each frame
      updateGame(16.67); // Approximately 60 FPS
    }
    render();
    requestAnimationFrame(gameLoop);
  }
  
  async function handleGameOver() {
    gameState = 'gameOver';
    
    const result = await PopupStore.open({
      title: $t("gameOver"),
      content: `<div style="background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; text-align: left; line-height: 1.2; font-size: 1rem;">
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          <strong>${$t("survivalTimeLabel")}:</strong> ${formatTime(survivalTime)}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
          <strong>${$t("coinsCollectedLabel")}:</strong> ${coins}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
            <strong>${$t("pauseScoreLabel")}:</strong> ${score}
          </div>
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
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
    if (canvas) {
      ctx = canvas.getContext('2d')!;
      loadAssets().then(() => {
        // Setup input event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        setupGamepadSupport();
        
        initGame();
        gameLoop();
      });
    }
    
    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  });
</script>

<Page mainProgress={main} 
  wrapperStyle="background-image: url({imageAssets.stage01background}); background-size: repeat; background-position: center; background-color: white;"
  contentStyle="box-sizing: border-box; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)); backdrop-filter: blur(10px);">
  
  <!-- Layered background effects for page wrapper -->
  <div slot="outside" class="pageBackground" style="background-image: url({imageAssets.stage01background});"></div>
  
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
            <Keyboard size={12} />: [Enter/X/Z/D/→] | 
            <Smartphone size={12} />: {$t("touchRight")} | 
            <Gamepad2 size={12} />: [B/X]
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
    background: 
      linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), 
      linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%), 
      linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%);
    background-size: 50px 50px;
    background-position: 0 0, 0 25px, 25px -25px, -25px 0px;
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
    background-image: url({imageAssets.backgroundWhiteButton});
    background-size: cover;
    background-position: 50% 15%;
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
    background-color: #0000ff;
    mix-blend-mode: multiply;
    opacity: 1;
    z-index: 1;
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
    background: #000;
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
    bottom: 200px;
    display: flex;
    pointer-events: none;
    z-index: 5;
  }

  .touchZone {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.02);
    border: 2px dotted black; /* Added black dotted border for better visibility */
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
    font-size: 0.5rem;
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
    
    .touchControls {
      top: 5rem;
      bottom: 250px;
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
      font-size: 0.5rem;
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
    backdrop-filter: blur(10px);
    z-index: 1;
  }

  .pageBackground::after {
    content: "";
    position: absolute;
    inset: 0;
    background: 
      linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%), 
      linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%), 
      linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%);
    background-size: 50px 50px;
    background-position: 0 0, 0 25px, 25px -25px, -25px 0px;
    z-index: 2;
  }
</style>