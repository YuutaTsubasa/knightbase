<!-- src/routes/MainMenu/+page.svelte -->
<script lang="ts">
  import Page from "$lib/components/Page.svelte";
  import Video from "$lib/components/Video.svelte";
  import { ReactiveProperty } from "$lib/utils/ReactiveProperty";
  import PlayerInfoBox from "$lib/components/mainmenu/PlayerInfoBox.svelte";
  import ResourceBar from "$lib/components/mainmenu/ResourceBar.svelte";
  import SettingButton from "$lib/components/mainmenu/SettingButton.svelte";
  import BannerCarousel from "$lib/components/mainmenu/BannerCarousel.svelte";
  import BattleButton from "$lib/components/mainmenu/BattleButton.svelte";

  const goToNextScene = new ReactiveProperty(false);
  async function main() {
    await goToNextScene.waitUntil(value => value);
    return "/";
  }
</script>

<Page mainProgress={main} wrapperClass="mainMenuPage">
  <div class="videoBackground" slot="outside">
    <Video key="titleBackground" />
  </div>

  <PlayerInfoBox level={5} expPercent={0.4} name="勇者小翼" title="幻想旅人" />
  <div class="rightTopSection">
    <ResourceBar
      resources={[
        { key: "coin", amount: "33645678" },
        { key: "diamond", amount: "25000", onAdd: () => console.log("add ticket") },
        { key: "gem", amount: "124680", onAdd: () => console.log("add gem") },
      ]}
  />
    <SettingButton />
  </div>
  
  <BannerCarousel banners={[
    { key: 'banner01' },
    { key: 'banner02' }
  ]} />

  <BattleButton progressText="目前進度：主線第 3 章 - 地底實驗所" onClick={() => {}} />
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
    right: 0.2rem;

    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>