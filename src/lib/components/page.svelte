<script lang="ts">
  import { FadeTransitionComponent } from '$lib/animations/transitions/FadeTransitionComponent';
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { AudioManager } from '$lib/systems/AudioManager';
    import { FontAssets } from '$lib/assets/FontAssets';
  
  export let wrapperClass = '';
  export let contentClass = '';
  export let mainProgress: () => Promise<string>;

  let stopAudio: (() => void) | null;
  let pageElement: HTMLElement;
  onMount(async () => {
    const currentPath = $page.url.pathname;
    const playBgmPromise = AudioManager.play(`bgm_${currentPath.substring(1)}`);

    const transition = new FadeTransitionComponent(pageElement);
    await transition.enter();
    stopAudio = await playBgmPromise;
    
    const nextPath = await mainProgress();
    
    await transition.leave();
    stopAudio?.();
    goto(nextPath);
  });

  onDestroy(() => {
    stopAudio?.();
  });
</script>

<div bind:this={pageElement} class="page {wrapperClass}" style={FontAssets.getCssStyle("englishNumberDefault", "default")}>
  <slot name="outside" />
  <div class="safeArea {contentClass}">
    <slot />
  </div>
</div>

<style>
  .page {
    position: absolute;
    top: 0;
    left: 0;

    width: 100vw;
    min-height: 100vh;

    background: var(--background, #1e293b);
  }

  .safeArea {
    position: relative;
    z-index: 1;

    box-sizing: border-box;
    width: 100%;
    min-height: 100%;
    padding: env(safe-area-inset-top, 1rem)
              env(safe-area-inset-right, 1rem)
              env(safe-area-inset-bottom, 1rem)
              env(safe-area-inset-left, 1rem);
  }

  ::slotted([slot="outside"]) {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
  }
</style>