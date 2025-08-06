<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { t } from "$lib/systems/LocalizationStore";
  import { StaticDataStore } from "$lib/systems/StaticDataStore";
  import { playerStore, PlayerDataManager } from "$lib/systems/PlayerStore";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { stageBackgroundImageKey } from "$lib/utils/KeyHelper";
  import Page from "$lib/components/Page.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import { wait, waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { onMount } from "svelte";
  import { Play, Trophy, Clock, Target, Lock } from "lucide-svelte";
  import { PopupStore, PopupResult } from "$lib/systems/PopupStore";

  let goToNextScene: Writable<string | null>;
  let topbarHeight = 0;
  
  $: stageId = $page.params.stageId as string;
  $: stageData = StaticDataStore.getStageById(stageId);
  
  // Level definitions for each stage
  const stageLevels: Record<string, any[]> = {
    'stage1': [
      { id: 'stage1_1', nameKey: 'level1Name', difficultyStars: 1 },
      { id: 'stage1_2', nameKey: 'level2Name', difficultyStars: 2 },
      { id: 'stage1_3', nameKey: 'level3Name', difficultyStars: 3 },
      { id: 'stage1_4', nameKey: 'level4Name', difficultyStars: 4 },
      { id: 'stage1_5', nameKey: 'level5Name', difficultyStars: 5 },
      { id: 'stage1_endless', nameKey: 'endlessMode', difficultyStars: 0, endless: true }
    ]
  };

  $: levels = stageLevels[stageId || ''] || [];

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function formatNumber(num: number): string {
    return num.toLocaleString();
  }

  function getLevelRecord(levelId: string) {
    return PlayerDataManager.getStageRecord(levelId);
  }

  function goBack() {
    goToNextScene.set('/stage');
  }

  async function playLevel(levelId: string, endless: boolean = false) {
    // Show confirmation popup
    const levelName = endless ? $t('endlessMode') : $t(levels.find(l => l.id === levelId)?.nameKey || levelId);
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
    PlayerDataManager.update({ 
      selectedStage: stageId,
      // Add a temp field for level selection
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
  contentStyle="box-sizing: border-box; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 2rem; padding-top: var(--topbarHeight, 0px);">
  
  <!-- Layered background effects for page wrapper -->
  <div slot="outside" class="pageBackground" style="background-image: url({imageAssets[stageBackgroundImageKey(stageId)]});">
  </div>
  
  <slot name="outside">
    <Topbar 
      primaryTitle={$stageData?.nameKey ? $t($stageData.nameKey) : stageId} 
      secondaryTitle={$stageData?.descriptionKey ? $t($stageData.descriptionKey) : ''}
      onHeightChange={(height) => topbarHeight = height}
      onBack={goBack} />
  </slot>

  <div class="levelsGrid" style={`--topbarHeight: ${topbarHeight}px;`}>
    {#each levels as level}
      {@const record = getLevelRecord(level.id)}
      {@const isCompleted = record?.completed ?? false}
      {@const isLocked = false} <!-- For now, no levels are locked -->
      
      <div class="levelCard" class:completed={isCompleted} class:locked={isLocked}>
        <div class="levelHeader">
          <div class="levelTitle">
            <h3>{level.nameKey ? $t(level.nameKey) : level.id}</h3>
            {#if level.endless}
              <span class="endlessBadge">{$t('endlessMode')}</span>
            {:else}
              <div class="difficulty">
                {#each Array(level.difficultyStars) as _, i}
                  <span class="star">★</span>
                {/each}
              </div>
            {/if}
          </div>
          
          {#if isCompleted}
            <Trophy size={24} class="completedIcon" />
          {:else if isLocked}
            <Lock size={24} class="lockedIcon" />
          {/if}
        </div>

        {#if record && isCompleted}
          <div class="recordsSection">
            <h4>{$t('records')}</h4>
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
            <button class="playBtn" on:click={() => playLevel(level.id, level.endless)}>
              <Play size={16} />
              {$t('play')}
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</Page>

<style>
  .levelsGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    width: 100%;
    max-width: 1000px;
    padding-top: var(--topbarHeight, 0px);
    margin-top: 1rem;
  }

  .levelCard {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
    backdrop-filter: blur(10px);
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 1rem;
    padding: 1.5rem;
    color: white;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
  }

  .levelCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
  }

  .levelCard.completed {
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
    margin: 0;
    font-size: 1.25rem;
    font-weight: bold;
  }

  .difficulty {
    display: flex;
    gap: 0.125rem;
    margin-top: 0.25rem;
  }

  .star {
    color: #fbbf24;
    font-size: 0.875rem;
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

  .recordsSection {
    margin-bottom: 1rem;
  }

  .recordsSection h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #fbbf24;
  }

  .records {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .record {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .recordLabel {
    color: rgba(255, 255, 255, 0.8);
  }

  .recordValue {
    color: #34d399;
    font-weight: bold;
    margin-left: auto;
  }

  .notCompleted {
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
    text-align: center;
    padding: 1rem;
    border: 1px dashed rgba(255, 255, 255, 0.3);
    border-radius: 0.5rem;
  }

  .levelActions {
    display: flex;
    justify-content: center;
  }

  .playBtn {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border: none;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .playBtn:hover {
    background: linear-gradient(135deg, #2563eb, #1e40af);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  :global(.completedIcon) {
    color: #34d399;
  }

  :global(.lockedIcon) {
    color: #6b7280;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .levelsGrid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .levelCard {
      padding: 1rem;
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
</style>