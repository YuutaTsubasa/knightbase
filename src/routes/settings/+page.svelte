<script lang="ts">
  import { PlayerDataManager, playerStore } from '$lib/systems/PlayerStore';
  import { BACK_PATH } from '$lib/utils/Constant';
  import Page from '$lib/components/Page.svelte';
  import { waitUntil } from '$lib/utils/Wait';
  import { imageAssets } from '$lib/assets/ImageAssets';
  import Topbar from '$lib/components/Topbar.svelte';
  import Button from '$lib/components/Button.svelte';
  import { LocalizationAssets, t } from '$lib/assets/LocalizationAssets';
  import { BoxIcon, DrumIcon, FormInputIcon, MessageSquareTextIcon, Music4Icon, Volume2Icon } from 'lucide-svelte';
  import { get, writable, type Writable } from 'svelte/store';
  import StatusBox from '$lib/components/StatusBox.svelte';
  import { StatusBoxType } from '$lib/types/StatusBoxType';

  let playerData = $playerStore;
  $: masterVolume = playerData.masterVolume;
  $: bgmVolume = playerData.bgmVolume;
  $: sfxVolume = playerData.sfxVolume;

  $: locale = LocalizationAssets.locale;
  $: availableLocales = LocalizationAssets.availableLocales;

  $: topBarHeight = 0;
  let restoreText = '';
  let restoreStatusType = StatusBoxType.Default;
  let restoreStatus = 'backupSaveHint';
  let shouldExit: Writable<boolean>;

  function updateVolume() {
    playerStore.update(value => ({
      ...value,
      masterVolume,
      bgmVolume,
      sfxVolume
    }));
  }

  function handleBackup() {
    const data = PlayerDataManager.exportBase64();
    if (!data) {
      restoreStatusType = StatusBoxType.Error;
      restoreStatus = 'noDataToBackup';
      return;
    }
    
    navigator.clipboard.writeText(data).then(() => {
      restoreStatusType = StatusBoxType.Success;
      restoreStatus = 'successToCopy';
    }).catch(() => {
      restoreStatusType = StatusBoxType.Error;
      restoreStatus = 'copyFailed';
    });
  }

  function handleRestore() {
    try {
      PlayerDataManager.importBase64(restoreText.trim());
      restoreStatusType = StatusBoxType.Success;
      restoreStatus = 'restoreSuccess';
    } catch {
      restoreStatusType = StatusBoxType.Error;
      restoreStatus = 'formatError';
    }
  }

  async function main(){
    shouldExit = writable(false);
    await waitUntil(shouldExit, value => value);
    return BACK_PATH;
  }
</script>

<Page mainProgress={main} wrapperStyle={`background-image: url(${imageAssets["backgroundWhite"]}); background-color: white; background-repeat: no-repeat; background-attachment: fixed; background-size: cover;`}>
  <slot name="outside">
    <Topbar 
      primaryTitle={$t("settingsPageTitle")}
      secondaryTitle={$t("settingsPageSubtitle")}
      onHeightChange={(height) => topBarHeight = height}
      onBack={() => { shouldExit?.set(true);}} />
  </slot>
  
  <div class="settingsPanel" style={`padding-top: ${topBarHeight}px;`}>
    <label>
      <div class="labelTitle"><Volume2Icon class="icon" size="20" /> {$t("masterVolume")}</div>
      <input type="range" min="0" max="100" bind:value={masterVolume} on:input={updateVolume} 
        style="--ratio: {masterVolume}%"/>
      <span>{masterVolume}</span>
    </label>

    <label>
      <div class="labelTitle"><Music4Icon class="icon" size="20" /> {$t("musicVolume")}</div>
      <input type="range" min="0" max="100" bind:value={bgmVolume} on:input={updateVolume} 
        style="--ratio: {bgmVolume}%"/>
      <span>{bgmVolume}</span>
    </label>

    <label>
      <div class="labelTitle"><DrumIcon class="icon" size="20" /> {$t("soundVolume")}</div>
      <input type="range" min="0" max="100" bind:value={sfxVolume} on:input={updateVolume} 
        style="--ratio: {sfxVolume}%"/>
      <span>{sfxVolume}</span>
    </label>

    <label>
      <div class="labelTitle">
        <MessageSquareTextIcon class="icon" size="20"/> {$t("language")}
      </div>
      <select bind:value={$locale} on:change={() => {LocalizationAssets.setLocale(LocalizationAssets.getLocale());}}>
        {#each $availableLocales as availableLocale }
          <option value={availableLocale}>{$t(availableLocale)}</option>
        {/each}
      </select>
    </label>

    <div class="backupRestore">
      <StatusBox type={restoreStatusType}>{$t(restoreStatus)}</StatusBox>
      <Button onClick={handleBackup}><BoxIcon class="icon" size="20"/> {$t("backupSaveData")}</Button>
      <div class="restoreSection">
        <input type="text" bind:value={restoreText} placeholder="{$t("pasteSaveDataHint")}" />
        <Button onClick={handleRestore}><FormInputIcon class="icon" size="20"/> {$t("restoreSaveData")}</Button>
      </div>
    </div>
  </div>
</Page>

<style>
  .settingsPanel {
    width: 80%;
    margin: 0 auto;
    padding-bottom: 50px;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .labelTitle {
    font-weight: bold;
    color: #333;
  }

  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    box-sizing: border-box;
    width: 100%;
    height: 0.5rem;
    border: 0.5px solid rgb(210, 210, 210);
    background: linear-gradient(to right, blue 0%, blue var(--ratio), white var(--ratio), white 100%);
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 15px;
    background: blue;
  }

  input[type='range']::-moz-range-thumb {
    appearance: none;
    background: blue;
    width: 15px;
    height: 15px;
    border-radius: 15px;
  }

  .backupRestore {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-top: 1rem;
  }

  .restoreSection {
    display: flex;
    gap: 0.5rem;
  }

  .restoreSection input {
    flex: 1;
    padding: 0.4rem;
  }
</style>