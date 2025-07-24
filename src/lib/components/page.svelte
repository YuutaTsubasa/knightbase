<script lang="ts">
  export let className = '';
</script>

<div class="page {className}">
  <slot name="outside" />
  <div class="safe-area">
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

  .safe-area {
    width: 100%;
    padding: env(safe-area-inset-top, 1rem)
              env(safe-area-inset-right, 1rem)
              env(safe-area-inset-bottom, 1rem)
              env(safe-area-inset-left, 1rem);
    box-sizing: border-box;
    position: relative;
    z-index: 1;
  }

  ::slotted([slot="outside"]) {
    position: relative;
    z-index: 0;
  }
</style>