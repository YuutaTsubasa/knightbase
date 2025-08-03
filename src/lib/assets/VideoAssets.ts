export interface VideoAsset {
  url: string;
  loop: boolean;
  audioGroupId?: string;
}

export const videoAssets: Record<string, VideoAsset> = {
  yuutaBackground: {
    url: "/assets/videos/yuutaBackground.mp4",
    loop: true,
  },
  aliceBackground: {
    url: "/assets/videos/aliceBackground.mp4",
    loop: true,
  },
};