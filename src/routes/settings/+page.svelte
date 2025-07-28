<script lang="ts">
  import { AudioManager } from '$lib/systems/AudioManager';
  import { PlayerDataManager, playerStore } from '$lib/systems/PlayerStore';
  import { BACK_PATH } from '$lib/utils/Constant';
  import Page from '$lib/components/Page.svelte';
  import { ReactiveProperty } from '$lib/utils/ReactiveProperty';
  import { imageAssets } from '$lib/assets/ImageAssets';
  import { FontAssets } from '$lib/assets/FontAssets';
    import { linear } from 'svelte/easing';

  let playerData = $playerStore;
  $: masterVolume = playerData.masterVolume;
  $: bgmVolume = playerData.bgmVolume;
  $: sfxVolume = playerData.sfxVolume;

  let restoreText = '';
  let restoreStatus = '';
  let shouldExit = new ReactiveProperty(false);

  function updateVolume() {
    playerStore.update(value => ({
      ...value,
      masterVolume,
      bgmVolume,
      sfxVolume
    }));
  }

  function handleBackup() {
    AudioManager.play("sfx_confirm");
    const data = PlayerDataManager.exportBase64();
    if (!data) {
      restoreStatus = '⚠️ 沒有資料可備份';
      return;
    }
    
    navigator.clipboard.writeText(data).then(() => {
      restoreStatus = '✅ 已複製存檔至剪貼簿';
    }).catch(() => {
      restoreStatus = '❌ 複製失敗';
    });
  }

  function handleRestore() {
    try {
      PlayerDataManager.importBase64(restoreText.trim());
      restoreStatus = '✅ 還原成功';
    } catch {
      restoreStatus = '❌ 格式錯誤';
    }
  }

  async function main(){
    await shouldExit.waitUntil(value => value);
    return BACK_PATH;
  }
</script>

<Page mainProgress={main} wrapperStyle={`background: url(${imageAssets["backgroundWhite"]});`}>
  <div class="topbar">
    <button class="backButton" on:click={() => shouldExit.value = true}>←</button>
    <h1 class="topbarTitle" style={FontAssets.getCssStyle("englishNumberBold", "titleBold")}>設定 <span class="topbarSubtitle">Settings</span></h1>
  </div>

  <div class="settingsPanel">
    <label>
      <div class="labelTitle">🎚️ 總音量</div>
      <input type="range" min="0" max="100" bind:value={masterVolume} on:input={updateVolume} 
        style="--ratio: {masterVolume}%"/>
      <span>{masterVolume}</span>
    </label>

    <label>
      <div class="labelTitle">🎵 音樂音量</div>
      <input type="range" min="0" max="100" bind:value={bgmVolume} on:input={updateVolume} 
        style="--ratio: {bgmVolume}%"/>
      <span>{bgmVolume}</span>
    </label>

    <label>
      <div class="labelTitle">🔊 音效音量</div>
      <input type="range" min="0" max="100" bind:value={sfxVolume} on:input={updateVolume} 
        style="--ratio: {sfxVolume}%"/>
      <span>{sfxVolume}</span>
    </label>

    <div class="backupRestore">
      <button class="backupButton" on:click={handleBackup}>📦 備份存檔</button>
      <span class="status">{restoreStatus}</span>

      <div class="restoreSection">
        <input type="text" bind:value={restoreText} placeholder="貼上備份資料..." />
        <button on:click={handleRestore}>📥 還原存檔</button>
      </div>
    </div>
  </div>
</Page>

<style>
  .topbar {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }

  .backButton {
    background: black;
    color: white;
    border: none;
    font-size: 1.5rem;
    padding: 0rem 4rem 0em 0.5rem;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    margin-left: 1rem;
    margin-right: 1rem;
  }

  .topbarTitle {
    font-size: 2rem;
    color: #1e293b;
  }

  .topbarSubtitle {
    font-size: 1rem;
    margin-left: 0.5rem;
    color: #666;
  }

  .settingsPanel {
    width: 80%;
    margin: 0 auto;
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

  .backupButton {
    font-size: 1rem;
    padding: 0.5rem;
  }

  .restoreSection {
    display: flex;
    gap: 0.5rem;
  }

  .restoreSection input {
    flex: 1;
    padding: 0.4rem;
  }

  .status {
    font-size: 0.9rem;
    color: #666;
  }
</style>