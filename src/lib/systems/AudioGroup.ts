export class AudioGroup {
  private currentNode: AudioBufferSourceNode | null = null;
  private context: AudioContext;
  private loop: boolean;
  private gainNode: GainNode;
  private currentPlayAudioId: number;

  constructor(context: AudioContext, loop: boolean = false) {
    this.context = context;
    this.loop = loop;
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
    this.currentPlayAudioId = 0;
  }

  play(buffer: AudioBuffer) {
    if (this.loop) {
      this.stop();
    }

    const currentPlayAudioId = ++this.currentPlayAudioId;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = this.loop;
    source.connect(this.gainNode);
    source.start();

    if (this.loop) {
      this.currentNode = source;
      source.onended = () => {
        if (this.currentNode === source) this.currentNode = null;
      };
    } else {
      source.onended = () => {
        source.disconnect();
      };
    }

    return () => {
      if (this.currentPlayAudioId !== currentPlayAudioId)
        return;
      
      this.stop();
    }
  }

  stop() {
    if (this.currentNode) {
      try {
        this.currentNode.stop();
      } catch {}
      this.currentNode.disconnect();
      this.currentNode = null;
    }
  }

  setVolume(volume: number) {
    this.gainNode.gain.value = volume;
  }

  connectMediaElement(videoElement: HTMLMediaElement) {
    const source = this.context.createMediaElementSource(videoElement);
    source.connect(this.gainNode);
  }
}