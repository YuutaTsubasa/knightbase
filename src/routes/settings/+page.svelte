<script lang="ts">
  import { PlayerDataManager, playerStore } from '$lib/systems/PlayerStore';
  import { BACK_PATH } from '$lib/utils/Constant';
  import Page from '$lib/components/Page.svelte';
  import { waitUntil } from '$lib/utils/Wait';
  import { imageAssets } from '$lib/assets/ImageAssets';
  import Topbar from '$lib/components/Topbar.svelte';
  import Button from '$lib/components/Button.svelte';
  import { LocalizationStore, t } from '$lib/systems/LocalizationStore';
  import { BoxIcon, DrumIcon, FormInputIcon, MessageSquareTextIcon, Music4Icon, Volume2Icon } from 'lucide-svelte';
  import { get, writable, type Writable } from 'svelte/store';
  import StatusBox from '$lib/components/StatusBox.svelte';
  import { StatusBoxType } from '$lib/types/StatusBoxType';
  import { GamepadManager, type FocusableElement } from '$lib/systems/GamepadManager';
  import { onMount, onDestroy } from 'svelte';

  let playerData = $playerStore;
  $: masterVolume = playerData.masterVolume;
  $: bgmVolume = playerData.bgmVolume;
  $: sfxVolume = playerData.sfxVolume;

  $: locale = LocalizationStore.locale;
  $: availableLocales = LocalizationStore.availableLocales;

  $: topBarHeight = 0;
  let restoreText = '';
  let restoreStatusType = StatusBoxType.Default;
  let restoreStatus = 'backupSaveHint';
  let shouldExit: Writable<boolean>;

  // Element references for gamepad navigation
  let masterVolumeSlider: HTMLInputElement;
  let bgmVolumeSlider: HTMLInputElement;
  let sfxVolumeSlider: HTMLInputElement;
  let languageSelect: HTMLSelectElement;
  let restoreTextInput: HTMLInputElement;
  let backupButton: Button;
  let restoreButton: Button;
  let topbar: Topbar;

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

  function adjustSlider(element: HTMLInputElement, direction: 'left' | 'right') {
    const currentValue = parseInt(element.value);
    const step = 5; // Adjust by 5 per input
    const min = parseInt(element.min);
    const max = parseInt(element.max);
    
    let newValue = direction === 'left' ? currentValue - step : currentValue + step;
    newValue = Math.max(min, Math.min(max, newValue));
    
    element.value = newValue.toString();
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function registerGamepadElements() {
    if (!masterVolumeSlider || !bgmVolumeSlider || !sfxVolumeSlider || !languageSelect || !restoreTextInput || !backupButton || !restoreButton || !topbar) {
      // Wait for elements to be ready
      setTimeout(registerGamepadElements, 100);
      return;
    }

    const backButton = topbar.getBackButton();
    if (!backButton) {
      setTimeout(registerGamepadElements, 100);
      return;
    }

    const focusableElements: FocusableElement[] = [
      {
        element: backButton,
        type: 'button',
        onActivate: () => shouldExit?.set(true)
      },
      {
        element: masterVolumeSlider,
        type: 'slider',
        onAdjust: (direction) => adjustSlider(masterVolumeSlider, direction)
      },
      {
        element: bgmVolumeSlider,
        type: 'slider',
        onAdjust: (direction) => adjustSlider(bgmVolumeSlider, direction)
      },
      {
        element: sfxVolumeSlider,
        type: 'slider',
        onAdjust: (direction) => adjustSlider(sfxVolumeSlider, direction)
      },
      {
        element: languageSelect,
        type: 'select'
      },
      {
        element: backupButton.getButtonElement(),
        type: 'button',
        onActivate: handleBackup
      },
      {
        element: restoreTextInput,
        type: 'input'
      },
      {
        element: restoreButton.getButtonElement(),
        type: 'button',
        onActivate: handleRestore
      }
    ];

    GamepadManager.registerFocusableElements(focusableElements);
  }

  onMount(() => {
    registerGamepadElements();
  });

  onDestroy(() => {
    GamepadManager.clearFocusableElements();
  });

  async function main(){
    shouldExit = writable(false);
    await waitUntil(shouldExit, value => value);
    return BACK_PATH;
  }
</script>

<Page mainProgress={main} wrapperStyle={`background-image: url(${imageAssets["backgroundWhite"]}); background-color: white; background-repeat: no-repeat; background-attachment: fixed; background-size: cover;`}>
  <slot name="outside">
    <Topbar bind:this={topbar}
      primaryTitle={$t("settingsPageTitle")}
      secondaryTitle={$t("settingsPageSubtitle")}
      onHeightChange={(height) => topBarHeight = height}
      onBack={() => { shouldExit?.set(true);}} />
  </slot>
  
  <div class="settingsPanel" style={`padding-top: ${topBarHeight}px;`}>
    <label>
      <div class="labelTitle"><Volume2Icon class="icon" size="20" /> {$t("masterVolume")}</div>
      <input bind:this={masterVolumeSlider} type="range" min="0" max="100" bind:value={masterVolume} on:input={updateVolume} 
        style="--ratio: {masterVolume}%"/>
      <span>{masterVolume}</span>
    </label>

    <label>
      <div class="labelTitle"><Music4Icon class="icon" size="20" /> {$t("musicVolume")}</div>
      <input bind:this={bgmVolumeSlider} type="range" min="0" max="100" bind:value={bgmVolume} on:input={updateVolume} 
        style="--ratio: {bgmVolume}%"/>
      <span>{bgmVolume}</span>
    </label>

    <label>
      <div class="labelTitle"><DrumIcon class="icon" size="20" /> {$t("soundVolume")}</div>
      <input bind:this={sfxVolumeSlider} type="range" min="0" max="100" bind:value={sfxVolume} on:input={updateVolume} 
        style="--ratio: {sfxVolume}%"/>
      <span>{sfxVolume}</span>
    </label>

    <label>
      <div class="labelTitle">
        <MessageSquareTextIcon class="icon" size="20"/> {$t("language")}
      </div>
      <select bind:this={languageSelect} bind:value={$locale} on:change={() => {LocalizationStore.setLocale(LocalizationStore.getLocale());}}>
        {#each $availableLocales as availableLocale }
          <option value={availableLocale}>{$t(availableLocale)}</option>
        {/each}
      </select>
    </label>

    <div class="backupRestore">
      <StatusBox type={restoreStatusType}>{$t(restoreStatus)}</StatusBox>
      <Button bind:this={backupButton} onClick={handleBackup}><BoxIcon class="icon" size="20"/> {$t("backupSaveData")}</Button>
      <div class="restoreSection">
        <input bind:this={restoreTextInput} type="text" bind:value={restoreText} placeholder="{$t("pasteSaveDataHint")}" />
        <Button bind:this={restoreButton} onClick={handleRestore}><FormInputIcon class="icon" size="20"/> {$t("restoreSaveData")}</Button>
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