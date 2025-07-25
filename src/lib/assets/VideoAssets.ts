export interface VideoAsset {
  url: string;
  loop: boolean;
  audioGroupId?: string;
}

export const videoAssets: Record<string, VideoAsset> = {
  titleBackground: {
    url: "/assets/videos/titleBackground.mp4",
    loop: true,
  },
};