<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/assets/LocalizationAssets";
  import Page from "$lib/components/Page.svelte";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { onMount } from "svelte";
  import { PopupStore, PopupResult } from "$lib/systems/PopupStore";

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
  
  // Game entities
  let player = {
    x: 100,
    y: 300,
    width: 64,
    height: 64,
    velocityY: 0,
    onGround: false,
    animation: 'run',
    animationFrame: 0,
    animationTimer: 0
  };
  
  // Background scrolling
  let backgroundOffset = 0;
  
  let enemies: Array<{x: number, y: number, width: number, height: number}> = [];
  let gameCoins: Array<{x: number, y: number, width: number, height: number, collected: boolean}> = [];
  let projectiles: Array<{x: number, y: number, width: number, height: number, velocityX: number, animationFrame: number, animationTimer: number}> = [];
  
  // Game settings
  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const GROUND_Y = 400;
  const SCROLL_SPEED = 2;
  
  // Asset loading
  let assetsLoaded = false;
  let loadedImages: Record<string, HTMLImageElement> = {};
  
  async function loadAssets() {
    const imagePromises = Object.entries({
      background: imageAssets.stage01background,
      yuutaRun: imageAssets.yuutaRun,
      yuutaJump: imageAssets.yuutaJump,
      yuutaAttack: imageAssets.yuutaAttack,
      attackEffect: imageAssets.attackEffect,
      enemy: imageAssets.enemy,
      coin: imageAssets.coin
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
  
  function initGame() {
    if (!canvas || !ctx) return;
    
    canvas.width = 800;
    canvas.height = 600;
    
    // Reset game state
    gameState = 'playing';
    survivalTime = 0;
    lastSurvivalSecond = 0;
    coins = 0;
    lives = 3;
    score = 0;
    isPaused = false;
    backgroundOffset = 0;
    
    // Reset player
    player = {
      x: 100,
      y: GROUND_Y - 64,
      width: 64,
      height: 64,
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
    
    // Spawn initial coins
    for (let i = 0; i < 5; i++) {
      gameCoins.push({
        x: 300 + i * 200,
        y: GROUND_Y - 100 - Math.random() * 100,
        width: 32,
        height: 32,
        collected: false
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
      
      // Create projectile
      projectiles.push({
        x: player.x + player.width,
        y: player.y + player.height / 2,
        width: 32,
        height: 16,
        velocityX: 8,
        animationFrame: 0,
        animationTimer: 0
      });
    }
  }
  
  function spawnEnemy() {
    enemies.push({
      x: canvas.width + 50,
      y: GROUND_Y - 48,
      width: 48,
      height: 48
    });
  }
  
  function updateGame(deltaTime: number) {
    if (gameState !== 'playing' || !assetsLoaded) return;
    
    survivalTime += deltaTime / 1000;
    
    // Award 1 point per second for survival
    const currentSecond = Math.floor(survivalTime);
    if (currentSecond > lastSurvivalSecond) {
      score += (currentSecond - lastSurvivalSecond);
      lastSurvivalSecond = currentSecond;
    }
    
    // Update background scrolling
    backgroundOffset -= SCROLL_SPEED;
    
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
    if (player.animationTimer > 100) { // Faster animation for 6 frames
      player.animationFrame = (player.animationFrame + 1) % 6;
      player.animationTimer = 0;
      
      if (player.animation === 'attack' && player.animationFrame === 0) {
        player.animation = player.onGround ? 'run' : 'jump';
      }
    }
    
    // Update enemies
    enemies = enemies.filter(enemy => {
      enemy.x -= SCROLL_SPEED * 2;
      return enemy.x > -enemy.width;
    });
    
    // Update coins
    gameCoins.forEach(coin => {
      coin.x -= SCROLL_SPEED;
    });
    
    // Update projectiles
    projectiles = projectiles.filter(projectile => {
      projectile.x += projectile.velocityX;
      
      // Update projectile animation
      projectile.animationTimer += deltaTime;
      if (projectile.animationTimer > 100) {
        projectile.animationFrame = (projectile.animationFrame + 1) % 6; // Assume 6 frames for attack effect
        projectile.animationTimer = 0;
      }
      
      return projectile.x < canvas.width + 50;
    });
    
    // Collision detection - coins
    gameCoins.forEach(coin => {
      if (!coin.collected && 
          player.x < coin.x + coin.width &&
          player.x + player.width > coin.x &&
          player.y < coin.y + coin.height &&
          player.y + player.height > coin.y) {
        coin.collected = true;
        coins++;
        score += 10; // Award 10 points for collecting a coin
      }
    });
    
    // Collision detection - enemies (only if player is vulnerable)
    enemies.forEach((enemy, enemyIndex) => {
      if (player.x < enemy.x + enemy.width &&
          player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height &&
          player.y + player.height > enemy.y) {
        lives--;
        // Remove the enemy that hit the player
        enemies.splice(enemyIndex, 1);
        if (lives <= 0) {
          handleGameOver();
        } else {
          // Brief invincibility by moving player back
          player.x = Math.max(50, player.x - 50);
        }
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
    
    // Spawn enemies periodically (less frequently at start)
    if (Math.random() < Math.min(0.002 + survivalTime * 0.0001, 0.01)) {
      spawnEnemy();
    }
  }
  
  function render() {
    if (!ctx || !assetsLoaded) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw scrolling background
    if (loadedImages.background) {
      const bgWidth = canvas.width;
      const bgX1 = backgroundOffset % bgWidth;
      const bgX2 = bgX1 + bgWidth;
      
      // Draw two copies of the background for seamless scrolling
      ctx.drawImage(loadedImages.background, bgX1, 0, bgWidth, canvas.height);
      ctx.drawImage(loadedImages.background, bgX2, 0, bgWidth, canvas.height);
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
    
    // Draw enemies
    enemies.forEach(enemy => {
      if (loadedImages.enemy) {
        ctx.drawImage(loadedImages.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
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
    
    // Draw projectiles
    projectiles.forEach(projectile => {
      if (loadedImages.attackEffect) {
        const frameWidth = loadedImages.attackEffect.width / 6; // Assume 6 frames
        const frameHeight = loadedImages.attackEffect.height;
        const frameX = projectile.animationFrame * frameWidth;
        
        ctx.drawImage(
          loadedImages.attackEffect,
          frameX, 0, frameWidth, frameHeight, // Source rectangle (sprite frame)
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
      updateGame(16.67); // Approximately 60 FPS
    }
    render();
    requestAnimationFrame(gameLoop);
  }
  
  async function handleGameOver() {
    gameState = 'gameOver';
    
    const result = await PopupStore.open({
      title: $t("gameOver"),
      content: `🎮 Game Over! 🎮

⏱️ Survival Time: ${formatTime(survivalTime)}
🪙 Coins Collected: ${coins}
🎯 Final Score: ${score}

Great job! Try again to beat your high score!`,
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
        content: `⏸️ Game Paused ⏸️

⏱️ Time: ${formatTime(survivalTime)}
🎯 Score: ${score}
🪙 Coins: ${coins}
❤️ Lives: ${lives}

Take a break and come back when you're ready!`,
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
  
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/stage";
  }

  onMount(async () => {
    if (canvas) {
      ctx = canvas.getContext('2d')!;
      await loadAssets();
      initGame();
      gameLoop();
    }
  });
</script>

<Page mainProgress={main} 
  wrapperStyle="background: #000; color: white; overflow: hidden;"
  contentStyle="box-sizing: border-box; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
  
  <div class="gameContainer">
    <!-- Game UI -->
    <div class="gameUI">
      <div class="topUI">
        <div class="gameStats">
          <div class="statItem">
            <span class="statLabel">Time:</span>
            <span class="statValue">{formatTime(survivalTime)}</span>
          </div>
          <div class="statItem">
            <span class="statLabel">Score:</span>
            <span class="statValue">{score}</span>
          </div>
          <div class="statItem">
            <span class="statLabel">Coins:</span>
            <span class="statValue">{coins}</span>
          </div>
          <div class="statItem">
            <span class="statLabel">Lives:</span>
            <span class="statValue">{'❤️'.repeat(lives)}</span>
          </div>
        </div>
        <button class="pauseBtn" on:click={togglePause}>
          {isPaused ? '▶️' : '⏸️'}
        </button>
      </div>
    </div>

    <!-- Game Canvas -->
    <canvas 
      bind:this={canvas}
      class="gameCanvas"
    ></canvas>

    <!-- Touch Controls Overlay -->
    <div class="touchControls">
      <div class="touchZone left" on:touchstart={() => jump()} on:click={() => jump()}>
        <span>JUMP</span>
      </div>
      <div class="touchZone right" on:touchstart={() => attack()} on:click={() => attack()}>
        <span>ATTACK</span>
      </div>
    </div>

    <!-- Game Instructions -->
    <div class="instructions">
      <p>Touch left side to JUMP • Touch right side to ATTACK</p>
      <p>Collect coins and survive as long as possible!</p>
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
    max-width: 800px;
    height: 100vh;
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
    background: rgba(0, 0, 0, 0.8);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    backdrop-filter: blur(10px);
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
    color: rgba(255, 255, 255, 0.7);
  }

  .statValue {
    font-size: 1.1rem;
    font-weight: bold;
    color: #fbbf24;
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
    border: 2px solid #374151;
    border-radius: 0.5rem;
    background: #000;
    margin-top: 4rem;
    cursor: pointer;
    max-width: 100%;
    max-height: calc(100vh - 200px);
  }

  .touchControls {
    position: absolute;
    top: 4rem;
    left: 0;
    right: 0;
    bottom: 100px;
    display: flex;
    pointer-events: none;
    z-index: 5;
  }

  .touchZone {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 2px dashed rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.6);
    font-size: 1.2rem;
    font-weight: bold;
    pointer-events: auto;
    cursor: pointer;
    transition: background 0.3s;
  }

  .touchZone:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .touchZone.left {
    border-right: 1px dashed rgba(255, 255, 255, 0.2);
  }

  .touchZone.right {
    border-left: 1px dashed rgba(255, 255, 255, 0.2);
  }

  .instructions {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .gameContainer {
      height: 100vh;
    }
    
    .gameCanvas {
      margin-top: 5rem;
      max-height: calc(100vh - 250px);
    }
    
    .touchControls {
      top: 5rem;
      bottom: 80px;
    }
    
    .gameStats {
      gap: 0.75rem;
    }
    
    .statItem {
      font-size: 0.85rem;
    }
    
    .statLabel {
      font-size: 0.7rem;
    }
    
    .statValue {
      font-size: 1rem;
    }
    
    .touchZone {
      font-size: 1rem;
    }
    
    .instructions {
      font-size: 0.8rem;
      padding: 0 1rem;
    }
  }
</style>