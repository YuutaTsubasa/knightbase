<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/systems/LocalizationStore";
  import { MissionStore, type MissionType } from "$lib/systems/MissionStore";
  import Image from "$lib/components/Image.svelte";
  import Page from "$lib/components/Page.svelte";
  import Button from "$lib/components/Button.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import RewardIcon from "$lib/components/RewardIcon.svelte";
  import { BACK_PATH } from "$lib/utils/Constant";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { Calendar, CalendarDays, Trophy, Gift, User, GamepadIcon, Zap, Swords } from "lucide-svelte";
  import { PopupStore, PopupResult } from "$lib/systems/PopupStore";

  $: topbarHeight = 0;
  let activeMissionType: MissionType = 'daily';

  // Mission data from MissionStore - make reactive
  const dailyMissions = MissionStore.getMissionsByType('daily');
  const weeklyMissions = MissionStore.getMissionsByType('weekly');
  const achievementMissions = MissionStore.getMissionsByType('achievement');

  let goToNextScene: Writable<string | null>;
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/mainmenu";
  }

  function setActiveMissionType(type: MissionType) {
    activeMissionType = type;
  }

  function claimReward(missionId: number) {
    const success = MissionStore.claimMissionReward(missionId, activeMissionType);
    if (success) {
      // Find the mission to show its rewards in popup
      const mission = activeMissions.find(m => m.id === missionId);
      if (mission) {
        showRewardPopup(mission.rewards);
      }
      console.log(`Successfully claimed reward for mission ${missionId}`);
    } else {
      console.log(`Failed to claim reward for mission ${missionId} - already claimed or not completed`);
    }
  }

  function claimAllRewards() {
    const claimedMissions = activeMissions.filter(m => m.completed && !m.claimed);
    const claimedCount = MissionStore.claimAllRewards(activeMissionType);
    if (claimedCount > 0) {
      // Collect all rewards from claimed missions
      const allRewards: { type: string; amount: number }[] = [];
      claimedMissions.slice(0, claimedCount).forEach(mission => {
        mission.rewards.forEach(reward => {
          const existing = allRewards.find(r => r.type === reward.type);
          if (existing) {
            existing.amount += reward.amount;
          } else {
            allRewards.push({ ...reward });
          }
        });
      });
      showRewardPopup(allRewards);
    }
    console.log(`Successfully claimed ${claimedCount} mission rewards`);
  }

  function showRewardPopup(rewards: { type: string; amount: number }[]) {
    // Create reward elements dynamically using proper Svelte components
    const rewardElements = rewards.map(reward => {
      const color = getRewardColor(reward.type);
      
      // Create a temporary container for rendering the Svelte component
      const tempDiv = document.createElement('div');
      tempDiv.style.display = 'inline-block';
      
      // Create the reward icon component
      const iconComponent = new RewardIcon({
        target: tempDiv,
        props: {
          rewardType: reward.type,
          size: 24,
          color: color
        }
      });
      
      const iconHTML = tempDiv.innerHTML;
      
      // Clean up the component
      iconComponent.$destroy();
      
      return `
        <div style="display: flex; align-items: center; gap: 0.75rem; margin: 0.5rem 0; padding: 0.5rem; background: rgba(0, 0, 0, 0.05); border-radius: 0.5rem;">
          <div style="color: ${color}; display: flex; align-items: center;">
            ${iconHTML}
          </div>
          <span style="color: ${color}; font-weight: bold; font-size: 1.1rem; min-width: 4rem;">+${reward.amount}</span>
          <span style="color: #374151; font-size: 1rem;">${getRewardTypeName(reward.type)}</span>
        </div>
      `;
    }).join('');

    const content = `
      <div style="text-align: center; padding: 1rem;">
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${rewardElements}
          </div>
        </div>
      </div>
    `;

    PopupStore.open({
      title: $t('rewards'),
      content,
      buttons: [
        {
          text: $t('confirm'),
          onClick: () => PopupResult.Close
        }
      ]
    });
  }

  function getRewardTypeName(type: string): string {
    switch (type) {
      case 'gold': return 'Gold';
      case 'exp': return 'EXP';
      case 'diamond': return 'Diamond';
      case 'ruby': return 'Ruby';
      default: return 'Reward';
    }
  }

  function getRewardColor(type: string) {
    switch (type) {
      case 'gold': return '#fbbf24';
      case 'exp': return '#f59e0b';  // Orange/amber for experience
      case 'diamond': return '#3b82f6';
      case 'ruby': return '#ef4444';
      default: return '#64748b';
    }
  }

  function getMissionTypeIcon(type: string) {
    switch (type) {
      case 'daily': return Calendar;
      case 'weekly': return CalendarDays;
      case 'achievement': return Trophy;
      default: return Calendar;
    }
  }

  function getMissionIcon(iconKey: string) {
    switch (iconKey) {
      case 'loginIcon': return User;
      case 'levelIcon': return GamepadIcon;
      case 'jumpIcon': return Zap;
      case 'attackIcon': return Swords;
      case 'loginStreakIcon': return User;
      default: return GamepadIcon;
    }
  }

  $: activeMissions = activeMissionType === 'daily' ? $dailyMissions : 
                      activeMissionType === 'weekly' ? $weeklyMissions : $achievementMissions;
  $: claimableMissions = activeMissions.filter(m => m.completed && !m.claimed);
  $: hasClaimableMissions = claimableMissions.length > 0;
