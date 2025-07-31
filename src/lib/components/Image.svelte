<script lang="ts">
  import { imageAssets } from "$lib/assets/ImageAssets";

  export let key: keyof typeof imageAssets;
  export let alt = '';
  export let className = '';
  export let size: 'icon' | 'banner' | 'inherit' | 'auto' = 'auto';

  let loading = true;
  let error = false;

  // Check if this is a background image that should have white placeholder
  $: isBackgroundImage = key === 'backgroundWhite' || key === 'backgroundWhiteButton';

  function handleLoad() {
    loading = false;
  }

  function handleError() {
    loading = false;
    error = true;
  }

  // Get size styles based on size prop
  function getSizeStyle(size: string): string {
    switch (size) {
      case 'icon':
        return 'width: 1.3rem; height: 1.3rem;';
      case 'banner':
        return 'width: 100%; height: 100%;';
      case 'inherit':
        return 'width: inherit; height: inherit;';
      default:
        return '';
    }
  }
</script>

<div class="image-container {className}" style={getSizeStyle(size)}>
  {#if loading}
    <div class="image-placeholder {isBackgroundImage ? 'white' : 'striped'}" aria-label="Loading image..."></div>
  {/if}
  <img 
    src={imageAssets[key]} 
    alt={alt} 
    class="image {loading ? 'loading' : ''}" 
    style={getSizeStyle(size)}
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
    border-radius: inherit;
    z-index: 1;
  }

  .image-placeholder.striped {
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
  }

  .image-placeholder.white {
    background-color: white;
  }

  .image {
    display: block;
    position: relative;
    z-index: 2;
    object-fit: cover;
  }

  .image.loading {
    opacity: 0;
  }
</style>