<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { AudioManager } from "$lib/systems/AudioManager";
  export let onBack: () => void;
  export let primaryTitle: string;
  export let secondaryTitle: string;

  let height: number;
</script>

<div>
  <div class="topbar" bind:clientHeight={height}>
    <button class="backButton" on:click={() => {
      AudioManager.play("sfx_confirm");
      onBack?.();
    }}>←</button>
    <h1 class="topbarTitle" style={FontAssets.getCssStyle("englishNumberBold", "titleBold")}>{primaryTitle} <span class="topbarSubtitle">{secondaryTitle}</span></h1>
  </div>
  <div style="width: 100%; height: {height}px;"></div>
</div>

<style>
  .topbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.9) 75%, transparent 100%);
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }

  .backButton {
    background-color: black;
    color: white;
    border: none;
    font-size: 1.5rem;
    padding: 0rem 4rem 0em 0.5rem;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    margin-left: 1rem;
    margin-right: 1rem;
    cursor: pointer;
  }

  .backButton:hover, .backButton:active {
    background-color: white;
    color: black;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .topbarTitle {
    font-size: 2rem;
    color: #1e293b;
  }

  .topbarSubtitle {
    font-size: 1rem;
    margin-left: 0.5rem;
    color: #666;
  }
</style>