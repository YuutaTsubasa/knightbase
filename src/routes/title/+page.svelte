<script>
  import Page from "$lib/components/Page.svelte";
  import Image from "$lib/components/Image.svelte";
  import Video from "$lib/components/Video.svelte";
  import { ReactiveProperty } from "$lib/utils/ReactiveProperty";
  import { AudioManager } from "$lib/systems/AudioManager";
  import { t } from "$lib/assets/LocalizationAssets";

  const shouldGoToNextPage = new ReactiveProperty(false);
  async function main() {
    await shouldGoToNextPage.waitUntil(value => value);
    AudioManager.play("sfx_confirm");
    return "/mainmenu";
  }

</script>

<Page mainProgress={main} wrapperClass="titlePage">
  <div class="videoBackground" slot="outside">
    <Video key="titleBackground" />
    <div class="videoMask"></div>
  </div>

  <button class="overlay" on:click={() => shouldGoToNextPage.value = true}>
    <Image className="gameLogo" key="gameLogo" />
    <div class="pressStart slowFlicker">{$t("pressToStart")}</div>
  </button>
</Page>

<style>
  :global(.titlePage) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .videoBackground :global(video) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .videoMask {
    backdrop-filter: blur(4px);
    background: rgba(0, 0, 0, 0.5);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .overlay {
    all: unset;
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
  }

  .overlay :global(.gameLogo) {
    max-height: 40vh;
  }

  .pressStart {
    background: #0007cd;
    color: white;
    width: 80%;
    text-align: center;
    font-weight: bold;
    line-height: 0.9;
    font-size: 1.3rem;
  }
</style>