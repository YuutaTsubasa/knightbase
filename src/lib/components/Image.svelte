<script lang="ts">
  import { imageAssets } from "$lib/assets/ImageAssets";

  export let key: keyof typeof imageAssets;
  export let alt = '';
  export let className = '';

  let loading = true;
  let error = false;

  function handleLoad() {
    loading = false;
  }

  function handleError() {
    loading = false;
    error = true;
  }
</script>

<div class="image-container {className}">
  {#if loading}
    <div class="image-placeholder" aria-label="Loading image..."></div>
  {/if}
  <img 
    src={imageAssets[key]} 
    alt={alt} 
    class="image {loading ? 'loading' : ''}" 
    on:load={handleLoad}
    on:error={handleError}
  />
</div>

<style>
  .image-container {
    position: relative;
    display: inline-block;
  }

  .image-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #f8f8f8;
    background-image: 
      linear-gradient(
        135deg,
        transparent 25%, 
        rgba(255,255,255,0.6) 25%, 
        rgba(255,255,255,0.6) 35%, 
        transparent 35%, 
        transparent 65%, 
        rgba(255,255,255,0.6) 65%, 
        rgba(255,255,255,0.6) 75%, 
        transparent 75%
      );
    background-size: 16px 16px;
    border-radius: inherit;
    z-index: 1;
  }

  .image {
    display: block;
    position: relative;
    z-index: 2;
  }

  .image.loading {
    opacity: 0;
  }
</style>