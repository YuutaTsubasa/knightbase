<script lang="ts">
  import type { ITransitionComponent } from '$lib/animations/transitions/ITransitionComponent';
  import { FadeTransitionComponent } from '$lib/animations/transitions/FadeTransitionComponent';
  
  export let wrapperClass = '';
  export let contentClass = '';

  let pageElement: HTMLElement;
  
  let transition: ITransitionComponent;
  export function enter(): Promise<void> { return transition.enter(); }
  export function leave(): Promise<void> { return transition.leave(); }

  $: if (pageElement && !transition) {
    transition = new FadeTransitionComponent(pageElement);
  }

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

    background: var(--background, #f4f4f4);
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