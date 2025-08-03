<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/systems/LocalizationStore";
  import { StaticDataStore } from "$lib/systems/StaticDataStore";
  import Image from "$lib/components/Image.svelte";
  import Page from "$lib/components/Page.svelte";
  import Button from "$lib/components/Button.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";
  import { playerStore } from "$lib/systems/PlayerStore";
  import { characterPortraitImageKey } from "$lib/utils/KeyHelper";
  $: topbarHeight = 0;

  // Character data from StaticDataStore
  const { characterData } = StaticDataStore;
  $: charactersData = $characterData;

  $: characters = charactersData.map(char => ({
    id: char.characterId,
    name: $t(char.characterNameKey),
    nameKey: char.characterNameKey,
    descriptionKey: char.characterDescriptionKey,
  }));

  let goToNextScene: Writable<string | null>;
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/mainmenu";
  }

  function useCharacter(characterId: string) {
    playerStore.update(playerData => ({ ...playerData, selectedCharacter: characterId }));
  }
</script>

<Page mainProgress={main} 
  wrapperStyle="background-image: url({imageAssets["backgroundWhite"]}); background-size: cover; background-position: center; background-color: white;">
  <slot name="outside">
    <Topbar 
      primaryTitle={$t('character')} 
      secondaryTitle={$t('characterPageSubtitle')}
      onHeightChange={(height) => topbarHeight = height}
      onBack={() => goToNextScene.set("/battlemenu")} />
  </slot>
  
  <div class="characterPage" style={`--topbarHeight: ${topbarHeight}px;`}>
    <div class="characterList">
      {#each characters as character (character.id)}
        {@const isSelected = $playerStore.selectedCharacter === character.id}
        <div class="characterCard" class:selected={isSelected}>
          <div class="characterImageSection">
            <Image key={characterPortraitImageKey(character.id)} alt={character.name} className="characterPortrait" />
          </div>
          <div class="characterInfo">
            <div class="characterHeader">
              <h3 class="characterName" style={FontAssets.getCssStyle("titleBold")}>
                {$t(character.nameKey)}
              </h3>
              <p class="characterDescription">
                {$t(character.descriptionKey)}
              </p>
            </div>
            
            <div class="actionSection">
              {#if isSelected}
                <span class="alreadyUseCharacter" 
                  class:visible={isSelected}>
                  {$t('alreadyUseCharacter')}
                </span>
              {:else}
                <Button 
                  label={$t('useCharacter')} 
                  onClick={() => useCharacter(character.id)} 
                  className="useCharacterButton" />
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</Page>

<style>
  .characterPage {
    display: flex;
    flex-direction: column;
    padding-top: var(--topbarHeight, 0px);
    padding-bottom: 1rem;
  }

  .characterList {
    flex: 1;
    padding: 1rem;
    width: 100%;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    opacity: 0;
    transform: translateX(40px);
    animation: fadeInList 0.6s cubic-bezier(.5,1.5,.5,1) 0.2s forwards;
  }

  @keyframes fadeInList {
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .characterCard {
    display: flex;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    min-height: 200px;
    transition: transform 0.2s ease;
  }

  .characterCard.selected {
    border: 2px solid #4f46e5; /* Indigo-600 */
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.2);
  }

  .characterCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .characterImageSection {
    position: relative;
    width: 200px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px;
  }

  .characterImageSection :global(.characterPortrait) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .characterInfo {
    flex: 1;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .characterHeader .characterName {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    color: #1e293b;
  }

  .characterHeader .characterDescription {
    margin: 0 0 1rem 0;
    color: #64748b;
    line-height: 1.4;
  }

  .actionSection {
    display: flex;
    justify-content: flex-end;
  }

  .actionSection :global(.useCharacterButton) {
    padding: 0.5rem 1.5rem;
  }

  .alreadyUseCharacter {
    color: #4f46e5; /* Indigo-600 */
    font-weight: bold;
    margin-top: 0.5rem;
  }
</style>