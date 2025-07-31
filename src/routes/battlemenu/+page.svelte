<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/assets/LocalizationAssets";
  import Image from "$lib/components/Image.svelte";
  import Page from "$lib/components/Page.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import { BACK_PATH } from "$lib/utils/Constant";
    import { format } from "$lib/utils/Format";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
 
  $: character = {
    name: $t("yuutaName"),
    imageKey: "yuutaPortrait"
  };
  $: progressText = $t("none");

  let goToNextScene: Writable<string | null>;
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/mainmenu";
  }
</script>

<Page mainProgress={main} 
  wrapperStyle="position: relative; background-image: url({imageAssets["backgroundWhite"]}); background-size: cover; background-position: center; background-color: white;">
  <slot name="outside">
    <Topbar 
      primaryTitle={$t('battlePageTitle')} 
      secondaryTitle={$t('battlePageSubtitle')}
      onBack={() => goToNextScene.set(BACK_PATH)} />
  </slot>
  <div class="battlemenu">
    <button class="menuButton leftButton" style="background-image: url({imageAssets["characterBackground"]}); background-size: cover; background-position: center center; "
            on:click={() => {}}>
      <div class="bg"><Image key={character.imageKey} alt={character.name} className="portrait fadeinPortrait" /></div>
      <div class="content">
        <div class="title" style={FontAssets.getCssStyle("titleBold")}>{$t('character')}</div>
        <div class="description">{format($t('selectedCharacter'), character.name)}</div>
      </div>
    </button>
    <button class="menuButton rightButton" style="background-image: url({imageAssets["stageBackground"]}); background-size: cover; background-position: center center; "
            on:click={() => {}}>
      <div class="content">
        <div class="title" style={FontAssets.getCssStyle("titleBold")}>{$t('stage')}</div>
        <div class="description">{format($t('stageProgress'), progressText)}</div>
      </div>
    </button>
  </div>
</Page>

<style>
  .battlemenu {
    display: flex;
    gap: 10vw;
    justify-content: center;
    align-items: stretch;
    height: 80vh;
  }
  .menuButton {
    position: relative;
    flex: 1 1 0;
    min-width: 320px;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    border: none;
    border-radius: 2rem;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 0px 0px rgba(0,0,0,0); /* 初始無陰影 */
    padding: 0;
    background: none;
    opacity: 0;
    transform: translateX(40px);
    animation: fadeInButton 0.6s cubic-bezier(.5,1.5,.5,1) 0.2s forwards;
  }
  .menuButton.rightButton {
    animation-delay: 0.35s;
  }
  @keyframes fadeInButton {
    to {
      opacity: 1;
      transform: translateX(0);
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    }
  }
  .bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    opacity: 1;
  }
  .content {
    position: relative;
    background-color: rgba(20, 20, 20, 0.8);
    backdrop-filter: blur(10px);
    z-index: 1;
    width: 100%;
    padding: 2rem 2rem 2rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .bg :global(.portrait) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0px 0px rgba(0,0,0,0)); /* 初始無陰影 */
    opacity: 0;
    transform: translateX(40px);
    animation: fadeInPortrait 0.7s cubic-bezier(.5,1.5,.5,1) 0.25s forwards,
              shadowPopup 0.7s cubic-bezier(.5,1.5,.5,1) 0.55s forwards;
  }
  @keyframes fadeInPortrait {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes shadowPopup {
    to {
      filter: drop-shadow(5px 5px 20px rgba(0,0,0,0.5));
    }
  }
  .title {
    font-size: 3rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: white;
    letter-spacing: 0.05em;
  }
  .description {
    font-size: 1.3rem;
    color: #bbb;
    margin-top: 0.5rem;
    text-align: center;
  }
</style>