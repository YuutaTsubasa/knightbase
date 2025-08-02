<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/assets/LocalizationAssets";
  import Image from "$lib/components/Image.svelte";
  import Page from "$lib/components/Page.svelte";
  import Button from "$lib/components/Button.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import { BACK_PATH } from "$lib/utils/Constant";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { Calendar, CalendarDays, CalendarCheck2, Trophy, Gift, Coins, Diamond, Gem } from "lucide-svelte";

  $: topbarHeight = 0;
  let activeMissionType: 'daily' | 'weekly' | 'monthly' | 'achievement' = 'daily';

  // Mock mission data
  $: missions = {
    daily: [
      {
        id: 1,
        nameKey: "dailyLogin",
        descriptionKey: "dailyLoginDesc",
        iconKey: "loginIcon",
        rewards: [{ type: "coin", amount: 100 }],
        completed: false,
        progress: { current: 0, max: 1 }
      },
      {
        id: 2,
        nameKey: "winBattles",
        descriptionKey: "winBattlesDesc",
        iconKey: "battleIcon",
        rewards: [{ type: "coin", amount: 200 }, { type: "exp", amount: 50 }],
        completed: false,
        progress: { current: 2, max: 3 }
      },
      {
        id: 3,
        nameKey: "upgradeCharacter",
        descriptionKey: "upgradeCharacterDesc",
        iconKey: "upgradeIcon",
        rewards: [{ type: "diamond", amount: 5 }],
        completed: true,
        progress: { current: 1, max: 1 }
      }
    ],
    weekly: [
      {
        id: 4,
        nameKey: "completeStages",
        descriptionKey: "completeStagesDesc",
        iconKey: "stageIcon",
        rewards: [{ type: "coin", amount: 1000 }, { type: "diamond", amount: 20 }],
        completed: false,
        progress: { current: 8, max: 15 }
      },
      {
        id: 5,
        nameKey: "collectRewards",
        descriptionKey: "collectRewardsDesc",
        iconKey: "rewardIcon",
        rewards: [{ type: "ruby", amount: 3 }],
        completed: false,
        progress: { current: 12, max: 20 }
      }
    ],
    monthly: [
      {
        id: 6,
        nameKey: "loginStreak",
        descriptionKey: "loginStreakDesc",
        iconKey: "streakIcon",
        rewards: [{ type: "diamond", amount: 100 }, { type: "ruby", amount: 10 }],
        completed: false,
        progress: { current: 18, max: 30 }
      }
    ],
    achievement: [
      {
        id: 7,
        nameKey: "firstVictory",
        descriptionKey: "firstVictoryDesc",
        iconKey: "victoryIcon",
        rewards: [{ type: "coin", amount: 500 }],
        completed: true,
        progress: { current: 1, max: 1 }
      },
      {
        id: 8,
        nameKey: "reachLevel50",
        descriptionKey: "reachLevel50Desc",
        iconKey: "levelIcon",
        rewards: [{ type: "diamond", amount: 50 }, { type: "ruby", amount: 5 }],
        completed: false,
        progress: { current: 45, max: 50 }
      }
    ]
  };

  let goToNextScene: Writable<string | null>;
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/mainmenu";
  }

  function setActiveMissionType(type: 'daily' | 'weekly' | 'monthly' | 'achievement') {
    activeMissionType = type;
  }

  function claimReward(missionId: number) {
    const currentMissions = missions[activeMissionType];
    const mission = currentMissions.find(m => m.id === missionId);
    if (mission && mission.completed) {
      console.log(`Claimed reward for mission ${missionId}`);
      // Here you would update the mission state
    }
  }

  function claimAllRewards() {
    const completedMissions = missions[activeMissionType].filter(m => m.completed);
    console.log(`Claiming all rewards for ${completedMissions.length} completed missions`);
    // Here you would claim all completed mission rewards
  }

  function getRewardIcon(type: string) {
    switch (type) {
      case 'coin': return Coins;
      case 'diamond': return Diamond;
      case 'ruby': return Gem;
      default: return Gift;
    }
  }

  function getRewardColor(type: string) {
    switch (type) {
      case 'coin': return '#fbbf24';
      case 'diamond': return '#3b82f6';
      case 'ruby': return '#ef4444';
      default: return '#64748b';
    }
  }

  function getMissionTypeIcon(type: string) {
    switch (type) {
      case 'daily': return Calendar;
      case 'weekly': return CalendarDays;
      case 'monthly': return CalendarCheck2;
      case 'achievement': return Trophy;
      default: return Calendar;
    }
  }

  $: completedMissions = missions[activeMissionType].filter(m => m.completed);
  $: hasCompletedMissions = completedMissions.length > 0;
</script>

