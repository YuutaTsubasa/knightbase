<script lang="ts">
  import { FadeTransitionComponent } from '$lib/animations/transitions/FadeTransitionComponent';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  export let wrapperClass = '';
  export let contentClass = '';
  export let mainProgress: () => Promise<string>;

  let pageElement: HTMLElement;
  onMount(async () => {
    let transition = new FadeTransitionComponent(pageElement);
    await transition.enter();
    let nextPath = await mainProgress();
    await transition.leave();
    goto(nextPath);
  });

</script>

<div bind:this={pageElement} class="page {wrapperClass}">
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
    padding: env(safe-area-inset-top, 1rem)
              env(safe-area-inset-right, 1rem)
              env(safe-area-inset-bottom, 1rem)
              env(safe-area-inset-left, 1rem);
  }

  ::slotted([slot="outside"]) {
    position: relative;
    z-index: 0;
  }
</style>