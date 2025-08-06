<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { get, writable, type Writable } from "svelte/store";
  import { AudioManager } from "$lib/systems/AudioManager";
  import { StaticDataStore } from "$lib/systems/StaticDataStore";
  import { characterAttackImageKey, characterJumpImageKey, characterRunImageKey, characterAttackEffectImageKey, stageBackgroundImageKey, stageBgmAudioKey, characterWalkAudioKey, characterAttackAudioKey } from "$lib/utils/KeyHelper";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { FontAssets } from "$lib/assets/FontAssets";
  import { PopupStore } from "$lib/systems/PopupStore";
  import { t } from "$lib/systems/LocalizationStore";
  
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
  import { LevelGenerator } from "./levels/LevelGenerator";

  import type { GameState, GameStats } from "./types/GameTypes";
  import { UniversalNavigationManager } from "$lib/systems/UniversalNavigationManager";

  // Props
  export let selectedCharacter: string;
  export let selectedStage: string;
  export let onGameOver: (stats: GameStats) => void;
  export let onPause: (stats: GameStats) => void;
  export let onSave: (stats: GameStats) => void = () => {}; // New callback for saving progress
  export let onExit: () => void = () => {}; // New callback for exiting
  export let gameMode: 'endless' | 'level' = 'endless';
  export let levelId: string = ''; // For level mode

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
  let levelGenerator: LevelGenerator;

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

  $: stageData = StaticDataStore.getStageById(selectedStage);
  $: stageGroundOffsetY = $stageData?.groundOffsetY ?? 0;

  async function loadAssets() {
    // Show loading popup with condition-based auto-close
    PopupStore.open({
      title: $t("loadingGameTitle"),
      content: $t("loadingGameContent"),
      buttons: [],
      autoClose: () => assetsLoaded
    });

    const backgroundImageKey = stageBackgroundImageKey(selectedStage);
    const runImageKey = characterRunImageKey(selectedCharacter);
    const jumpImageKey = characterJumpImageKey(selectedCharacter);
    const attackImageKey = characterAttackImageKey(selectedCharacter);
    const attackEffectImageKey = characterAttackEffectImageKey(selectedCharacter);
    const imagePromises = Object.entries({
      [backgroundImageKey]: imageAssets[backgroundImageKey],
      [runImageKey]: imageAssets[runImageKey],
      [jumpImageKey]: imageAssets[jumpImageKey],
      [attackImageKey]: imageAssets[attackImageKey],
      [attackEffectImageKey]: imageAssets[attackEffectImageKey],
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

    // Initialize generator based on game mode
    if (gameMode === 'endless') {
      endlessGenerator = new EndlessGenerator();
    } else {
      levelGenerator = new LevelGenerator(levelId || 'stage1_1', GAME_SETTINGS.GROUND_Y + stageGroundOffsetY);
    }

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
    if (!isStop) {
      backgroundLayer.update(deltaTime, currentScrollSpeed);
      characterLayer.update(deltaTime, currentScrollSpeed);
      trapEnemyLayer.update(deltaTime, currentScrollSpeed);
      effectLayer.update(deltaTime, currentScrollSpeed);
    }

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

    // Update layers and generate new entities based on game mode
    let newEntities: { enemies: any[], coins: any[], traps: any[] };
    
    if (gameMode === 'endless' && endlessGenerator) {
      newEntities = endlessGenerator.update(deltaTime);
    } else if (gameMode === 'level' && levelGenerator) {
      newEntities = levelGenerator.update(deltaTime);
      
      // Check if level is completed
      if (levelGenerator.isLevelCompleted() && !levelGenerator.isGoalReached()) {
        // Level completed, save progress and show completion
        onSave({
          ...gameStats,
          survivalTime: gameStats.survivalTime,
          score: gameStats.score,
          coins: gameStats.coins
        });
        levelGenerator.markGoalReached();
        // Could trigger completion popup here
      }
    } else {
      newEntities = { enemies: [], coins: [], traps: [] };
    }
    
    newEntities.enemies.forEach(enemy => trapEnemyLayer.addEnemy(enemy));
    newEntities.coins.forEach(coin => trapEnemyLayer.addCoin(coin));
    newEntities.traps.forEach(trap => trapEnemyLayer.addTrap(trap));
    
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

    ctx.font = `bold 80px ${FontAssets.getFamily("englishNumberBold")}, 'Orbitron', Arial, sans-serif`;
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
  
  function handleGamepadInput() {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads.filter(gamepad => gamepad && gamepad.connected)[0];
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

  export function triggerJump() {
    jump();
  }

  export function triggerAttack() {
    attack();
  }

  onMount(async () => {
    if (canvas) {
      ctx = canvas.getContext('2d')!;
      await loadAssets();
      
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      
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