</script>

<Page mainProgress={main} 
  wrapperStyle="background-image: url({imageAssets["backgroundWhite"]}); background-size: cover; background-position: center; background-color: white;"
  contentStyle="box-sizing: border-box; height: 100vh;">
  <slot name="outside">
    <Topbar 
      primaryTitle={$t('mission')} 
      secondaryTitle={$t('missionPageSubtitle')}
      onHeightChange={(height) => topbarHeight = height}
      onBack={() => goToNextScene.set(BACK_PATH)} />
  </slot>
  
  <div class="missionPage" style={`--topbarHeight: ${topbarHeight}px;`}>
    <div class="missionTabs">
      <button 
        class="missionTab {activeMissionType === 'daily' ? 'active' : ''}"
        on:click={() => setActiveMissionType('daily')}>
        <svelte:component this={Calendar} size={20} />
        <span>{$t('daily')}</span>
      </button>
      <button 
        class="missionTab {activeMissionType === 'weekly' ? 'active' : ''}"
        on:click={() => setActiveMissionType('weekly')}>
        <svelte:component this={CalendarDays} size={20} />
        <span>{$t('weekly')}</span>
      </button>
      <button 
        class="missionTab {activeMissionType === 'achievement' ? 'active' : ''}"
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
        {#if hasClaimableMissions}
          <Button 
            label={$t('claimAll')} 
            onClick={claimAllRewards}
            className="claimAllButton" />
        {/if}
      </div>
      
      <div class="missionList">
        {#each activeMissions as mission (mission.id)}
          <div class="missionItem {mission.claimed ? 'claimed' : mission.completed ? 'claimable' : ''}">
            <div class="missionIcon">
              <svelte:component this={getMissionIcon(mission.iconKey)} size={28} color="white" />
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
                      <RewardIcon 
                        rewardType={reward.type}
                        size={16} 
                        color={getRewardColor(reward.type)} />
                      <span style="color: {getRewardColor(reward.type)}">
                        {reward.amount}
                      </span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
            
            <div class="missionActions">
              {#if mission.claimed}
                <div class="claimedIndicator">
                  {$t('claimed')}
                </div>
              {:else if mission.completed}
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
    flex-direction: column;
    height: 100%;
    padding-top: var(--topbarHeight, 0px);
    box-sizing: border-box;
  }

  .missionTabs {
    display: flex;
    background: rgba(255, 255, 255, 0.9);
    border-bottom: 2px solid #e2e8f0;
    padding: 0 1rem;
  }

  .missionTab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: #64748b;
    transition: all 0.2s ease;
    border-bottom: 3px solid transparent;
  }

  .missionTab:global(.navFocused),
  .missionTab:hover {
    color: #1e293b;
    background: rgba(0, 0, 0, 0.05);
  }

  .missionTab.active {
    color: #1e293b;
    border-bottom-color: #3b82f6;
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
    min-height: 120px; /* Fixed min-height to prevent content compression */
  }

  .missionItem:global(.navFocused),
  .missionItem:hover, .missionItem:active {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .missionItem.claimable {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .missionItem.claimed {
    background: rgba(156, 163, 175, 0.1);
    border: 1px solid rgba(156, 163, 175, 0.3);
  }

  .missionIcon {
    width: 60px;
    height: 60px;
    background: #0021ff; /* Changed background color as requested */
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

  .claimedIndicator {
    padding: 0.5rem 1rem;
    background: #e5e7eb;
    color: #6b7280;
    border-radius: 0.5rem;
    font-size: 0.9rem;
  }
</style>