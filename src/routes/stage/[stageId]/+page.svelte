<script lang="ts">
  import { page } from '$app/stores';
  import { t } from "$lib/systems/LocalizationStore";
  import { StaticDataStore } from "$lib/systems/StaticDataStore";
  import { playerStore } from "$lib/systems/PlayerStore";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { characterPortraitImageKey, stageBackgroundImageKey } from "$lib/utils/KeyHelper";
  import Page from "$lib/components/Page.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { Play, Trophy, Clock, Target, Lock, Zap, Coins, SwordIcon, Timer } from "lucide-svelte";
  import { PopupStore, PopupResult } from "$lib/systems/PopupStore";
  import SpaceBetweenTextGroup from '$lib/components/SpaceBetweenTextGroup.svelte';
  import { FontAssets } from '$lib/assets/FontAssets';
  import Button from '$lib/components/Button.svelte';
  import { AudioManager } from '$lib/systems/AudioManager';

  let goToNextScene: Writable<string | null>;
  let topbarHeight = 0;
  
  $: stageId = $page.params.stageId as string;
  $: stageData = StaticDataStore.getStageById(stageId);
  $: levelData = StaticDataStore.getLevelsByStageId(stageId);
  
  $: playerData = $playerStore;
  $: levels = $levelData || [];
  
  function goToCharacterPage() {
    goToNextScene.set(`/character?stageId=${stageId}`);
  }

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function formatNumber(num: number): string {
    return num.toLocaleString();
  }

  function goBack() {
    goToNextScene.set('/stage');
  }

  async function playLevel(levelId: string, endless: boolean = false) {
    AudioManager.play("sfx_confirm");
    const level = levels.find(l => l.levelId === levelId);
    if (!level) return;
    
    const levelName = $t(level.nameKey);
    let confirmed = false;
    
    const result = await PopupStore.open({
      title: $t("confirmStartLevel"),
      content: `${$t("aboutToStartLevel")} "${levelName}"`,
      buttons: [
        {
          text: $t("cancel"),
          onClick: () => PopupResult.Close
        },
        {
          text: $t("startLevel"),
          onClick: () => {
            confirmed = true;
            return PopupResult.Close;
          }
        }
      ]
    });

    if (!confirmed) {
      return; // User cancelled
    }
    
    // Store selected level in player data for gameplay
    playerStore.update(currentData => {
      currentData.selectedStage = stageId;
      return currentData;
    });
    
    // Navigate to gameplay with level info
    if (endless) {
      goToNextScene.set('/gameplay?mode=endless');
    } else {
      goToNextScene.set(`/gameplay?mode=level&levelId=${levelId}`);
    }
  }

  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/stage";
  }
</script>

