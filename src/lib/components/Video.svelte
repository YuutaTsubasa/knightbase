<script lang="ts">
  import { onMount } from "svelte";
  import { VideoManager } from "$lib/systems/VideoManager";

  export let key: string;
  let container: HTMLDivElement;
  onMount(() => {
    const video = VideoManager.get(key);
    if (video && container) {
      container.innerHTML = ""; // 清空
      container.appendChild(video);
      video.play();
    }
  });
</script>

<div bind:this={container} class="video-element-container">
</div>