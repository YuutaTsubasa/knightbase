<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/systems/LocalizationStore";
  import Page from "$lib/components/Page.svelte";
  import Button from "$lib/components/Button.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import { PopupStore, PopupResult } from "$lib/systems/PopupStore";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { AudioManager } from "$lib/systems/AudioManager";
  import { playerStore } from "$lib/systems/PlayerStore";
  import { StaticDataStore } from "$lib/systems/StaticDataStore";
  import { format } from "$lib/utils/StringUtils";

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

//   [
//     {
//       id: 1,
//       nameKey: "stage1Name",
//       iconSvg: `<svg style="color: #fff;" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
//   <!-- 盾牌（只有描邊） -->
//   <path d="M50 5 C30 10, 15 30, 20 55 C25 80, 50 95, 50 95 C50 95, 75 80, 80 55 C85 30, 70 10, 50 5 Z" 
//         stroke="currentColor" stroke-width="3" fill="none"/>

//   <!-- 劍（實心） -->
//   <rect x="47" y="25" width="6" height="35" fill="currentColor"/>
//   <polygon points="44,25 50,10 56,25" fill="currentColor"/>
//   <rect x="42" y="58" width="16" height="4" fill="currentColor"/>

//   <!-- 星星（實心） -->
//   <polygon points="50,35 52,40 57,40 53,43 55,48 50,45 45,48 47,43 43,40 48,40" fill="currentColor"/>
// </svg>
// `,
//       description: $t("stage1Description"),
//     },
    // {
    //   id: 2,
    //   nameKey: "stage2Name", 
    //   iconKey: "stageIcon2",
    //   stars: 2,
    //   description: $t("stage2Description"),
    //   drops: [
    //     { nameKey: "coinDrop", amount: "150-250" },
    //     { nameKey: "gemDrop", amount: "1-3" }
    //   ]
    // },
    // {
    //   id: 3,
    //   nameKey: "stage3Name",
    //   iconKey: "stageIcon3", 
    //   stars: 1,
    //   description: $t("stage3Description"),
    //   drops: [
    //     { nameKey: "coinDrop", amount: "200-350" },
    //     { nameKey: "rareMaterialDrop", amount: "1-2" }
    //   ]
    // },
    // {
    //   id: 4,
    //   nameKey: "stage4Name",
    //   iconKey: "stageIcon4",
    //   stars: 0,
    //   description: $t("stage4Description"),
    //   drops: [
    //     { nameKey: "coinDrop", amount: "300-500" },
    //     { nameKey: "legendaryMaterialDrop", amount: "0-1" }
    //   ]
    // }
  // ];

  let goToNextScene: Writable<string | null>;
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/battlemenu";
  }

  function goToCharacterPage() {
    // Store that we came from stage page for navigation
    playerStore.update(data => ({ ...data, returnToStage: true }));
    goToNextScene.set("/character");
  }

  async function enterStage(stageId: string) {
    // Find the stage data to get the stage name
    const stage = stages.find(s => s.id === stageId);
    const stageName = stage ? $t(stage.nameKey) : stageId;
    
    const result = await PopupStore.open({
      title: $t("confirmEnterStage"),
      content: format($t("confirmEnterStageContent"), stageName),
      buttons: [
        {
          text: $t("cancel"),
          onClick: () => PopupResult.Close
        },
        {
          text: $t("enter"),
          onClick: () => {
            // Save selected stage to PlayerStore
            playerStore.update(data => ({ ...data, selectedStage: stageId }));
            // Navigate to gameplay
            goToNextScene.set("/gameplay");
            return PopupResult.Close;
          }
        }
      ]
    });
  }
</script>

<Page mainProgress={main} 
  wrapperStyle="background-image: url({imageAssets["backgroundWhite"]}); background-size: cover; background-position: center; background-color: white;"
  contentStyle="box-sizing: border-box; height: 100vh;">
  <slot name="outside">
    <Topbar 
      primaryTitle={$t('stage')} 
      secondaryTitle={$t('stagePageSubtitle')}
      onHeightChange={(height) => topbarHeight = height}
      onBack={() => goToNextScene.set("/battlemenu")} />
  </slot>
  
  <div class="stagePage" style={`--topbarHeight: ${topbarHeight}px;`}>
    <div class="stageList">
      {#each stages as stage (stage.id)}
        <div class="stageItem">
          <!-- Long bar button with background image -->
          <div class="stageBar" 
               style="background-image: url({getStageBackgroundImage(stage.id)});"
               on:click={() => enterStage(stage.id)}
               on:keydown={(e) => e.key === 'Enter' && enterStage(stage.id)}
               role="button"
               tabindex="0">
            
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
              
              <!-- Right section: Change character button -->
              <div class="stageActions" on:click|stopPropagation>
                <Button 
                  label={$t('changeCharacter')} 
                  onClick={() => goToCharacterPage()}
                  className="changeCharacterButton" />
              </div>
            </div>
          </div>
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
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .stageItem {
    position: relative;
    border-radius: 1rem;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .stageItem:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  .stageBar {
    position: relative;
    height: 20rem;
    background-position: center;
    animation: backgroundScroll 20s linear infinite;
    cursor: pointer;
    border-radius: 1rem;
    overflow: hidden;
    transition: all 0.2s ease;
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

  @keyframes backgroundScroll {
    0% {
      background-position-x: 0%;
    }
    100% {
      background-position-x: 100%;
    }
  }

  .stageBar:hover {
    box-shadow: 0 4px 16px rgba(0, 33, 255, 0.3);
  }

  .stageIcon {
    width: 85px;
    height: 85px;
    background: rgba(0, 33, 255, 0.8);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    backdrop-filter: blur(3px);
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 33, 255, 0.3);
    margin-bottom: -10px;
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
    font-size: 5rem;
    color: white;
    text-shadow: 
      -2px -2px 0 #000,
      2px -2px 0 #000,
      -2px 2px 0 #000,
      2px 2px 0 #000,
      2px 2px 4px rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .stageDescription {
    margin: 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    line-height: 1.3;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    background: black;
    box-shadow: 2px 2px 4px grey;
  }

  .stageActions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    margin-left: 1rem;
  }

  .stageActions :global(.changeCharacterButton) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    backdrop-filter: blur(5px);
  }

  .stageActions :global(.changeCharacterButton:hover) {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
</style>