<Page mainProgress={main} 
  contentStyle={`box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 2rem; position: relative; margin-top: ${topbarHeight}px;`}>
  <!-- Layered background effects for page wrapper -->
  <div slot="outside" class="pageBackground" style="background-image: url({imageAssets[stageBackgroundImageKey(stageId)]});">
    <Topbar
      primaryTitle={$stageData?.nameKey ? $t($stageData.nameKey) : stageId} 
      secondaryTitle=''
      onHeightChange={(height) => topbarHeight = height}
      onBack={goBack} />
  </div>

  <div class="pageContent">
    <div class="stageActions">
      <Button 
        label={$t('changeCharacter')} 
        onClick={() => goToCharacterPage()}
        className="changeCharacterButton" />
    </div>
    <div class="levelsGrid">
      {#each levels as level}
        {@const record = playerData.stageRecords[level.levelId] || null}
        {@const isCompleted = record?.completed ?? false}
        {@const isLocked = !level.unlocked}
        {@const levelName = $t(level.nameKey)}

        <div class="levelCard" class:completed={isCompleted} class:locked={isLocked}>
          <div class="levelBorder">
            <SpaceBetweenTextGroup 
              content={levelName}
              spacing="1em"
              className="levelBorderText"/>
          </div>
          <div class="levelContent">
            <div class="characterAvatar">
              <div class="characterPortrait" style="background-image: url({imageAssets[characterPortraitImageKey($playerStore.selectedCharacter)]});"></div>
            </div>
            <div class="levelHeader">
              <div class="levelTitle">
                <h3 style={FontAssets.getCssStyle("titleBold")}>{levelName}</h3>
                {#if level.endless}
                  <span class="endlessBadge">{$t('endlessMode')}</span>
                {:else if level.completionType === 'collectCoins'}
                  <span class="objectiveBadge">{$t('collectCoins')}</span>
                {:else if level.completionType === 'defeatEnemies'}
                  <span class="objectiveBadge">{$t('defeatEnemies')}</span>
                {:else if level.completionType === 'reachScore'}
                  <span class="objectiveBadge">{$t('reachScore')}</span>
                {:else}
                  <span class="levelBadge">{$t('levelMode')}</span>
                {/if}
                <span class="speedBadge">{level.initialSpeed}x</span>
              </div>
              
              {#if isCompleted}
                <Trophy class="completedIcon" />
              {:else if isLocked}
                <Lock class="lockedIcon" />
              {/if}
            </div>

            <!-- Level objective display -->
            {#if !level.endless && level.completionType !== 'reachGoal'}
              <div class="objectiveSection">
                <div class="objective">
                  {#if level.completionType === 'collectCoins'}
                    <Coins size={16} />
                    <span class="objectiveText">{$t('collectCoins')}: {level.targetValue}</span>
                  {:else if level.completionType === 'defeatEnemies'}
                    <SwordIcon size={16} />
                    <span class="objectiveText">{$t('defeatEnemies')}: {level.targetValue}</span>
                  {:else if level.completionType === 'reachScore'}
                    <Target size={16} />
                    <span class="objectiveText">{$t('reachScore')}: {formatNumber(level.targetValue)}</span>
                  {/if}
                </div>
                {#if level.timeLimit > 0}
                  <div class="timeLimit">
                    <Timer size={16} />
                    <span class="timeLimitText">{$t('timeRemaining')}: {formatTime(level.timeLimit)}</span>
                  </div>
                {/if}
              </div>
            {/if}

            {#if record && (isCompleted || level.endless)}
              <div class="recordsSection">
                <div class="records">
                  <div class="record">
                    <Clock size={16} />
                    <span class="recordLabel">{$t('bestTime')}:</span>
                    <span class="recordValue">{formatTime(record.bestTime)}</span>
                  </div>
                  <div class="record">
                    <Target size={16} />
                    <span class="recordLabel">{$t('bestScore')}:</span>
                    <span class="recordValue">{formatNumber(record.bestScore)}</span>
                  </div>
                  <div class="record">
                    <Zap size={16} />
                    <span class="recordLabel">{$t('bestSpeed')}:</span>
                    <span class="recordValue">{record.bestSpeed.toFixed(1)}x</span>
                  </div>
                </div>
              </div>
            {:else if !isLocked}
              <div class="notCompleted">
                <span>{level.endless ? $t('notPlayed') : $t('notCompleted')}</span>
              </div>
            {/if}

            <div class="levelActions">
              {#if !isLocked}
                <Button onClick={() => playLevel(level.levelId, level.endless)}>
                  <Play size={16} style="margin-bottom: -2px;" />
                  {$t('play')}
                </Button>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</Page>

<style>
  .pageContent {
    width: 100%;
    max-width: 1000px;
  }

  .levelsGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .levelCard {
    --border-size: 2px;
    backdrop-filter: blur(3px);
    color: black;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
    position: relative;
    overflow: hidden;
  }

  .levelContent {
    width: 100%;
    height: 100%;
    border: var(--border-size) solid rgba(148, 163, 184, 0.3);
    padding: calc(1.5rem + 12px) 1.5rem 1.5rem 1.5rem;
  }

  .levelCard::after {
    content: "";
    position: absolute;
    top: -60%;
    left: -60%;
    width: 220%;
    height: 220%;
    pointer-events: none;
    background: linear-gradient(120deg, rgba(255,255,255,0.0) 40%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.0) 60%);
    transform: rotate(0deg);
    animation: levelCardShine 5s linear infinite;
    z-index: 2;
  }

  @keyframes levelCardShine {
    0% {
      transform: translate(-60%, -60%) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    50% {
      transform: translate(60%, 60%) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translate(120%, 120%) rotate(0deg);
      opacity: 0;
    }
  }

  .levelBorder {
    position: absolute;
    top: calc(-1 * var(--border-size));
    left: calc(-1 * var(--border-size));
    width: calc(100% + 2 * var(--border-size));
    background: black;
    color: white;
    overflow: hidden;
    box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.5);
    z-index: 3;
  }

  .levelBorder :global(.levelBorderText) {
    font-weight: bold;
    font-size: 1.1rem;
    transform: translateX(0);
    text-align: center;
    animation: marquee 10s linear infinite;
  }

  @keyframes marquee {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(-100%);
    }
  }

  .levelCard:hover, .levelCard:has(:global(.navFocused)) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(59, 130, 246, 0.2);
  }

  .levelCard:hover .levelContent, .levelCard:has(:global(.navFocused)) .levelContent {
    border-color: rgba(59, 130, 246, 0.5);
  }

  .levelCard.completed .levelContent {
    border-color: rgba(34, 197, 94, 0.5);
  }

  .levelCard.locked {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .levelHeader {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .levelTitle h3 {
    position: relative;
    margin: 0;
    top: 0;
    left: -1.6rem;
    font-size: 2rem;
    font-weight: bold;
    border-left: 8px solid #0021ff;
    padding-left: 1rem;
    color: #0021ff;
  }

  .levelBadge {
    background: linear-gradient(135deg, #5c88f6, #5560f7);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: bold;
    margin-top: 0.25rem;
    display: inline-block;
  }

  .endlessBadge {
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: bold;
    margin-top: 0.25rem;
    display: inline-block;
  }

  .objectiveBadge {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: bold;
    margin-top: 0.25rem;
    display: inline-block;
  }

  .speedBadge {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: bold;
    margin-top: 0.25rem;
    margin-left: 0.5rem;
    display: inline-block;
  }

  .objectiveSection {
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid #f59e0b;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 1rem;
  }

  .objective {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .objectiveText {
    font-weight: bold;
    color: #d97706;
  }

  .timeLimit {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .timeLimitText {
    font-weight: bold;
    color: #dc2626;
  }

  .recordsSection {
    position: relative;
    left: 0;
    top: 0;
    padding: 0.5rem;
    margin-bottom: 1rem;
  }

  .records {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transform: scaleY(0.8);
  }

  .record {
    position: relative;
    display: flex;
    align-items: center;
    font-size: 1.2rem;
    background: #ddff00;
    color: black;
    gap: 0.2rem;
    padding: 0.1rem 0.1rem 0.1rem 1rem;
    font-style: bold;
  }

  .record::before {
    content: "";
    position: absolute;
    top: 0;
    width: 20%;
    height: 100%;
    border-top: 2px solid black;
  }

  .recordLabel {
    color: black;
    padding-bottom: 3px;
  }

  .recordValue {
    color: black;
    font-weight: bold;
  }

  .notCompleted {
    margin-bottom: 1rem;
    color: white;
    font-style: bold;
    font-size: 1.8rem;
    text-align: center;
    padding: 0.4rem;
    background: black;
    transform: scaleY(0.8);
  }

  .levelActions {
    display: flex;
    justify-content: center;
  }

  :global(.completedIcon) {
    color: #0021ff;
    padding-top: 0.5rem;
    width: 2.5rem;
    height: 2.5rem;
  }

  :global(.lockedIcon) {
    color: #6b7280;
    width: 2rem;
    height: 2rem;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .levelsGrid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  .pageBackground {
    position: absolute;
    inset: 0;
    width: 100vw;
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

  .stageActions {
    all: unset;
    width: calc(100% - 16px);
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .stageActions :global(.changeCharacterButton) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    backdrop-filter: blur(5px);
    text-wrap: nowrap;
  }

  .stageActions :global(.changeCharacterButton.navFocused),
  .stageActions :global(.changeCharacterButton:hover),
  .stageActions :global(.changeCharacterButton:active) {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .characterAvatar {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .characterPortrait {
    position: absolute;
    top: 0;
    right: -40%;
    width: 140%;
    height: 200%;
    background-position: 50% 0%;
    background-size: cover;
    background-repeat: no-repeat;
    z-index: -1;
  }

  .characterPortrait::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.5);
  }
</style>