<script lang="ts">
  import { type PopupData, PopupResult } from '$lib/systems/PopupStore';
  import { PopupStore } from '$lib/systems/PopupStore';
  import { FadeTransitionComponent } from '$lib/animations/transitions/FadeTransitionComponent';
  import { onMount } from 'svelte';
  import Button from '../Button.svelte';
  import { AudioManager } from '$lib/systems/AudioManager';
  import { FontAssets } from '$lib/assets/FontAssets';
  import { imageAssets } from '$lib/assets/ImageAssets';

  export let popup: PopupData;

  let rootElement: HTMLElement;
  let transition: FadeTransitionComponent;

  onMount(() => {
    transition = new FadeTransitionComponent(rootElement);
    transition.enter();
  });

  async function handleClose() {
    await transition.leave();
    PopupStore.close(popup.id);
  }

  async function handleClick(index: number) {
    const button = popup.buttons[index];
    const clickEvent = button.onClickEvent;
    if (clickEvent) {
      AudioManager.play(clickEvent.sfx || "sfx_confirm");
      const clickedResult = clickEvent.handler();
      if (clickedResult === PopupResult.Keep)
        return;
    }
    
    await handleClose();
    popup.resolve(index);
  }
</script>

<div bind:this={rootElement} class="popupBackdrop">
  <div class="popupBackground" style="background: url({imageAssets["backgroundWhite"]});">
    <div class="popupBox">
      <div class="popupTitle" style={FontAssets.getCssStyle("titleBold")}>{popup.title}</div>
      <div class="popupContent" style={FontAssets.getCssStyle("default")}>{popup.content}</div>
      <div class="popupButtons">
        {#each popup.buttons as { text, className }, i}
          <Button
            className={`${className}`}
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
    top: 0; left: 0;
    width: 100vw; height: 100vh;
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
  }

  .popupBox {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 600px;
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