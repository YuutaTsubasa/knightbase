<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/assets/LocalizationAssets";
  import Page from "$lib/components/Page.svelte";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { onMount } from "svelte";

  let countdown = 10;
  let gameplayStarted = false;

  let goToNextScene: Writable<string | null>;
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/stage";
  }

  onMount(() => {
    gameplayStarted = true;
    
    // Start countdown timer
    const timer = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(timer);
        // Auto-redirect to stage selection
        goToNextScene.set("/stage");
      }
    }, 1000);

    // Cleanup timer on component destroy
    return () => {
      clearInterval(timer);
    };
  });
</script>

<Page mainProgress={main} 
  wrapperStyle="position: relative; background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%); color: white;"
  contentStyle="box-sizing: border-box; height: 100vh; display: flex; align-items: center; justify-content: center;">
  
  <div class="gameplayPage">
    <div class="gameplayContent">
      <div class="gameTitle" style={FontAssets.getCssStyle("titleBold")}>
        {$t('gameplayInProgress')}
      </div>
      
      <div class="gameIndicator">
        <div class="loadingSpinner"></div>
        <p>{$t('gameplaySimulating')}</p>
      </div>
      
      <div class="countdownSection">
        <p class="countdownText">
          {$t('returningToStageSelection')}
        </p>
        <div class="countdownTimer" style={FontAssets.getCssStyle("titleBold")}>
          {countdown}
        </div>
      </div>
      
      <div class="gameStatus">
        <div class="statusItem">
          <span class="statusLabel">{$t('battleStatus')}:</span>
          <span class="statusValue fighting">{$t('fighting')}</span>
        </div>
        <div class="statusItem">
          <span class="statusLabel">{$t('timeElapsed')}:</span>
          <span class="statusValue">{10 - countdown}s</span>
        </div>
      </div>
    </div>
  </div>
</Page>

<style>
  .gameplayPage {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    text-align: center;
  }

  .gameplayContent {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    max-width: 500px;
    padding: 2rem;
  }

  .gameTitle {
    font-size: 2.5rem;
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .gameIndicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .loadingSpinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-left: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .gameIndicator p {
    margin: 0;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .countdownSection {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 1rem;
    backdrop-filter: blur(10px);
  }

  .countdownText {
    margin: 0;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .countdownTimer {
    font-size: 3rem;
    color: #fbbf24;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    animation: countdownPulse 1s ease-in-out infinite;
  }

  @keyframes countdownPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  .gameStatus {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 0.5rem;
    min-width: 300px;
  }

  .statusItem {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .statusLabel {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }

  .statusValue {
    color: white;
    font-weight: bold;
  }

  .statusValue.fighting {
    color: #ef4444;
    animation: blink 1.5s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>