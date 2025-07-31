<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Image from '../Image.svelte';
  
  export let banners: { key: string; link?: string }[] = [];
  const bannerSize = 30;

  let activeIndex = 0;
  let container: HTMLDivElement;

  let startX = 0;
  let currentTranslate = 0;
  let dragging = false;
  let intervalId: any;

  function onPointerDown(e: PointerEvent) {
    startX = e.clientX;
    dragging = true;
    container.style.transition = 'none';
    clearInterval(intervalId); // 暫停輪播
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    const delta = e.clientX - startX;
    container.style.transform = `translateX(calc(${currentTranslate}vw + ${delta}px))`;
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    const delta = e.clientX - startX;

    if (delta > bannerSize && activeIndex > 0) {
      activeIndex--;
    } else if (delta < -bannerSize && activeIndex < banners.length - 1) {
      activeIndex++;
    }

    updateTranslate();
    // 恢復輪播
    intervalId = setInterval(() => {
      activeIndex = (activeIndex + 1) % banners.length;
      updateTranslate();
    }, 5000);
  }

  function updateTranslate() {
    currentTranslate = -activeIndex * bannerSize;
    container.style.transition = 'transform 0.3s ease';
    container.style.transform = `translateX(${currentTranslate}vw)`;
  }

  function goTo(index: number) {
    activeIndex = index;
    updateTranslate();
  }

  onMount(() => {
    updateTranslate();
    intervalId = setInterval(() => {
      activeIndex = (activeIndex + 1) % banners.length;
      updateTranslate();
    }, 5000); // 每 5 秒自動切換
  });

  onDestroy(() => {
    clearInterval(intervalId);
  });
</script>

<div
  class="banner-box"
  style="width: {bannerSize}vw"
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:pointerleave={onPointerUp}
>
  <div
    class="carousel"
    bind:this={container}
    style="width: {banners.length * bannerSize}vw"
  >
    {#each banners as { key, link }}
      <div class="banner" style="width: {bannerSize}vw">
        {#if link}
          <a href={link} target="_blank">
            <Image key={key} alt="banner" className="bannerImage" size="inherit"/>
          </a>
        {:else}
          <Image key={key} alt="banner" className="bannerImage" size="inherit"/>
        {/if}
      </div>
    {/each}
  </div>

  <div class="dots">
    {#each banners as _, i}
      <button
        class="dot {i === activeIndex ? 'active' : ''}"
        aria-label={`goToPage${i}`}
        on:click={() => goTo(i)}>
      </button>
    {/each}
  </div>
</div>

<style>
  .banner-box {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    overflow: hidden;
  }

  .carousel {
    display: flex;
  }

  .banner {
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .banner :global(.bannerImage) {
    width: calc(100% - 6px);
    height: calc(100% - 6px);
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.4);
    border-radius: 0.5rem;
    pointer-events: none;
    user-select: none;
  }

  .dots {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem 0.5rem;
  }

  .dot {
    width: 10px;
    height: 10px;
    padding: 0;
    border-radius: 50%;
    background: white;
    opacity: 0.4;
    cursor: pointer;
  }

  .dot.active {
    opacity: 1;
    background: #0022ff;
  }
</style>
