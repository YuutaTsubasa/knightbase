<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { AudioManager } from "$lib/systems/AudioManager";
  import { StaticDataStore } from "$lib/systems/StaticDataStore";
  import { addResourcesToSaveData, playerStore, updateStageRecordToSaveData } from "$lib/systems/PlayerStore";
  import { characterAttackImageKey, characterJumpImageKey, characterRunImageKey, characterAttackEffectImageKey, stageBackgroundImageKey, stageBgmAudioKey, characterWalkAudioKey, characterAttackAudioKey } from "$lib/utils/KeyHelper";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { FontAssets } from "$lib/assets/FontAssets";
  import { PopupStore, PopupResult } from "$lib/systems/PopupStore";
  import { t } from "$lib/systems/LocalizationStore";
  import { isPortrait } from "$lib/systems/Orientation";
  import { Play, Pause, Heart, Keyboard, Smartphone, Gamepad2, ArrowUpFromLine, Sword } from "lucide-svelte";
  
  // Layer imports
  import { Layer } from "./Layer";
  
  // Object imports
  import { Player } from "./objects/Player";
  import { Explosion } from "./objects/Explosion";
  import { Coin } from "./objects/Coin";
  import { Goal } from "./objects/Goal";
  import { Enemy } from "./objects/Enemy";
  import { Trap } from "./objects/Trap";
  import { Projectile } from "./objects/Projectile";
  
  // Generator import
  import { EndlessGenerator } from "./generators/EndlessGenerator";
  import { LevelGenerator } from "./generators/LevelGenerator";
  import { PatternFactory } from "./patterns/PatternFactory";
  import { TextAssetManager } from "$lib/assets/TextAssets";
  import type { Pattern } from "./patterns/Pattern";

  import type { GameState, GameStats } from "./GameTypes";
  import { getRenderGroundY } from "./Utils";
    import { get } from "svelte/store";

  // Props
  export let selectedCharacter: string;
  export let selectedStage: string;
  export let onExit: () => void = () => {}; // Callback for exiting
  export let gameMode: 'endless' | 'level' = 'endless';
  export let levelId: string = ''; // For level mode

  // Canvas and rendering
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let animationFrameId: number;

  // Game layers
  let backgroundLayer: Layer;
  let characterLayer: Layer;
  let trapEnemyLayer: Layer;
  let effectLayer: Layer;

  // Game entities  
  let player: Player;
  let endlessGenerator: EndlessGenerator;
  let levelGenerator: LevelGenerator;

  // Background state (moved from BackgroundLayer)
  let backgroundOffset: number = 0;

  // Game state
  let gameState: GameState = 'playing';
  let gameStats: GameStats = {
    survivalTime: 0,
    coins: 0,
    lives: 3,
    score: 0
  };
  let lastSurvivalSecond = 0;
  let playerDistanceTraveled = 0; // Track total distance traveled

  // UI state
  let isPaused = false;

  // Game settings
  const GAME_SETTINGS = {
    GRAVITY: -0.8,
    JUMP_FORCE: 20,
    BASE_SCROLL_SPEED: 8,
    GROUND_Y: 120,
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
  let levelPatterns: Pattern[] = []; // Store level patterns for initGame

  // Input handling
  let keysPressed: Record<string, boolean> = {};

  $: stageData = StaticDataStore.getStageById(selectedStage);
  $: stageGroundOffsetY = $stageData?.groundOffsetY ?? 0;

  // Helper functions
  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function getCurrentScrollSpeed(): number {
    return 8 + Math.floor(gameStats.survivalTime / 10) * 0.05;
  }

  function getDisplayScrollSpeed(): number {
    // Display speed starts at 1.0x but actual speed is still 8.0x
    return getCurrentScrollSpeed() - 7.0;
  }

  function saveToPlayerStore() {
    // Add collected coins as gold to player resources
    addResourcesToSaveData({ gold: gameStats.coins });
    
    // Update stage record if this is better than previous
    const currentSpeed = getDisplayScrollSpeed();
    let recordKey = `${selectedStage}_endless`; // For endless mode use stageId_endless format
    
    // For level mode, use the specific level ID
    if (gameMode === 'level' && levelId) {
      recordKey = levelId;
    }
    
    const isNewRecord = updateStageRecordToSaveData(recordKey, {
      time: gameStats.survivalTime,
      score: gameStats.score,
      speed: currentSpeed
    });
  }

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
    
    // Load level patterns if in level mode
    levelPatterns = [];
    if (gameMode === 'level' && levelId) {
      try {
        const patternData = await TextAssetManager.loadPatternData(levelId);
        levelPatterns = PatternFactory.createPatternsFromJson(patternData);
      } catch (error) {
        console.error(`Failed to load level ${levelId}:`, error);
        // Fallback to empty level
        levelPatterns = [];
      }
    }
    
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
      score: 0
    };
    lastSurvivalSecond = 0;
    playerDistanceTraveled = 0;

    // Initialize layers
    backgroundLayer = new Layer('background');
    characterLayer = new Layer('character');
    trapEnemyLayer = new Layer('trap-enemy');
    effectLayer = new Layer('effects');

    // Initialize player
    player = new Player(
      { x: 50, y: 0 },
      { width: 256, height: 256 },
      selectedCharacter,
      GAME_SETTINGS.GRAVITY,
      GAME_SETTINGS.JUMP_FORCE,
      GAME_SETTINGS.INVINCIBLE_DURATION,
      {
        collisionOffsetX: 40,
        collisionOffsetY: 20,
        collisionWidth: 176,
        collisionHeight: 216
      }
    );
    characterLayer.addEntity(player);

    // Initialize generator based on game mode
    if (gameMode === 'endless') {
      endlessGenerator = new EndlessGenerator();
    } else if (gameMode === 'level') {
      // Create LevelGenerator with loaded patterns
      levelGenerator = new LevelGenerator(levelPatterns);
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


  function updateGame(deltaTime: number) {
    if (gameState !== 'playing' || !assetsLoaded) return;

    const currentScrollSpeed = getCurrentScrollSpeed();
    if (!isStop) {
      // Update background offset
      backgroundOffset -= currentScrollSpeed;
      
      // Update all layers
      backgroundLayer.update(deltaTime, currentScrollSpeed);
      characterLayer.update(deltaTime, currentScrollSpeed);
      trapEnemyLayer.update(deltaTime, currentScrollSpeed);
      effectLayer.update(deltaTime, currentScrollSpeed);
      
      // Remove finished explosions from effect layer
      effectLayer.removeEntitiesWhere(entity => {
        if (entity instanceof Explosion) {
          return entity.finished;
        }
        return false;
      });
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

    // Update distance traveled for level pattern generation
    playerDistanceTraveled += currentScrollSpeed; // Convert to pixels per frame equivalent

    // Update layers and generate new entities based on game mode
    let newEntities: { enemies: any[], coins: any[], traps: any[], goals?: any[] };
    
    if (gameMode === 'endless' && endlessGenerator) {
      newEntities = endlessGenerator.update(deltaTime);
    } else if (gameMode === 'level' && levelGenerator) {
      newEntities = levelGenerator.update(playerDistanceTraveled);
    } else {
      newEntities = { enemies: [], coins: [], traps: [], goals: [] };
    }

    newEntities.enemies.forEach(enemy => trapEnemyLayer.addEntity(enemy));
    newEntities.coins.forEach(coin => trapEnemyLayer.addEntity(coin));
    newEntities.traps.forEach(trap => trapEnemyLayer.addEntity(trap));
    if (newEntities.goals) {
      newEntities.goals.forEach(goal => trapEnemyLayer.addEntity(goal));
    }
    
    // Handle collisions
    handleCollisions();

    // Invincibility is now handled internally by Player class during its update
  }

  function handleCollisions() {
    if (!player) return;

    // Get entities from layers
    const coins = trapEnemyLayer.getEntities().filter(entity => entity instanceof Coin) as Coin[];
    const goals = trapEnemyLayer.getEntities().filter(entity => entity instanceof Goal) as Goal[];
    const enemies = trapEnemyLayer.getEntities().filter(entity => entity instanceof Enemy) as Enemy[];
    const traps = trapEnemyLayer.getEntities().filter(entity => entity instanceof Trap) as Trap[];
    const projectiles = characterLayer.getEntities().filter(entity => entity instanceof Projectile) as Projectile[];

    // Collision with coins
    coins.forEach(coin => {
      if (!coin.collected && player.checkCollision(coin)) {
        coin.collect();
        gameStats.coins++;
        gameStats.score += 10;
        AudioManager.play("sfx_coin");
      }
    });

    // Collision with goals (for level mode)
    if (gameMode === 'level') {
      goals.forEach(goal => {
        if (!goal.reached && player.checkCollision(goal)) {
          goal.reach();
          levelGenerator?.markGoalReached();
          
          // Show level completion popup
          saveToPlayerStore();
          handleLevelComplete();
        }
      });
    }

    // Collision with enemies and traps
    [...enemies, ...traps].forEach(entity => {
      if (player.checkCollision(entity) && player.takeDamage()) {
        gameStats.lives--;
        if (gameStats.lives <= 0) {
          handleGameOver();
        }
      }
    });

    // Projectile vs enemy collisions
    projectiles.forEach(projectile => {
      enemies.forEach(enemy => {
        if (projectile.checkCollision(enemy)) {
          // Remove enemy and projectile
          trapEnemyLayer.removeEntity(enemy);
          characterLayer.removeEntity(projectile);
          
          // Create explosion
          const explosion = new Explosion(
            { x: enemy.x - enemy.width / 2, y: enemy.y - enemy.height / 2 - 20 },
            { width: enemy.width * 2, height: enemy.height * 2 }
          );
          effectLayer.addEntity(explosion);
          
          gameStats.score += 10;
        }
      });
    });

    // Clean up collected coins
    trapEnemyLayer.removeEntitiesWhere(entity => {
      if (entity instanceof Coin) {
        return entity.collected;
      }
      return false;
    });
  }

  function render() {
    if (!ctx || !assetsLoaded) return;
    
    // Calculate ground position
    const renderGroundY = getRenderGroundY(ctx.canvas.height, GAME_SETTINGS.GROUND_Y);

    // Render background first
    renderBackground(ctx, renderGroundY);
    
    // Render layers in order with groundY for positioning
    effectLayer.render(ctx, loadedImages, renderGroundY);
    trapEnemyLayer.render(ctx, loadedImages, renderGroundY);
    
    // Render character layer (player and projectiles) - no groundY needed as player handles its own positioning
    characterLayer.render(ctx, loadedImages, renderGroundY);

    // Render countdown
    if (!waitForCountdown && showCountdown) {
      renderCountdown(ctx);
    }
  }

  function renderBackground(ctx: CanvasRenderingContext2D, renderGroundY: number): void {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const backgroundImage = loadedImages[stageBackgroundImageKey(selectedStage)];

    if (backgroundImage) {
      const bgWidth = ctx.canvas.width;
      const bgHeight = ctx.canvas.height;

      // Background moved down, need to fill the top and draw extended background
      const backgroundYOffset = bgHeight + stageGroundOffsetY;
      const extendedHeight = bgHeight + backgroundYOffset;

      const bgX1 = backgroundOffset % bgWidth;
      const bgX2 = bgX1 + bgWidth;

      // Draw background pattern to fill entire extended area
      for (let y = -backgroundYOffset; y < extendedHeight; y += bgHeight) {
        ctx.drawImage(backgroundImage, bgX1, y, bgWidth, bgHeight);
        ctx.drawImage(backgroundImage, bgX2, y, bgWidth, bgHeight);
      }
    } else {
      // Fallback background
      ctx.fillStyle = '#4a90e2';
      ctx.fillRect(0, 0, ctx.canvas.width, renderGroundY);
      ctx.fillStyle = '#8b5a3c';
      ctx.fillRect(0, renderGroundY, ctx.canvas.width, ctx.canvas.height - renderGroundY);
    }

    // 畫 GROUND_Y 參考線
    // ctx.save();
    // ctx.strokeStyle = '#ff00ff';
    // ctx.lineWidth = 2;
    // ctx.beginPath();
    // ctx.moveTo(0, renderGroundY);
    // ctx.lineTo(ctx.canvas.width, renderGroundY);
    // ctx.stroke();
    // ctx.restore();
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

  async function handleGameOver() {
    AudioManager.play("sfx_gameover");
    gameState = 'gameOver';
    
    // Save progress to player store
    saveToPlayerStore();
    
    const result = await PopupStore.open({
      title: $t("gameOver"),
      content: `<div style="background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; text-align: left; line-height: 1.2; font-size: 1rem;">
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          <strong>${$t("survivalTimeLabel")}:</strong> ${formatTime(gameStats.survivalTime)}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
          <strong>${$t("coinsCollectedLabel")}:</strong> ${gameStats.coins}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
          <strong>${$t("finalScoreLabel")}:</strong> ${gameStats.score}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
          <strong>${$t("finalSpeedLabel")}:</strong> ${getDisplayScrollSpeed().toFixed(1)}x
        </div>

        <div style="margin-top: 5px; font-style: italic; color: #fbbf24;">
          ${$t("encouragementMessage")}
        </div>
      </div>`,
      buttons: [
        {
          text: $t("playAgain"),
          onClick: () => {
            initGame(); // Restart the game
            return PopupResult.Close;
          }
        },
        {
          text: $t("backToMenu"),
          onClick: () => {
            onExit();
            return PopupResult.Close;
          }
        }
      ]
    });
  }

  async function handleLevelComplete() {
    AudioManager.play("sfx_gameover");
    gameState = 'gameOver'; // Pause the game
    
    const result = await PopupStore.open({
      title: $t("levelCompleted"),
      content: `<div style="background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; text-align: left; line-height: 1.2; font-size: 1rem;">
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          <strong>${$t("completionTime")}:</strong> ${formatTime(gameStats.survivalTime)}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
          <strong>${$t("coinsCollectedLabel")}:</strong> ${gameStats.coins}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
          <strong>${$t("finalScoreLabel")}:</strong> ${gameStats.score}
        </div>

        <div style="margin-top: 10px; font-weight: bold; color: #34d399; text-align: center;">
          ${$t("congratulations")}
        </div>
      </div>`,
      buttons: [
        {
          text: $t("playAgain"),
          onClick: () => {
            initGame(); // Restart the level
            return PopupResult.Close;
          }
        },
        {
          text: $t("backToMenu"),
          onClick: () => {
            onExit();
            return PopupResult.Close;
          }
        }
      ]
    });
  }

  async function handlePause() {
    AudioManager.play("sfx_pause");
    if (gameState === 'playing') {
      gameState = 'paused';
      isPaused = true;
      
      const result = await PopupStore.open({
        title: $t("gamePaused"),
        content: `<div style="background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; text-align: left; line-height: 1.2; font-size: 1rem;">
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            <strong>${$t("pauseTimeLabel")}:</strong> ${formatTime(gameStats.survivalTime)}
          </div>
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
            <strong>${$t("pauseScoreLabel")}:</strong> ${gameStats.score}
          </div>
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
            <strong>${$t("pauseCoinsLabel")}:</strong> ${gameStats.coins}
          </div>
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>
            <strong>${$t("pauseLivesLabel")}:</strong> ${gameStats.lives}
          </div>
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
            <strong>${$t("currentSpeedLabel")}:</strong> ${getDisplayScrollSpeed().toFixed(1)}x
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
              onExit();
              return PopupResult.Close;
            }
          }
        ]
      });
      
      // Resume game if popup was closed without quitting
      isPaused = false;
      gameState = 'playing';
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
        characterLayer.addEntity(projectile);
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

  function togglePauseClick() {
    handlePause();
  }
</script>

<!-- Layered background effects for page wrapper -->
<div class="pageBackground" style="background-image: url({imageAssets[stageBackgroundImageKey(selectedStage)]});">
</div>

<div class="gameContainer">
  <!-- Game UI -->
  <div class="gameUI">
    <div class="topUI">
      <div class="gameStats">
        <div class="statItem">
          <span class="statLabel">{$t("timeLabel")}:</span>
          <span class="statValue">{formatTime(gameStats.survivalTime)}</span>
        </div>
        <div class="statItem">
          <span class="statLabel">{$t("scoreLabel")}:</span>
          <span class="statValue">{gameStats.score}</span>
        </div>
        <div class="statItem">
          <span class="statLabel">{$t("coinsLabel")}:</span>
          <span class="statValue">{gameStats.coins}</span>
        </div>
        <div class="statItem">
          <span class="statLabel">{$t("livesLabel")}:</span>
          <span class="statValue">
            {#each Array(gameStats.lives) as _, i}
              <Heart size={16} fill="currentColor" class="heartIcon" />
            {/each}
          </span>
        </div>
      </div>
      <button class="pauseBtn" on:click={togglePauseClick}>
        {#if isPaused}
          <Play size={20} />
        {:else}
          <Pause size={20} />
        {/if}
      </button>
    </div>
  </div>

  <!-- Game Canvas -->
  <canvas bind:this={canvas} class="gameCanvas"></canvas>

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

<style>
  .gameContainer {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
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
    animation: scan 3s ease-in-out infinite;
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

  .pauseBtn:global(.navFocused),
  .pauseBtn:hover, .pauseBtn:active {
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
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .gameContainer {
      height: 100vh;
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

  @keyframes scan {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
</style>