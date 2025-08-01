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

  <PlayerInfoBox level={playerLevel} expPercent={playerExperience} name={playerName} title={$t(playerTitle)} />
  <div class="rightTopSection">
    <ResourceBar
      resources={[
        { key: "coin", amount: "33645678" },
        { key: "diamond", amount: "25000", onAdd: () => console.log("add ticket") },
        { key: "gem", amount: "124680", onAdd: () => console.log("add gem") },
      ]}
  />
  </div>
  
  <BannerCarousel banners={[
    { key: 'banner01' },
    { key: 'banner02' }
  ]} />

  <MainMenuButtonGroup progressText={format($t("stageProgress"), $t("none"))}
    onBattle={() => { 
      AudioManager.play("sfx_confirm");
      goToNextScene?.set("/battlemenu"); 
    }}
    onSettings={() => { 
      AudioManager.play("sfx_confirm");
      goToNextScene?.set("/settings"); 
    }} />
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

  .rightTopSection {
    position: absolute;
    top: 0.9rem;
    right: 0.5rem;

    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>