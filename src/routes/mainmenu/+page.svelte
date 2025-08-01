<!-- src/routes/MainMenu/+page.svelte -->
<script lang="ts">
  import Page from "$lib/components/Page.svelte";
  import Video from "$lib/components/Video.svelte";
  import { waitUntil } from "$lib/utils/Wait";
  import PlayerInfoBox from "$lib/components/mainmenu/PlayerInfoBox.svelte";
  import ResourceBar from "$lib/components/mainmenu/ResourceBar.svelte";
  import BannerCarousel from "$lib/components/mainmenu/BannerCarousel.svelte";
  import MainMenuButtonGroup from "$lib/components/mainmenu/MainMenuButtonGroup.svelte";
  import { playerStore } from "$lib/systems/PlayerStore";
  import { page } from "$app/state";
  import { AudioManager } from "$lib/systems/AudioManager";
  import { t } from "$lib/assets/LocalizationAssets";
  import { get, writable, type Writable } from "svelte/store";
  import { format } from "$lib/utils/StringUtils";
  import { isPortrait } from "../+layout";

  let playerData = $playerStore;

  $: playerName = playerData.name;
  $: playerLevel = playerData.level;
  $: playerTitle = playerData.selectedTitle;
  $: playerExperience = playerData.experience;

  let goToNextScene: Writable<string | null>;
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? page.url.pathname;
  }
</script>

<Page mainProgress={main} wrapperClass="mainMenuPage">
  <div class="videoBackground" slot="outside">
    <Video key="titleBackground" />
  </div>

  <div class="mainMenuLayout" class:portrait={$isPortrait} class:landscape={!$isPortrait}>
    <!-- Top section for portrait, left-top for landscape -->
    <div class="topSection">
      <div class="playerInfoContainer">
        <PlayerInfoBox level={playerLevel} expPercent={playerExperience} name={playerName} title={$t(playerTitle)} />
      </div>
      
      <div class="resourceContainer">
        <ResourceBar
          resources={[
            { key: "coin", amount: "33645678" },
            { key: "diamond", amount: "25000", onAdd: () => console.log("add ticket") },
            { key: "gem", amount: "124680", onAdd: () => console.log("add gem") },
          ]}
        />
      </div>
    </div>

    <!-- Banner section -->
    <div class="bannerSection">
      <BannerCarousel banners={[
        { key: 'banner01' },
        { key: 'banner02' }
      ]} />
    </div>

    <!-- Button section -->
    <div class="buttonSection">
      <MainMenuButtonGroup progressText={format($t("stageProgress"), $t("none"))}
        onBattle={() => { 
          AudioManager.play("sfx_confirm");
          goToNextScene?.set("/battlemenu"); 
        }}
        onSettings={() => { 
          AudioManager.play("sfx_confirm");
          goToNextScene?.set("/settings"); 
        }} />
    </div>
  </div>
</Page>

<style>
  :global(.mainMenuPage) {
    width: 100%;
    height: 100%;
  }

  .videoBackground :global(video) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    object-fit: cover;
    z-index: 0;
  }

  .mainMenuLayout {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    gap: 1rem;
  }

  /* Portrait layout */
  .mainMenuLayout.portrait {
    grid-template-areas: 
      "top top"
      "banner banner"
      "buttons buttons";
    grid-template-rows: auto auto 1fr;
    padding: 1rem;
  }

  .mainMenuLayout.portrait .topSection {
    grid-area: top;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .mainMenuLayout.portrait .playerInfoContainer {
    width: 95%;
    max-width: 95%;
  }

  .mainMenuLayout.portrait .playerInfoContainer :global(.playerInfoBox) {
    font-size: 0.9rem; /* Smaller font for narrow screens */
  }

  .mainMenuLayout.portrait .resourceContainer {
    width: 100%;
  }

  .mainMenuLayout.portrait .resourceContainer :global(.resourceBar) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }

  .mainMenuLayout.portrait .bannerSection {
    grid-area: banner;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
  }

  .mainMenuLayout.portrait .buttonSection {
    grid-area: buttons;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 95%;
    margin: 0 auto;
  }

  .mainMenuLayout.portrait .buttonSection :global(.mainMenuButtonArea) {
    width: 100%;
    transform: none; /* Remove 3D perspective in portrait */
  }

  /* Landscape layout (maintain current design) */
  .mainMenuLayout.landscape {
    grid-template-areas: 
      "top . buttons"
      "banner . buttons";
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto 1fr;
  }

  .mainMenuLayout.landscape .topSection {
    grid-area: top;
    position: absolute;
    top: 1rem;
    left: 0;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 1rem;
  }

  .mainMenuLayout.landscape .playerInfoContainer {
    position: relative;
    left: -0.5rem;
  }

  .mainMenuLayout.landscape .resourceContainer {
    position: absolute;
    top: 0.9rem;
    right: 0.5rem;
  }

  .mainMenuLayout.landscape .bannerSection {
    grid-area: banner;
    position: absolute;
    bottom: 1rem;
    left: 1rem;
  }

  .mainMenuLayout.landscape .buttonSection {
    grid-area: buttons;
    position: absolute;
    right: 4rem;
    bottom: 4rem;
  }
</style>