<Page mainProgress={main} 
  wrapperStyle="position: relative; background-image: url({imageAssets["backgroundWhite"]}); background-size: cover; background-position: center; background-color: white;"
  contentStyle="box-sizing: border-box; height: 100vh;">
  <slot name="outside">
    <Topbar 
      primaryTitle={$t('mission')} 
      secondaryTitle={$t('missionPageSubtitle')}
      onHeightChange={(height) => topbarHeight = height}
      onBack={() => goToNextScene.set(BACK_PATH)} />
  </slot>
  
  <div class="missionPage" style={`--topbarHeight: ${topbarHeight}px;`}>
    <div class="missionSidebar">
      <button 
        class="missionTypeTab {activeMissionType === 'daily' ? 'active' : ''}"
        on:click={() => setActiveMissionType('daily')}>
        <svelte:component this={Calendar} size={20} />
        <span>{$t('daily')}</span>
      </button>
      <button 
        class="missionTypeTab {activeMissionType === 'weekly' ? 'active' : ''}"
        on:click={() => setActiveMissionType('weekly')}>
        <svelte:component this={CalendarDays} size={20} />
        <span>{$t('weekly')}</span>
      </button>
      <button 
        class="missionTypeTab {activeMissionType === 'monthly' ? 'active' : ''}"
        on:click={() => setActiveMissionType('monthly')}>
        <svelte:component this={CalendarCheck2} size={20} />
        <span>{$t('monthly')}</span>
      </button>
      <button 
        class="missionTypeTab {activeMissionType === 'achievement' ? 'active' : ''}"
        on:click={() => setActiveMissionType('achievement')}>
        <svelte:component this={Trophy} size={20} />
        <span>{$t('achievement')}</span>
      </button>
    </div>
    
    <div class="missionContent">
      <div class="missionHeader">
        <h2 style={FontAssets.getCssStyle("titleBold")}>
          {$t(activeMissionType + 'Missions')}
        </h2>
        {#if hasCompletedMissions}
          <Button 
            label={$t('claimAll')} 
            onClick={claimAllRewards}
            className="claimAllButton" />
        {/if}
      </div>
      
      <div class="missionList">
        {#each missions[activeMissionType] as mission (mission.id)}
          <div class="missionItem {mission.completed ? 'completed' : ''}">
            <div class="missionIcon">
              <Image key={mission.iconKey} alt={$t(mission.nameKey)} className="missionIconImage" />
            </div>
            
            <div class="missionInfo">
              <h3 class="missionName" style={FontAssets.getCssStyle("titleBold")}>
                {$t(mission.nameKey)}
              </h3>
              <p class="missionDescription">
                {$t(mission.descriptionKey)}
              </p>
              
              <div class="missionProgress">
                <div class="progressBar">
                  <div 
                    class="progressFill" 
                    style="width: {(mission.progress.current / mission.progress.max) * 100}%">
                  </div>
                </div>
                <span class="progressText">
                  {mission.progress.current} / {mission.progress.max}
                </span>
              </div>
              
              <div class="missionRewards">
                <span class="rewardsLabel">{$t('rewards')}:</span>
                <div class="rewardsList">
                  {#each mission.rewards as reward}
                    <div class="rewardItem">
                      <svelte:component 
                        this={getRewardIcon(reward.type)} 
                        size={16} 
                        style="color: {getRewardColor(reward.type)}" />
                      <span style="color: {getRewardColor(reward.type)}">
                        {reward.amount}
                      </span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
            
            <div class="missionActions">
              {#if mission.completed}
                <Button 
                  label={$t('claim')} 
                  onClick={() => claimReward(mission.id)}
                  className="claimButton" />
              {:else}
                <div class="inProgressIndicator">
                  {$t('inProgress')}
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</Page>

<style>
  .missionPage {
    display: flex;
    height: 100%;
    padding-top: var(--topbarHeight, 0px);
    box-sizing: border-box;
  }

  .missionSidebar {
    width: 200px;
    background: rgba(255, 255, 255, 0.9);
    border-right: 2px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    padding: 1rem 0;
    flex-shrink: 0;
  }

  .missionTypeTab {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    color: #64748b;
    transition: all 0.2s ease;
    text-align: left;
    border-left: 3px solid transparent;
  }

  .missionTypeTab:hover {
    color: #1e293b;
    background: rgba(0, 0, 0, 0.05);
  }

  .missionTypeTab.active {
    color: #1e293b;
    background: rgba(59, 130, 246, 0.1);
    border-left-color: #3b82f6;
    font-weight: bold;
  }

  .missionContent {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .missionHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.9);
    border-bottom: 1px solid #e2e8f0;
  }

  .missionHeader h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #1e293b;
  }

  .missionHeader :global(.claimAllButton) {
    padding: 0.5rem 1rem;
  }

  .missionList {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .missionItem {
    display: flex;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.2s ease;
    padding: 1rem;
    gap: 1rem;
    align-items: center;
  }

  .missionItem:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .missionItem.completed {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .missionIcon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .missionIcon :global(.missionIconImage) {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }

  .missionInfo {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .missionName {
    margin: 0;
    font-size: 1.1rem;
    color: #1e293b;
  }

  .missionDescription {
    margin: 0;
    color: #64748b;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .missionProgress {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progressBar {
    flex: 1;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
  }

  .progressFill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    transition: width 0.3s ease;
  }

  .progressText {
    font-size: 0.8rem;
    color: #64748b;
    white-space: nowrap;
  }

  .missionRewards {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .rewardsLabel {
    font-size: 0.9rem;
    color: #374151;
    font-weight: 500;
  }

  .rewardsList {
    display: flex;
    gap: 1rem;
  }

  .rewardItem {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .missionActions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .missionActions :global(.claimButton) {
    padding: 0.5rem 1rem;
  }

  .inProgressIndicator {
    padding: 0.5rem 1rem;
    background: #f3f4f6;
    color: #6b7280;
    border-radius: 0.5rem;
    font-size: 0.9rem;
  }
</style>