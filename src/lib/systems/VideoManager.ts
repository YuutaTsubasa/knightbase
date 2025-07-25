import { videoAssets } from "$lib/assets/VideoAssets";
import { AudioManager } from "./AudioManager";

export class VideoManager {
  private static videos: Map<string, HTMLVideoElement> = new Map();

  static get(id: string): HTMLVideoElement {
    if (this.videos.has(id)) return this.videos.get(id)!;

    const asset = videoAssets[id];
    const video = document.createElement("video");
    video.src = asset.url;
    video.preload = "auto";
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.crossOrigin = "anonymous";
    video.loop = asset.loop;

    if (asset.audioGroupId) {
      AudioManager.connectMediaElement(video, asset.audioGroupId);
    } else {
      video.muted = true;
    }

    this.videos.set(id, video);
    return video;
  }

  static unload(id: string) {
    const video = this.videos.get(id);
    if (!video) return;

    video.pause();
    video.removeAttribute("src");
    video.load();
    this.videos.delete(id);
  }

  static clearAll() {
    for (const id of this.videos.keys()) {
      this.unload(id);
    }
  }
}