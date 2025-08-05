<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { get, writable, type Writable } from "svelte/store";
  import { AudioManager } from "$lib/systems/AudioManager";
  import { StaticDataStore } from "$lib/systems/StaticDataStore";
  import { characterAttackImageKey, characterJumpImageKey, characterRunImageKey, characterAttackEffectImageKey, stageBackgroundImageKey, stageBgmAudioKey, characterWalkAudioKey, characterAttackAudioKey } from "$lib/utils/KeyHelper";
  import { imageAssets } from "$lib/assets/ImageAssets";
  
  // Layer imports
  import { BackgroundLayer } from "./layers/BackgroundLayer";
  import { CharacterLayer } from "./layers/CharacterLayer"; 
  import { TrapEnemyLayer } from "./layers/TrapEnemyLayer";
  import { EffectLayer } from "./layers/EffectLayer";
  
  // Object imports
  import { Player } from "./objects/Player";
  import { Explosion } from "./objects/Explosion";
  
  // Generator import
  import { EndlessGenerator } from "./endless/endlessGenerator";
  
  import type { GameState, GameStats } from "./types/GameTypes";

  // Props
  export let selectedCharacter: string;
  export let selectedStage: string;
  export let onGameOver: (stats: GameStats) => void;
  export let onPause: (stats: GameStats) => void;
  export let gameMode: 'endless' | 'level' = 'endless';

  // Canvas and rendering
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationFrameId: number;

  // Game layers
  let backgroundLayer: BackgroundLayer;
  let characterLayer: CharacterLayer;
  let trapEnemyLayer: TrapEnemyLayer;
  let effectLayer: EffectLayer;

  // Game entities  
  let player: Player;
  let endlessGenerator: EndlessGenerator;

  // Game state
  let gameState: GameState = 'playing';
  let gameStats: GameStats = {
    survivalTime: 0,
    coins: 0,
    lives: 3,
    score: 0,
    isInvincible: false,
    invincibleTimer: 0
  };
  let lastSurvivalSecond = 0;

  // Game settings
  const GAME_SETTINGS = {
    GRAVITY: 0.8,
    JUMP_FORCE: -20,
    GROUND_Y: 480,
    BASE_SCROLL_SPEED: 8,
    INVINCIBLE_DURATION: 1500,
    MIN_TRAP_INTERVAL: 3000
  };

  // Countdown system
  let countdown = 3;
  let waitForCountdown = true;
  let showCountdown = true;
  let countdownText = "3";
  let countdownTimer = 0;
  let isStop = false;

  // Asset loading
  let assetsLoaded = false;
  let loadedImages: Record<string, HTMLImageElement> = {};

  // Input handling
  let keysPressed: Record<string, boolean> = {};
  let gamepadIndex: number | null = null;

  $: stageData = StaticDataStore.getStageById(selectedStage);
  $: stageGroundOffsetY = $stageData?.groundOffsetY ?? 0;

  async function loadAssets() {
    const imagePromises = Object.entries({
      [`stage_background_${selectedStage}`]: imageAssets[stageBackgroundImageKey(selectedStage)],
      [`character_run_${selectedCharacter}`]: imageAssets[characterRunImageKey(selectedCharacter)],
      [`character_jump_${selectedCharacter}`]: imageAssets[characterJumpImageKey(selectedCharacter)],
      [`character_attack_${selectedCharacter}`]: imageAssets[characterAttackImageKey(selectedCharacter)],
      [`character_attack_effect_${selectedCharacter}`]: imageAssets[characterAttackEffectImageKey(selectedCharacter)],
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
      AudioManager.preload(stageBgmAudioKey(selectedStage)),
      AudioManager.preload(characterWalkAudioKey(selectedCharacter)),
      AudioManager.preload(characterAttackAudioKey(selectedCharacter)),
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
  }

  function initGame() {
    if (!canvas || !ctx) return;
    
    // Set canvas internal resolution
    canvas.width = 800;
    canvas.height = 600;
    
    // Reset game state
    gameState = 'playing';
    gameStats = {
      survivalTime: 0,
      coins: 0,
      lives: 3,
      score: 0,
      isInvincible: false,
      invincibleTimer: 0
    };
    lastSurvivalSecond = 0;

    // Initialize layers
    backgroundLayer = new BackgroundLayer(selectedStage, stageGroundOffsetY);
    characterLayer = new CharacterLayer();
    trapEnemyLayer = new TrapEnemyLayer();
    effectLayer = new EffectLayer();

    // Initialize player
    player = new Player(
      { x: 50, y: GAME_SETTINGS.GROUND_Y - 256 },
      { width: 256, height: 256 },
      GAME_SETTINGS.GROUND_Y,
      selectedCharacter,
      GAME_SETTINGS.GRAVITY,
      GAME_SETTINGS.JUMP_FORCE,
      {
        collisionOffsetX: 40,
        collisionOffsetY: 20,
        collisionWidth: 176,
        collisionHeight: 216
      }
    );
    characterLayer.setPlayer(player);

    // Initialize endless generator
    endlessGenerator = new EndlessGenerator();

    // Start countdown
    waitForCountdown = true;
    setTimeout(() => startCountdown(false), 1000);
  }

  function startCountdown(shouldStop: boolean = false) {
    isStop = shouldStop;
    countdown = 3;
    countdownText = "3";
    showCountdown = true;
    countdownTimer = 0;
    waitForCountdown = false;
    
    if (!shouldStop) {
      AudioManager.stopBGM();
      AudioManager.play(stageBgmAudioKey(selectedStage));
      AudioManager.play("sfx_countdown");
    }
  }

  function getCurrentScrollSpeed(): number {
    return GAME_SETTINGS.BASE_SCROLL_SPEED + Math.floor(gameStats.survivalTime / 10) * 0.05;
  }

  function updateGame(deltaTime: number) {
    if (gameState !== 'playing' || !assetsLoaded) return;

    const currentScrollSpeed = getCurrentScrollSpeed();

    if (waitForCountdown) return;

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

    // Update survival time and score
    gameStats.survivalTime += deltaTime / 1000;
    const currentSecond = Math.floor(gameStats.survivalTime);
    if (currentSecond > lastSurvivalSecond) {
      gameStats.score += (currentSecond - lastSurvivalSecond);
      lastSurvivalSecond = currentSecond;
    }

    // Update layers
    if (!isStop) {
      backgroundLayer.update(deltaTime, currentScrollSpeed);
      characterLayer.update(deltaTime, currentScrollSpeed);
      trapEnemyLayer.update(deltaTime, currentScrollSpeed);
      effectLayer.update(deltaTime, currentScrollSpeed);

      // Generate new entities
      const newEntities = endlessGenerator.update(deltaTime);
      newEntities.enemies.forEach(enemy => trapEnemyLayer.addEnemy(enemy));
      newEntities.coins.forEach(coin => trapEnemyLayer.addCoin(coin));
      newEntities.traps.forEach(trap => trapEnemyLayer.addTrap(trap));
    }

    // Handle collisions
    handleCollisions();

    // Update invincibility
    if (gameStats.isInvincible) {
      gameStats.invincibleTimer -= deltaTime;
      if (gameStats.invincibleTimer <= 0) {
        gameStats.isInvincible = false;
        gameStats.invincibleTimer = 0;
      }
    }
  }

  function handleCollisions() {
    const player = characterLayer.getPlayer();
    if (!player) return;

    // Collision with coins
    trapEnemyLayer.getCoins().forEach(coin => {
      if (!coin.collected && player.checkCollision(coin)) {
        coin.collect();
        gameStats.coins++;
        gameStats.score += 10;
        AudioManager.play("sfx_coin");
      }
    });

    // Collision with enemies and traps
    [...trapEnemyLayer.getEnemies(), ...trapEnemyLayer.getTraps()].forEach(entity => {
      if (player.checkCollision(entity) && !gameStats.isInvincible) {
        gameStats.lives--;
        gameStats.isInvincible = true;
        gameStats.invincibleTimer = GAME_SETTINGS.INVINCIBLE_DURATION;
        AudioManager.play("sfx_hurt");
        
        if (gameStats.lives <= 0) {
          handleGameOver();
        }
      }
    });

    // Projectile vs enemy collisions
    characterLayer.getProjectiles().forEach(projectile => {
      trapEnemyLayer.getEnemies().forEach(enemy => {
        if (projectile.checkCollision(enemy)) {
          // Remove enemy and projectile
          trapEnemyLayer.removeEntity(enemy);
          characterLayer.removeEntity(projectile);
          
          // Create explosion
          const explosion = new Explosion(
            { x: enemy.x - enemy.width / 2, y: enemy.y - enemy.height / 2 - 20 },
            { width: enemy.width * 2, height: enemy.height * 2 }
          );
          effectLayer.addExplosion(explosion);
          
          gameStats.score += 10;
          AudioManager.play("sfx_explosion");
        }
      });
    });

    // Clean up collected coins
    trapEnemyLayer.removeCollectedCoins();
  }

  function render() {
    if (!ctx || !assetsLoaded) return;
    
    // Render layers in order
    backgroundLayer.render(ctx, loadedImages);
    effectLayer.render(ctx, loadedImages);
    trapEnemyLayer.render(ctx, loadedImages);
    characterLayer.render(ctx, loadedImages);
    
    // Render player with invincibility
    characterLayer.renderPlayerWithInvincibility(
      ctx, 
      loadedImages, 
      gameStats.isInvincible, 
      gameStats.invincibleTimer
    );

    // Render countdown
    if (!waitForCountdown && showCountdown) {
      renderCountdown(ctx);
    }
  }

  function renderCountdown(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    const boxWidth = 480;
    const boxHeight = 80;
    const boxX = canvas.width / 2 - boxWidth / 2;
    const boxY = canvas.height / 2 - boxHeight / 2;

    ctx.beginPath();
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
    ctx.closePath();
    ctx.fillStyle = "#0021ff";
    ctx.fill();

    ctx.font = "bold 80px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(countdownText, canvas.width / 2, canvas.height / 2);

    ctx.restore();
  }

  let lastFrameTime = 0;
  function gameLoop() {
    const now = performance.now();
    const deltaTime = now - lastFrameTime;
    lastFrameTime = now;
    
    handleGamepadInput();
    updateGame(deltaTime);
    render();
    
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function handleGameOver() {
    AudioManager.play("sfx_gameover");
    gameState = 'gameOver';
    onGameOver(gameStats);
  }

  function handlePause() {
    AudioManager.play("sfx_pause");
    if (gameState === 'playing') {
      gameState = 'paused';
      onPause(gameStats);
    }
  }

  // Input handling
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
        handlePause();
        break;
    }
  }
  
  function handleKeyUp(event: KeyboardEvent) {
    keysPressed[event.code] = false;
  }
  
  function setupGamepadSupport() {
    window.addEventListener('gamepadconnected', (e) => {
      gamepadIndex = e.gamepad.index;
    });
    
    window.addEventListener('gamepaddisconnected', (e) => {
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
    
    if (gamepad.buttons[0]?.pressed) jump();
    if (gamepad.buttons[1]?.pressed || gamepad.buttons[2]?.pressed) attack();
    if (gamepad.buttons[9]?.pressed) handlePause();
  }

  function jump() {
    if (player && gameState === 'playing') {
      player.jump();
    }
  }
  
  function attack() {
    if (player && gameState === 'playing') {
      const projectile = player.attack();
      if (projectile) {
        characterLayer.addProjectile(projectile);
      }
    }
  }

  // Public methods for external control
  export function pause() {
    handlePause();
  }

  export function resume() {
    if (gameState === 'paused') {
      gameState = 'playing';
      startCountdown(true);
    }
  }

  export function getGameStats(): GameStats {
    return { ...gameStats };
  }

  onMount(async () => {
    if (canvas) {
      ctx = canvas.getContext('2d')!;
      await loadAssets();
      
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      setupGamepadSupport();
      
      initGame();
      gameLoop();
    }
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    AudioManager.stopBGM();
  });
</script>

<canvas bind:this={canvas} class="gameCanvas"></canvas>

<style>
  .gameCanvas {
    border: 2px solid rgba(148, 163, 184, 0.3);
    border-radius: 0.5rem;
    background: transparent;
    cursor: pointer;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>