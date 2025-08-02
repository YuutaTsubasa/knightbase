<script lang="ts">
  import { type PopupData, PopupResult } from '$lib/systems/PopupStore';
  import { PopupStore } from '$lib/systems/PopupStore';
  import { FadeTransitionComponent } from '$lib/animations/transitions/FadeTransitionComponent';
  import { onMount } from 'svelte';
  import Button from '../Button.svelte';
  import { FontAssets } from '$lib/assets/FontAssets';
  import { imageAssets } from '$lib/assets/ImageAssets';
  import { ScaleHeightTransitionComponent } from '$lib/animations/transitions/ScaleHeightTransitionComponent';

  export let popup: PopupData;

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
    PopupStore.close(popup.id);
  }

  async function handleClick(index: number) {
    const button = popup.buttons[index];
    if (button.onClick) {
      const clickedResult = button.onClick();
      if (clickedResult === PopupResult.Keep)
        return;
    }
    
    await handleClose();
    popup.resolve(index);
  }
</script>

<div bind:this={rootElement} class="popupBackdrop">
  <div class="popupBackground" style="background-image: url({imageAssets["backgroundWhite"]}); background-color: white;">
    <div class="popupBox" bind:this={boxElement}>
      <div class="popupTitle" style={FontAssets.getCssStyle("titleBold")}>{popup.title}</div>
      <div class="popupContent" style={FontAssets.getCssStyle("default")}>{popup.content}</div>
      <div class="popupButtons">
        {#each popup.buttons as { text, variant }, i}
          <Button
            variant={variant}
            onClick={() => handleClick(i)}
          >
            {text}
          </Button>
        {/each}
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
    text-align: left;
  }

  .popupButtons {
    padding: 1rem;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
</style>