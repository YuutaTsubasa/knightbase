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
  import { isPortrait } from "$lib/systems/Orientation";
  import { CoinsIcon, DiamondIcon, GemIcon } from "lucide-svelte";

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
    <div class="playerInfoContainer">
      <PlayerInfoBox level={playerLevel} expPercent={playerExperience} name={playerName} title={$t(playerTitle)} />
    </div>
    <div class="resourceContainer">
      <ResourceBar
        resources={[
          { key: CoinsIcon, amount: "33645678", color: "gold" },
          { key: DiamondIcon, amount: "25000", color:"lightblue", onAdd: () => console.log("add ticket") },
          { key: GemIcon, amount: "124680", color:"lightpink", onAdd: () => console.log("add gem") },
        ]}
      />
    </div>
    <div class="bannerContainer">
      <BannerCarousel banners={[
        { key: 'banner01' },
        { key: 'banner02' }
      ]} />
    </div>
     <div class="buttonContainer">
      <MainMenuButtonGroup progressText={format($t("stageProgress"), $t("none"))}
        onBattle={() => { 
          AudioManager.play("sfx_confirm");
          goToNextScene?.set("/battlemenu"); 
        }}
        onMission={() => {
          AudioManager.play("sfx_confirm");
          goToNextScene?.set("/mission");
        }}
        onShop={() => {
          AudioManager.play("sfx_confirm");
          goToNextScene?.set("/shop");
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
    height: 100vh;
  }

  .playerInfoContainer {
    position: absolute;
    top: 1rem;
    left: -0.5rem;
    max-width: 95vw;
  }
  
  .resourceContainer {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }

  .portrait .resourceContainer {
    top: 18vh;
    left: 1rem;
  }

  .bannerContainer {
    position: absolute;
    left: 1em;
    bottom: 1em;
  }

  .portrait .bannerContainer {
    left: 1rem;
    top: 33vh;
  }

  .buttonContainer {
    position: absolute;
    bottom: 2vh;
    right: 2vw;
    width: 45vw;
  }
  
  .portrait .buttonContainer {
    bottom: 1rem;
    right: 0;
    width: 100%;
  }
</style>