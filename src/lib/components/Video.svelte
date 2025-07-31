<script lang="ts">
  import { onMount } from "svelte";
  import { VideoManager } from "$lib/systems/VideoManager";

  export let key: string;
  let container: HTMLDivElement;
  onMount(async () => {
    const video = VideoManager.get(key);
    if (video && container) {
      container.innerHTML = ""; // 清空
      container.appendChild(video);
      
      // Make video playback non-blocking to prevent UI freezing
      try {
        await video.play();
      } catch (error) {
        // Handle video playback errors gracefully without blocking UI
        console.warn(`Video playback failed for ${key}:`, error);
      }
    }
  });
</script>

<div bind:this={container} class="video-element-container">
</div>