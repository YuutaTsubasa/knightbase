<script lang="ts">
  import { ListIcon, SettingsIcon, ShoppingCartIcon, SwordIcon } from "lucide-svelte";
  import { t } from "$lib/assets/LocalizationAssets";

  export let progressText = "";
  export let onBattle = () => {};
  export let onMission = () => {};
  export let onShop = () => {};
  export let onSettings = () => {};

  $: marqueeText = Array(16).fill(progressText).join("　") + "　";
</script>

<div class="mainMenuButtonArea">
  <button class="battleButton" on:click={onBattle}>
    <div class="label"><SwordIcon size="6vh" class="icon" /> {$t("battle")}</div>
    <div class="marquee">
        <div class="marqueeInner">
        {marqueeText}
        </div>
    </div>
  </button>

  <div class="bottomButtons">
    <button class="smallButton" on:click={onMission}><ListIcon size="2.8vh" class="icon"/> {$t("mission")}</button>
    <button class="smallButton" on:click={onShop}><ShoppingCartIcon size="2.8vh" class="icon" /> {$t("shop")}</button>
  </div>

  <div class="bottomButtons">
    <button class="smallButton" on:click={onSettings}><SettingsIcon size="2.8vh" class="icon"/> {$t("settings")}</button>
  </div>
</div>

<style>
  .mainMenuButtonArea {
    transform: perspective(800px) rotateY(-25deg);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    font-size: 5vh;
  }

  .battleButton {
    all: unset;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    color: white;
    border-radius: 0.75rem;
    border: 1px solid white;
    box-shadow: 0 0.4rem 1rem rgba(0, 0, 0, 0.8);
    box-sizing: border-box;
    padding: 1rem 1.5rem;
    width: 100%;
    transition: transform 0.2s ease;
    cursor: pointer;
    height: 23vh;
  }

  .battleButton:hover {
    transform: translateY(-2px);
    background-color: yellow;
    color: black;
    box-shadow: 0 0.6rem 1.5rem rgba(0, 0, 0, 1);
  }
  
  .label {
    font-size: 1em;
    font-weight: bold;
    text-align: left;
    margin-bottom: 0.5em;
  }

  .marquee {
    overflow: hidden;
    height: 1.2em;
    position: relative;
  }

  .marqueeInner {
    display: inline-block;
    white-space: nowrap;
    animation: scrollLeft 8s linear infinite;
    font-size: 0.6em;
    opacity: 0.4;
    min-width: 200%;
  }

  @keyframes scrollLeft {
    0% { transform: translateX(0); }
    100% { transform: translateX(-25%); }
  }

  .bottomButtons {
    display: flex;
    justify-content: space-between;
    width: 100%;
    gap: 10px;
  }

  .smallButton {
    flex: 1;
    font-size: 0.5em;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    color: white;
    font-weight: bold;
    border: 1px solid white;
    border-radius: 0.5rem;
    box-sizing: border-box;
    box-shadow: 0 0.2rem 0.5rem rgba(0, 0, 0, 0.7);
    transition: transform 0.1s ease;
    cursor: pointer;
    text-align: left;
    height: 6vh;
  }

  .smallButton:hover {
    transform: translateY(-2px);
    background: yellow;
    color: black;
  }
</style>