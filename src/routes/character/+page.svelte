<script lang="ts">
  import { FontAssets } from "$lib/assets/FontAssets";
  import { imageAssets } from "$lib/assets/ImageAssets";
  import { t } from "$lib/assets/LocalizationAssets";
  import { StaticDataStore } from "$lib/systems/StaticDataStore";
  import Image from "$lib/components/Image.svelte";
  import Page from "$lib/components/Page.svelte";
  import Button from "$lib/components/Button.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import { BACK_PATH } from "$lib/utils/Constant";
  import { waitUntil } from "$lib/utils/Wait";
  import { get, writable, type Writable } from "svelte/store";

  $: topbarHeight = 0;

  // Character data from StaticDataStore
  const { characterData, characterLevelAbilityData } = StaticDataStore;
  $: charactersData = $characterData;
  $: characterLevelData = $characterLevelAbilityData;

  // Transform static data to display format
  $: characters = charactersData.map(char => {
    const levelAbility = characterLevelData.find(level => 
      level.characterId === char.characterId && level.characterLevel > 0
    ) || { characterLevel: 1, IncreasedHp: 0, IncreasedSp: 0, IncreasedAtk: 0, IncreasedDef: 0, IncreasedSkillCd: 0 };
    
    return {
      id: char.characterId,
      name: $t(char.characterNameKey),
      nameKey: char.characterNameKey,
      descriptionKey: char.characterDescriptionKey,
      imageKey: char.characterIconKey,
      level: levelAbility.characterLevel,
      hp: char.BaseHp + levelAbility.IncreasedHp,
      sp: char.BaseSp + levelAbility.IncreasedSp,
      atk: char.BaseAtk + levelAbility.IncreasedAtk,
      def: char.BaseDef + levelAbility.IncreasedDef,
      skillCd: char.BaseSkillCd + levelAbility.IncreasedSkillCd
    };
  });

  let goToNextScene: Writable<string | null>;
  async function main() {
    goToNextScene = writable(null);
    await waitUntil(goToNextScene, value => value !== null);
    return get(goToNextScene) ?? "/mainmenu";
  }

  function upgradeCharacter(characterId: number) {
    console.log(`Upgrading character ${characterId}`);
    // TODO: Implement character upgrade logic
  }
</script>

<Page mainProgress={main} 
  wrapperStyle="background-image: url({imageAssets["backgroundWhite"]}); background-size: cover; background-position: center; background-color: white;"
  contentStyle="box-sizing: border-box; height: 100vh;">
  <slot name="outside">
    <Topbar 
      primaryTitle={$t('character')} 
      secondaryTitle={$t('characterPageSubtitle')}
      onHeightChange={(height) => topbarHeight = height}
      onBack={() => goToNextScene.set(BACK_PATH)} />
  </slot>
  
  <div class="characterPage" style={`--topbarHeight: ${topbarHeight}px;`}>
    <div class="characterList">
      {#each characters as character (character.id)}
        <div class="characterCard">
          <div class="characterImageSection">
            <Image key={character.imageKey} alt={character.name} className="characterPortrait" />
            <div class="levelBadge">
              <span style={FontAssets.getCssStyle("titleBold")}>Lv.{character.level}</span>
            </div>
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
            
            <div class="statsSection">
              <div class="statRow">
                <span class="statLabel">HP:</span>
                <span class="statValue">{character.hp}</span>
              </div>
              <div class="statRow">
                <span class="statLabel">SP:</span>
                <span class="statValue">{character.sp}</span>
              </div>
              <div class="statRow">
                <span class="statLabel">ATK:</span>
                <span class="statValue">{character.atk}</span>
              </div>
              <div class="statRow">
                <span class="statLabel">DEF:</span>
                <span class="statValue">{character.def}</span>
              </div>
              <div class="statRow">
                <span class="statLabel">{$t('skillCd')}:</span>
                <span class="statValue">{character.skillCd}s</span>
              </div>
            </div>
            
            <div class="actionSection">
              <Button 
                label={$t('upgradeCharacter')} 
                onClick={() => upgradeCharacter(character.id)} 
                className="upgradeButton" />
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
    height: 100%;
    padding-top: var(--topbarHeight, 0px);
    box-sizing: border-box;
  }

  .characterList {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .characterCard {
    display: flex;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    min-height: 200px;
    transition: transform 0.2s ease;
  }

  .characterCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .characterImageSection {
    position: relative;
    width: 200px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .characterImageSection :global(.characterPortrait) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .levelBadge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 1rem;
    font-size: 0.9rem;
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

  .statsSection {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .statRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
  }

  .statLabel {
    font-weight: bold;
    color: #475569;
  }

  .statValue {
    color: #1e293b;
    font-weight: bold;
  }

  .actionSection {
    display: flex;
    justify-content: flex-end;
  }

  .actionSection :global(.upgradeButton) {
    padding: 0.5rem 1.5rem;
  }
</style>