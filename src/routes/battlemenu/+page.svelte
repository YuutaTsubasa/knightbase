<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/assets/LocalizationAssets";
  import Image from "$lib/components/Image.svelte";
  import Page from "$lib/components/Page.svelte";
    import SpaceBetweenTextGroup from "$lib/components/SpaceBetweenTextGroup.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import { BACK_PATH } from "$lib/utils/Constant";
  import { format } from "$lib/utils/StringUtils";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
 
  $: topbarHeight = 0;
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
  wrapperStyle="position: relative; background-image: url({imageAssets["backgroundWhite"]}); background-size: cover; background-position: center; background-color: white;"
  contentStyle="box-sizing: border-box; height: 100vh;">
  <slot name="outside">
    <Topbar 
      primaryTitle={$t('battlePageTitle')} 
      secondaryTitle={$t('battlePageSubtitle')}
      onHeightChange={(height) => topbarHeight = height}
      onBack={() => goToNextScene.set(BACK_PATH)} />
  </slot>
  <div class="battlemenu" style={`--topbarHeight: ${topbarHeight}px;`}>
    <div class="menuButtonContainer">
      <button class="menuButton leftButton" style="background-image: url({imageAssets["characterBackground"]}); background-size: cover; background-position: center center; "
          on:click={() => goToNextScene.set("/character")}>
        <div class="bg"><Image key={character.imageKey} alt={character.name} className="portrait fadeinPortrait" /></div>
        <div class="content">
          <div class="title" style={FontAssets.getCssStyle("titleBold")}>
            <SpaceBetweenTextGroup content={$t('character')} spacing="0.3em" />
          </div>
          <div class="description">{format($t('selectedCharacter'), character.name)}</div>
        </div>
      </button>
    </div>
    <div class="menuButtonContainer">
      <button class="menuButton rightButton" style="background-image: url({imageAssets["stageBackground"]}); background-size: cover; background-position: center center; "
          on:click={() => goToNextScene.set("/stage")}>
        <div class="content">
          <div class="title" style={FontAssets.getCssStyle("titleBold")}>
            <SpaceBetweenTextGroup content={$t('stage')} spacing="0.3em" />
          </div>
          <div class="description">{format($t('stageProgress'), progressText)}</div>
        </div>
      </button>
    </div>
  </div>
</Page>

<style>
  .battlemenu {
    display: grid;
    grid-template-columns: 1fr 1fr;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    height: 100%;
    padding-top: var(--topbarHeight, 0px);
  }
  .menuButtonContainer {
    position: relative;
    box-sizing: border-box;
    padding: 5%;
    height: 95%;
    display: grid;
    grid-template-columns: 100%;
    grid-template-rows: 100%;
    overflow: hidden; 
  }

  .menuButton {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    border: none;
    border-radius: 2rem;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 0px 0px rgba(0,0,0,0);
    padding: 0;
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
    width: 100%;
    height: 100%;
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
    top: 0vh;
    object-fit: cover;
    filter: drop-shadow(0 0px 0px rgba(0,0,0,0));
    opacity: 0;
    transform: translateX(-25%);
    animation: fadeInPortrait 0.7s cubic-bezier(.5,1.5,.5,1) 0.25s forwards,
              shadowPopup 0.7s cubic-bezier(.5,1.5,.5,1) 0.55s forwards;
  }
  @keyframes fadeInPortrait {
    to {
      opacity: 1;
      transform: translateX(-50%);
    }
  }
  @keyframes shadowPopup {
    to {
      filter: drop-shadow(5px 5px 20px rgba(0,0,0,0.5));
    }
  }
  .title {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    font-size: min(8vh, 4vw);
    font-weight: bold;
    color: white;
    text-align: center;
  }
  .description {
    font-size: min(4vh, 2vw);
    color: #bbb;
    text-align: center;
  }
  .menuButtonContainer:hover {
    transform: scale(1.02) translateX(-10px) translateY(-10px);
    filter: brightness(0.5);
    transition: transform 0.2s ease, filter 0.2s ease;
  }
  .menuButtonContainer:hover .menuButton {
    box-shadow: 4px 4px 5px rgba(0,0,0,0.5);
    transition: box-shadow 0.2s ease;
  }
</style>