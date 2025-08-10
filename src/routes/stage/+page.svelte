<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/systems/LocalizationStore";
  import Page from "$lib/components/Page.svelte";
  import Button from "$lib/components/Button.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { AudioManager } from "$lib/systems/AudioManager";
  import { playerStore } from "$lib/systems/PlayerStore";
  import { StaticDataStore } from "$lib/systems/StaticDataStore";
  import { characterPortraitImageKey } from "$lib/utils/KeyHelper";
  import Image from "$lib/components/Image.svelte";

  $: topbarHeight = 0;

  const stageData = StaticDataStore.stageData;
  $: stages = $stageData;

  function getStageBackgroundImage(stageId: string): string {
    // Map stage IDs to their background images
    const backgroundMap: Record<string, string> = {
      stage1: imageAssets.stage1Background,
      stage2: imageAssets.stage2Background,
    };
    return backgroundMap[stageId] || imageAssets.stageBackground;
  }

  let goToNextScene: Writable<string | null>;
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/mainmenu";
  }

  function goToCharacterPage() {
    goToNextScene.set("/character");
  }

  function enterStage(stageId: string) {
    AudioManager.play("sfx_confirm");
    // Save selected stage to PlayerStore
    playerStore.update(data => ({ ...data, selectedStage: stageId }));
    // Navigate directly to stage detail page
    goToNextScene.set(`/stage/${stageId}`);
  }
</script>

<Page mainProgress={main} 
  wrapperStyle="background-image: url({imageAssets["stageBackground"]}); background-size: cover; background-position: center; background-color: white;"
  contentClass="dotBackground"
  contentStyle="min-height: 100vh; background-color: rgba(255, 255, 255, 0.5); backdrop-filter: blur(4px);">
  <slot name="outside">
    <Topbar 
      primaryTitle={$t('stage')} 
      secondaryTitle={$t('stagePageSubtitle')}
      onHeightChange={(height) => topbarHeight = height}
      onBack={() => goToNextScene.set("/mainmenu")} />
  </slot>
  
  <div class="stagePage" style={`--topbarHeight: ${topbarHeight}px;`}>
    <div class="stageActions">
      <Button 
        label={$t('changeCharacter')} 
        onClick={() => goToCharacterPage()}
        className="changeCharacterButton" />
    </div>
    <div class="stageList">
      {#each stages as stage, index (stage.id)}
        <div class="stageItem">
          <!-- Long bar button with background image -->
          <button class="stageBar" 
               style="background-image: url({getStageBackgroundImage(stage.id)}); --scrollEnd: -1536px; --listIndex: {index};"
               on:click={() => enterStage(stage.id)}>
            
            <div class="characterAvatar">
              <div class="characterPortrait" style="background-image: url({imageAssets[characterPortraitImageKey($playerStore.selectedCharacter)]});"></div>
            </div>
            <!-- Bottom overlay with blur effect -->
            <div class="stageBottomOverlay">
              <!-- Left section: Title and description -->
              <div class="stageInfo">
                <h3 class="stageName" style={FontAssets.getCssStyle("titleBold")}>
                  <div class="stageIcon">
                    {@html stage.iconSvg}
                  </div>
                  {$t(stage.nameKey)}
                </h3>
                <p class="stageDescription">
                  {$t(stage.descriptionKey)}
                </p>
              </div>
            </div>
          </button>
        </div>
      {/each}
    </div>
  </div>
</Page>

<style>
  .stagePage {
    display: flex;
    flex-direction: column;
    padding-top: var(--topbarHeight, 0px);
    box-sizing: border-box;
  }

  .stageList {
    flex: 1;
    padding: 1rem 2rem 1rem 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .stageItem {
    position: relative;
    border-radius: 1rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .stageItem:global(.navFocused),
  .stageItem:hover, .stageItem:active {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  .stageBar {
    all: unset;
    width: 100%;
    position: relative;
    height: 20rem;
    background-position: center;
    cursor: pointer;
    border-radius: 1rem;
    overflow: hidden;
    transition: all 0.2s ease;
    opacity: 0;
    transform: translateX(40px);
    animation: fadeInBar 0.6s cubic-bezier(.5,1.5,.5,1) calc(0.2s + var(--listIndex) * 0.1s) forwards,
      backgroundScrollX 5s linear infinite;
  }

  @keyframes fadeInBar {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .stageBar::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    background: linear-gradient(to right, black, transparent 30%, transparent);
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  .stageBar:global(.navFocused),
  .stageBar:hover, .stageBar:active {
    border: 5px solid #0021ff;
    box-shadow: 0 4px 16px rgba(0, 33, 255, 0.3);
  }

  .stageIcon {
    width: 6vw;
    height: 6vw;
    max-width: 85px;
    max-height: 85px;
    background: rgba(0, 33, 255, 0.14);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    backdrop-filter: blur(3px);
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 33, 255, 0.3);
    margin-bottom: -5px;
  }

  .stageIcon :global(svg) {
    width: 60px;
    height: 60px;
  }

  .stageBottomOverlay {
    position: absolute;
    left: 15px;
    right: 15px;
    bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    z-index: 2;
  }

  .stageInfo {
    display: flex;
    flex-direction: column;
  }

  .stageName {
    margin: 0;
    font-size: min(5vw, 5rem);
    color: white;
    text-shadow: 
      -2px -2px 0 #000,
      2px -2px 0 #000,
      -2px 2px 0 #000,
      2px 2px 0 #000,
      2px 2px 4px rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    gap: 0.4rem;
    text-wrap: nowrap;
  }

  .stageDescription {
    margin: 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: min(2.5vw, 1.2rem);
    line-height: 1.3;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    background: black;
    box-shadow: 2px 2px 4px grey;
    padding-left: 10px;
  }

  .stageActions {
    all: unset;
    width: calc(100% - 16px);
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .stageActions :global(.changeCharacterButton) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    backdrop-filter: blur(5px);
    text-wrap: nowrap;
  }

  .stageActions :global(.changeCharacterButton.navFocused),
  .stageActions :global(.changeCharacterButton:hover),
  .stageActions :global(.changeCharacterButton:active) {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .characterAvatar {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .characterPortrait {
    position: absolute;
    top: 0;
    right: -150px;
    width: 500px;
    height: 100%;
    background-position: 50% 0%;
    background-size: cover;
    background-repeat: no-repeat;
  }
</style>