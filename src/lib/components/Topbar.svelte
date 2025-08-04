<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { AudioManager } from "$lib/systems/AudioManager";
  export let primaryTitle: string;
  export let secondaryTitle: string;
  export let onHeightChange: (height: number) => void;
  export let onBack: () => void;
  
  let height: number;
  let backButton: HTMLButtonElement;
  
  $: onHeightChange?.(height);

  export function getBackButton() {
    return backButton;
  }
</script>

<div class="topbar" bind:clientHeight={height}>
  <button bind:this={backButton} class="backButton" on:click={() => {
    AudioManager.play("sfx_confirm");
    onBack?.();
  }}>←</button>
  <h1 class="topbarTitle" style={FontAssets.getCssStyle("englishNumberBold", "titleBold")}>{primaryTitle} <span class="topbarSubtitle">{secondaryTitle}</span></h1>
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

  /* Only apply hover effects on devices that can actually hover */
  @media (hover: hover) {
    .backButton:hover {
      background-color: white;
      color: black;
      transition: background-color 0.2s ease, color 0.2s ease;
    }
  }

  .backButton:active {
    background-color: white;
    color: black;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  /* Gamepad selection styles */
  :global(.backButton.gamepad-selected) {
    background-color: white;
    color: black;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3);
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