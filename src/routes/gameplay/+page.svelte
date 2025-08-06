<script lang="ts">
  import { page } from '$app/stores';
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
  import { stageBackgroundImageKey } from "$lib/utils/KeyHelper";
  import { AudioManager } from "$lib/systems/AudioManager";
  import { StaticDataStore } from "$lib/systems/StaticDataStore";
  import { PlayerDataManager } from "$lib/systems/PlayerStore";
  
  // Import the new modular runner game
  import RunnerMainGame from "$lib/components/gameplay/runner/RunnerMainGame.svelte";
  import type { GameStats } from "$lib/components/gameplay/runner/types/GameTypes";

  let goToNextScene: Writable<string | null>;
  let runnerGame: RunnerMainGame;

  // Parse URL parameters for game mode
  $: gameMode = $page.url.searchParams.get('mode') || 'endless';
  $: levelId = $page.url.searchParams.get('levelId') || '';
  
  $: selectedCharacter = $playerStore.selectedCharacter;
  $: selectedStage = $playerStore.selectedStage;
  $: stageData = StaticDataStore.getStageById(selectedStage);

  // Game state for UI display
  let gameStats: GameStats = {
    survivalTime: 0,
    coins: 0,
    lives: 3,
    score: 0,
    isInvincible: false,
    invincibleTimer: 0
  };
  let isPaused = false;

  // Loading state
  let assetsLoaded = false;

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
    return 1 + Math.floor(gameStats.survivalTime / 10) * 0.05;
  }

  async function handleGameOver(stats: GameStats) {
    gameStats = stats;
    
    // Save progress to player store
    saveToPlayerStore();
    
    const result = await PopupStore.open({
      title: $t("gameOver"),
      content: `<div style="background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; text-align: left; line-height: 1.2; font-size: 1rem;">
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          <strong>${$t("survivalTimeLabel")}:</strong> ${formatTime(stats.survivalTime)}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
          <strong>${$t("coinsCollectedLabel")}:</strong> ${stats.coins}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
          <strong>${$t("finalScoreLabel")}:</strong> ${stats.score}
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
            location.reload(); // Simple restart - could be improved
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

  async function handlePause(stats: GameStats) {
    gameStats = stats;
    isPaused = true;
    
    const result = await PopupStore.open({
      title: $t("gamePaused"),
      content: `<div style="background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; text-align: left; line-height: 1.2; font-size: 1rem;">
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
          <strong>${$t("pauseTimeLabel")}:</strong> ${formatTime(stats.survivalTime)}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
          <strong>${$t("pauseScoreLabel")}:</strong> ${stats.score}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
          <strong>${$t("pauseCoinsLabel")}:</strong> ${stats.coins}
        </div>
        <div style="margin: 3px 0; display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>
          <strong>${$t("pauseLivesLabel")}:</strong> ${stats.lives}
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
            goToNextScene.set("/stage");
            return PopupResult.Close;
          }
        }
      ]
    });
    
    // Resume game if popup was closed without quitting
    isPaused = false;
    if (runnerGame) {
      runnerGame.resume();
    }
  }

  function togglePause() {
    if (runnerGame) {
      runnerGame.pause();
    }
  }

  function jump() {
    if (runnerGame) {
      runnerGame.triggerJump();
    }
  }

  function attack() {
    if (runnerGame) {
      runnerGame.triggerAttack();
    }
  }

  function goToStage() {
    // If we came from a level, go back to the stage detail page
    if (gameMode === 'level' && selectedStage) {
      goToNextScene.set(`/stage/${selectedStage}`);
    } else {
      goToNextScene.set("/stage");
    }
  }

  function saveToPlayerStore() {
    // Add collected coins as gold to player resources
    PlayerDataManager.addResources({ gold: gameStats.coins });
    
    // Update stage record if this is better than previous
    const currentSpeed = getDisplayScrollSpeed();
    const isNewRecord = PlayerDataManager.updateStageRecord(selectedStage, {
      time: gameStats.survivalTime,
      score: gameStats.score,
      speed: currentSpeed
    });
    
    // Update the store to trigger reactivity
    playerStore.set(PlayerDataManager.getData());
    
    if (isNewRecord) {
      console.log('New record set!');
    }
  }

  // Periodic stats update
  let statsUpdateInterval: ReturnType<typeof setInterval>;
  
  async function main() {
    goToNextScene = writable(null);
    
    // Update UI stats periodically
    statsUpdateInterval = setInterval(() => {
      if (runnerGame) {
        gameStats = runnerGame.getGameStats();
      }
    }, 100);
    
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/stage";
  }

  onDestroy(() => {
    if (statsUpdateInterval) {
      clearInterval(statsUpdateInterval);
    }
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
        <button class="pauseBtn" on:click={togglePause}>
          {#if isPaused}
            <Play size={20} />
          {:else}
            <Pause size={20} />
          {/if}
        </button>
      </div>
    </div>

    <!-- Game Canvas using new modular component -->
    <RunnerMainGame 
      bind:this={runnerGame}
      {selectedCharacter}
      {selectedStage}
      onGameOver={handleGameOver}
      onPause={handlePause}
      onSave={saveToPlayerStore}
      onExit={goToStage}
      gameMode={gameMode}
      {levelId}
    />

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
  }

  @keyframes scan {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }
</style>