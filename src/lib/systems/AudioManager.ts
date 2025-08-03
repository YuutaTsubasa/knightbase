import { audioAssets } from "$lib/assets/AudioAssets";
import { type AudioGroupId, audioGroupSettings } from "$lib/assets/AudioGroupSettings";
import { AudioGroup } from "./AudioGroup";
import { playerStore, type PlayerData } from "./PlayerStore";

export class AudioManager {
  private static context = new AudioContext();
  private static groups: Map<AudioGroupId, AudioGroup> = new Map();
  private static buffers: Map<string, { buffer: AudioBuffer; group: AudioGroupId }> = new Map();
  private static currentBGMStopFunction: (() => void) | null = null;

  static initialize() {
    if (this.groups.entries.length > 0)
      return;
    
    for (const [id, options] of Object.entries(audioGroupSettings)) {
      this.groups.set(id, 
        new AudioGroup(this.context, options.loop)
      );
    }

    playerStore.subscribe(playerData => {
      this.updateVolumeFromPlayerData(playerData);
    });
  }

  static async preload(id: string) {
    const audioAsset = audioAssets[id];
    if (!audioAsset) return;

    try {
      const res = await fetch(audioAsset.url);
      if (!res.ok) {
        console.warn(`Failed to fetch audio asset: ${id} (${audioAsset.url})`);
        return;
      }
      const arrayBuffer = await res.arrayBuffer();
      const buffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(id, { buffer, group: audioAsset.group });
    } catch (error) {
      console.warn(`Failed to preload audio asset: ${id}`, error);
    }
  }

  static async play(id: string) {
    if (this.groups.values.length == 0) this.initialize();
    if (!this.buffers.has(id)) await this.preload(id);
    const data = this.buffers.get(id);
    if (!data) {
      console.warn(`Audio asset not available: ${id}`);
      return null;
    }

    const source = this.context.createBufferSource();
    source.buffer = data.buffer;
    const group = this.groups.get(data.group)!;
    const stopFunction = group.play(source.buffer);

    // 如果是 BGM，保存停止函數
    if (data.group === 'bgm') {
      this.currentBGMStopFunction = stopFunction;
    }

    return stopFunction;
  }

  private static updateVolumeFromPlayerData(playerData: PlayerData){
    this.groups.forEach((group, groupId) => {
      if (groupId !== "bgm" && groupId !== "sfx")
        return;

      group?.setVolume(
        ((groupId === "bgm" ? playerData.bgmVolume : 
          groupId === "sfx" ? playerData.sfxVolume : 0) / 100) *
          (playerData.masterVolume / 100)
      );
    });
  }

  static resumeContext() {
    return this.context.resume();
  }

  static connectMediaElement(videoElement: HTMLMediaElement, groupId: AudioGroupId) {
    const group = this.groups.get(groupId);
    if (!group) 
      return;  

    group.connectMediaElement(videoElement);
  }

  static stopGroup(groupId: AudioGroupId) {
    const group = this.groups.get(groupId);
    if (group) {
      group.stop();
    }
  }

  static stopBGM() {
    // 使用保存的停止函數來停止當前 BGM
    if (this.currentBGMStopFunction) {
      this.currentBGMStopFunction();
      this.currentBGMStopFunction = null;
    }

    // 同時也停止 BGM 群組
     this.stopGroup("bgm");
  }

  static stopAll() {
    this.groups.forEach((group) => {
      group.stop();
    });
    this.currentBGMStopFunction = null;
  }
}