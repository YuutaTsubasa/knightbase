<script lang="ts">
  import { FadeTransitionComponent } from '$lib/animations/transitions/FadeTransitionComponent';
  import { ScaleHeightTransitionComponent } from '$lib/animations/transitions/ScaleHeightTransitionComponent';
  import { onMount, createEventDispatcher } from 'svelte';
  import Button from '../Button.svelte';
  import RewardIcon from '../RewardIcon.svelte';
  import { FontAssets } from '$lib/assets/FontAssets';
  import { imageAssets } from '$lib/assets/ImageAssets';
  import { t } from '$lib/systems/LocalizationStore';

  export let rewards: { type: string; amount: number }[] = [];
  export let title: string = '';

  const dispatch = createEventDispatcher();

  let rootElement: HTMLElement;
  let boxElement: HTMLElement;
  let transition: FadeTransitionComponent;
  let boxTransition: ScaleHeightTransitionComponent;

  onMount(async () => {
    transition = new FadeTransitionComponent(rootElement, 200);
    boxTransition = new ScaleHeightTransitionComponent(boxElement, 300);
    await transition.enter();
    await boxTransition.enter();
  });

  async function handleClose() {
    await boxTransition.leave();
    await transition.leave();
    dispatch('close');
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
</script>

<div bind:this={rootElement} class="popupBackdrop">
  <div class="popupBackground" style="background-image: url({imageAssets["backgroundWhite"]}); background-color: white;">
    <div class="popupBox" bind:this={boxElement}>
      <div class="popupTitle" style={FontAssets.getCssStyle("titleBold")}>
        {title || $t('rewards')}
      </div>
      
      <div class="popupContent" style={FontAssets.getCssStyle("default")}>
        <div class="rewardsContainer">
          {#each rewards as reward}
            <div class="rewardItem">
              <div class="rewardIcon" style="color: {getRewardColor(reward.type)};">
                <RewardIcon 
                  rewardType={reward.type}
                  size={24} 
                  color={getRewardColor(reward.type)} />
              </div>
              <span class="rewardAmount" style="color: {getRewardColor(reward.type)};">
                +{reward.amount}
              </span>
              <span class="rewardType">
                {getRewardTypeName(reward.type)}
              </span>
            </div>
          {/each}
        </div>
      </div>

      <div class="popupButtons">
        <Button onClick={handleClose}>
          {$t('confirm')}
        </Button>
      </div>
    </div>
  </div>
</div>

<style>
  .popupBackdrop {
    position: fixed;
    top: 0; 
    left: 0;
    width: 100%; 
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0,0,0,0.6);
    backdrop-filter: blur(10px);
    z-index: 9999;
  }

  .popupBackground {
    width: 100%;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    display: flex;
    justify-content: center;
    align-items: center;
    background-size: cover;
  }

  .popupBox {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 600px;
    overflow: hidden;
  }

  .popupTitle {
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
    padding: 1rem;
    font-family: 'Source Han Serif TC', sans-serif;
  }

  .popupContent {
    padding: 1rem;
    font-weight: bold;
    font-size: 1rem;
    line-height: 1.5;
    text-align: center;
  }

  .popupButtons {
    padding: 1rem;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .rewardsContainer {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .rewardItem {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 0.5rem;
    justify-content: flex-start;
  }

  .rewardIcon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .rewardAmount {
    font-weight: bold;
    font-size: 1.1rem;
    min-width: 4rem;
    text-align: left;
  }

  .rewardType {
    color: #374151;
    font-size: 1rem;
    flex: 1;
    text-align: left;
  }
</style>