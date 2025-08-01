<script lang="ts">
  import { FadeTransitionComponent } from '$lib/animations/transitions/FadeTransitionComponent';
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { AudioManager } from '$lib/systems/AudioManager';
  import { FontAssets } from '$lib/assets/FontAssets';
  import { BACK_PATH } from '$lib/utils/Constant';
  import { LocalizationAssets } from '$lib/assets/LocalizationAssets';
  
  export let wrapperClass = '';
  export let wrapperStyle = '';
  export let contentClass = '';
  export let contentStyle = '';
  export let mainProgress: () => Promise<string>;

  let pageElement: HTMLElement;
  onMount(async () => {
    const currentPath = page.url.pathname;
    const transition = new FadeTransitionComponent(pageElement);
    
    AudioManager.initialize();
    LocalizationAssets.initialize();
    
    const playBgmPromise = AudioManager.play(`bgm_${currentPath.substring(1)}`);
    await transition.enter();
    const nextPath = await mainProgress();
    await transition.leave();
    
    playBgmPromise.then(stopFn => stopFn?.()).catch(() => {});
    
    if (nextPath === BACK_PATH){
      history.back();
      return;
    }
    goto(nextPath);
  });
</script>

<div bind:this={pageElement} class="page {wrapperClass}" style={`${FontAssets.getCssStyle("englishNumberDefault", "default")} ${wrapperStyle}`}>
  <slot name="outside" />
  <div class="safeArea {contentClass}" 
       style={contentStyle}>
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
    overflow: hidden;

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