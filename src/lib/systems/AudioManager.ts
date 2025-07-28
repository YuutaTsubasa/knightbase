import { audioAssets } from "$lib/assets/AudioAssets";
import { type AudioGroupId, audioGroupSettings } from "$lib/assets/AudioGroupSettings";
import { AudioGroup } from "./AudioGroup";
import { playerStore, type PlayerData } from "./PlayerStore";

export class AudioManager {
  private static context = new AudioContext();
  private static groups: Map<AudioGroupId, AudioGroup> = new Map();

  static initialize() {
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

    const res = await fetch(audioAsset.url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = await this.context.decodeAudioData(arrayBuffer);
    this.buffers.set(id, { buffer, group: audioAsset.group });
  }

  static async play(id: string) {
    if (this.groups.values.length == 0) this.initialize();
    if (!this.buffers.has(id)) await this.preload(id);
    const data = this.buffers.get(id);
    if (!data) return null;

    const source = this.context.createBufferSource();
    source.buffer = data.buffer;
    const group = this.groups.get(data.group)!;
    return group.play(source.buffer);
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

  private static buffers: Map<string, { buffer: AudioBuffer; group: AudioGroupId }> = new Map();
}