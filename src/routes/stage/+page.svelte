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
  import { Star, ChevronDown, ChevronUp } from "lucide-svelte";
  import { AudioManager } from "$lib/systems/AudioManager";
  import { playerStore } from "$lib/systems/PlayerStore";
  import { StaticDataStore } from "$lib/systems/StaticDataStore";

  $: topbarHeight = 0;
  let expandedStage: string | null = null;

  const stageData = StaticDataStore.stageData;
  $: stages = $stageData;

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

  function toggleStageDetails(stageId: string) {
    AudioManager.play("sfx_confirm");
    expandedStage = expandedStage === stageId ? null : stageId;
  }

  async function enterStage(stageId: string) {
    const result = await PopupStore.open({
      title: $t("confirmEnterStage"),
      content: $t("confirmEnterStageContent"),
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

  function renderStars(count: number, total: number = 3) {
    return Array.from({ length: total }, (_, i) => ({
      filled: i < count
    }));
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
          <button class="stageHeader" on:click={() => toggleStageDetails(stage.id)}>
            <div class="stageMainInfo">
              <div class="stageIcon">
                {@html stage.iconSvg}
              </div>
              <div class="stageBasicInfo">
                <h3 class="stageName" style={FontAssets.getCssStyle("titleBold")}>
                  {$t(stage.nameKey)}
                </h3>
                <!-- <div class="stageStars">
                  {#each renderStars(stage.stars) as star}
                    <Star 
                      size={16} 
                      class={star.filled ? "starFilled" : "starEmpty"} 
                      fill={star.filled ? "currentColor" : "none"} />
                  {/each}
                </div> -->
              </div>
            </div>
            <div class="expandIcon">
              {#if expandedStage === stage.id}
                <ChevronUp size={24} />
              {:else}
                <ChevronDown size={24} />
              {/if}
            </div>
          </button>
          
          {#if expandedStage === stage.id}
            <div class="stageDetails">
              <div class="stageDescription">
                <p>{$t(stage.descriptionKey)}</p>
              </div>
              
              <!-- <div class="stageDrops">
                <h4>{$t('estimatedDrops')}:</h4>
                <div class="dropList">
                  {#each stage.drops as drop}
                    <div class="dropItem">
                      <span class="dropName">{$t(drop.nameKey)}</span>
                      <span class="dropAmount">{drop.amount}</span>
                    </div>
                  {/each}
                </div>
              </div> -->
              
              <div class="stageActions">
                <Button 
                  label={$t('enterStage')} 
                  onClick={() => enterStage(stage.id)}
                  className="enterStageButton" />
              </div>
            </div>
          {/if}
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
    gap: 0.5rem;
  }

  .stageItem {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 0.75rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: box-shadow 0.2s ease;
  }

  .stageItem:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .stageHeader {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .stageHeader:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .stageMainInfo {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .stageIcon {
    width: 60px;
    height: 60px;
    background: #0021ff;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 5px;
  }

  .stageIcon :global(.stageIconImage) {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }

  .stageBasicInfo {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stageName {
    margin: 0;
    font-size: 1.25rem;
    color: #1e293b;
  }

  .stageStars {
    display: flex;
    gap: 0.25rem;
  }

  .stageStars :global(.starFilled) {
    color: #fbbf24;
  }

  .stageStars :global(.starEmpty) {
    color: #d1d5db;
  }

  .expandIcon {
    color: #64748b;
    transition: transform 0.2s ease;
  }

  .stageDetails {
    padding: 1rem 1rem 1rem 1rem;
    border-top: 1px solid #e2e8f0;
    animation: fadeIn 0.3s ease;
    max-height: 60vh;
    overflow-y: auto;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .stageDescription {
    margin-bottom: 1rem;
  }

  .stageDescription p {
    margin: 0;
    color: #64748b;
    line-height: 1.5;
  }

  .stageDrops h4 {
    margin: 0 0 0.5rem 0;
    color: #374151;
    font-size: 1rem;
  }

  .dropList {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .dropItem {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
  }

  .dropName {
    color: #4b5563;
  }

  .dropAmount {
    color: #059669;
    font-weight: bold;
  }

  .stageActions {
    display: flex;
    justify-content: flex-end;
  }

  .stageActions :global(.enterStageButton) {
    padding: 0.5rem 1.5rem;
  }
</style>