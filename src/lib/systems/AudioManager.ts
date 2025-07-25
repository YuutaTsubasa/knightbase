import type { AudioGroupId, AudioGroupConfig } from "$lib/assets/AudioGroupSettings";

interface AudioGroup {
  gainNode: GainNode;
  loop: boolean;
}

export class AudioManager {
  private static context = new AudioContext();
  private static groups: Map<AudioGroupId, AudioGroup> = new Map();

  static initialize(groups: Record<AudioGroupId, { loop?: boolean }>) {
    for (const [id, options] of Object.entries(groups)) {
      const gainNode = this.context.createGain();
      gainNode.connect(this.context.destination);
      this.groups.set(id, {
        gainNode,
        loop: options.loop ?? false
      });
    }
  }

  static async preload(id: string, url: string, group: AudioGroupId) {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = await this.context.decodeAudioData(arrayBuffer);
    this.buffers.set(id, { buffer, group });
  }

  static play(id: string) {
    const data = this.buffers.get(id);
    if (!data) return;

    const source = this.context.createBufferSource();
    source.buffer = data.buffer;
    const group = this.groups.get(data.group)!;

    source.loop = group.loop;
    source.connect(group.gainNode);
    source.start();
  }

  static setVolume(groupId: AudioGroupId, volume: number) {
    const group = this.groups.get(groupId);
    if (group) {
      group.gainNode.gain.value = volume;
    }
  }

  static resumeContext() {
    return this.context.resume();
  }

  static connectMediaElement(videoElement: HTMLMediaElement, groupId: AudioGroupId) {
    const source = this.context.createMediaElementSource(videoElement);
    const group = this.groups.get(groupId);
    if (group) source.connect(group.gainNode);
  }

  private static buffers: Map<string, { buffer: AudioBuffer; group: AudioGroupId }> = new Map();
}