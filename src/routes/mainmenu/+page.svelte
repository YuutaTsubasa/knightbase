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

  {#if $isPortrait}
    <!-- Portrait layout: responsive grid design -->
    <div class="mainMenuLayout portrait">
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

      <div class="bannerSection">
        <BannerCarousel banners={[
          { key: 'banner01' },
          { key: 'banner02' }
        ]} />
      </div>

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
  {:else}
    <!-- Landscape layout: original absolute positioning -->
    <div class="mainMenuLayout landscape">
      <!-- Top-left: PlayerInfoBox -->
      <PlayerInfoBox level={playerLevel} expPercent={playerExperience} name={playerName} title={$t(playerTitle)} />
      
      <!-- Top-right: ResourceBar -->
      <div class="rightTopSection">
        <ResourceBar
          resources={[
            { key: "coin", amount: "33645678" },
            { key: "diamond", amount: "25000", onAdd: () => console.log("add ticket") },
            { key: "gem", amount: "124680", onAdd: () => console.log("add gem") },
          ]}
        />
      </div>
      
      <!-- Bottom-left: BannerCarousel -->
      <BannerCarousel banners={[
        { key: 'banner01' },
        { key: 'banner02' }
      ]} />

      <!-- Bottom-right: MainMenuButtonGroup -->
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
  {/if}
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
  }

  /* Portrait layout: responsive grid design */
  .mainMenuLayout.portrait {
    display: grid;
    grid-template-areas: 
      "top"
      "banner"
      "buttons";
    grid-template-rows: auto auto 1fr;
    padding: 1rem;
    gap: 1rem;
  }

  .portrait .topSection {
    grid-area: top;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .portrait .playerInfoContainer {
    width: 95%;
    max-width: 95%;
  }

  .portrait .playerInfoContainer :global(.playerInfoBox) {
    position: static; /* Override absolute positioning */
    font-size: 0.9rem; /* Smaller font for narrow screens */
  }

  .portrait .resourceContainer {
    width: 100%;
  }

  .portrait .resourceContainer :global(.resourceBar) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }

  .portrait .bannerSection {
    grid-area: banner;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
  }

  .portrait .buttonSection {
    grid-area: buttons;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 95%;
    margin: 0 auto;
  }

  .portrait .bannerSection :global(.banner-box) {
    position: static; /* Override absolute positioning */
  }

  .portrait .buttonSection :global(.mainMenuButtonArea) {
    position: static; /* Override absolute positioning */
    width: 100%;
    transform: none; /* Remove 3D perspective in portrait */
  }

  /* Landscape layout: restore original absolute positioning */
  .mainMenuLayout.landscape {
    /* Components use their original absolute positioning */
  }

  .rightTopSection {
    position: absolute;
    top: 0.9rem;
    right: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>