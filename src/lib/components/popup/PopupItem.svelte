<script lang="ts">
  import { type PopupData, PopupResult } from '$lib/systems/PopupStore';
  import { PopupStore } from '$lib/systems/PopupStore';
  import { FadeTransitionComponent } from '$lib/animations/transitions/FadeTransitionComponent';
  import { onMount } from 'svelte';

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
    const clickedResult = popup.buttons[index].onClick?.();
    if (clickedResult === PopupResult.Keep)
      return;
    
    await handleClose();
    popup.resolve(index);
  }
</script>

<div bind:this={rootElement} class="popupBackdrop">
  <div class="popupBackground">
    <div class="popupBox">
      <div class="popupTitle">{popup.title}</div>
      <div class="popupContent">{popup.content}</div>
      <div class="popupButtons">
        {#each popup.buttons as { text, className }, i}
          <button
            class={`fancyButton ${className}`}
            on:click={() => handleClick(i)}
          >
            {text}
          </button>
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
    background: white;
    width: 100%;
    max-width: 600px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .popupBox {
    display: flex;
    flex-direction: column;
    width: 100%;
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
  }

  .popupButtons {
    padding: 1rem;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
</style>