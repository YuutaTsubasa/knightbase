# 音效轉換工具使用說明

## 概述

這個專案提供了兩個音效轉換工具，可以將各種音效格式轉換成 MP3 格式，以優化檔案大小和相容性。

## 工具檔案

### 1. 基本版本: `utils/convert-audios-to-mp3.js`
- 簡單易用的轉換工具
- 基本功能：轉換、備份、更新 TypeScript 檔案

### 2. 進階版本: `utils/convert-audios-to-mp3-advanced.js`
- 功能更完整的轉換工具
- 詳細的檔案資訊顯示
- 可配置的編碼參數
- 統計報告和壓縮率計算

## 前置需求

### 安裝 FFmpeg

#### Windows
1. 下載 FFmpeg: https://ffmpeg.org/download.html
2. 解壓縮到任意目錄
3. 將 FFmpeg 的 bin 目錄加入系統 PATH

#### macOS
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

### 檢查安裝
```bash
ffmpeg -version
```

## 使用方法

### 基本版本

```bash
# 在專案根目錄執行
node utils/convert-audios-to-mp3.js
```

### 進階版本

```bash
# 在專案根目錄執行
node utils/convert-audios-to-mp3-advanced.js
```

## 支援的格式

### 輸入格式
- `.wav` - WAV 音效檔案
- `.ogg` - OGG 音效檔案
- `.flac` - FLAC 無損音效檔案
- `.aac` - AAC 音效檔案
- `.m4a` - M4A 音效檔案
- `.wma` - WMA 音效檔案

### 輸出格式
- `.mp3` - MP3 音效檔案

## 功能特色

### 基本版本功能
- ✅ 自動掃描音效目錄
- ✅ 轉換支援的音效格式
- ✅ 自動備份原檔
- ✅ 更新 TypeScript 檔案路徑
- ✅ 錯誤處理和恢復

### 進階版本功能
- ✅ 所有基本版本功能
- ✅ 詳細的檔案資訊顯示
- ✅ 檔案大小統計
- ✅ 壓縮率計算
- ✅ 可配置的 MP3 編碼參數
- ✅ 進度追蹤
- ✅ 詳細的統計報告

## 配置選項 (進階版本)

在 `utils/convert-audios-to-mp3-advanced.js` 中可以調整以下配置：

```javascript
const config = {
  // 目錄設定
  audioDir: path.resolve("static/assets/audios"),
  backupDir: path.resolve("originalAudioAssets"),
  tsPath: path.resolve("src/lib/assets/AudioAssets.ts"),
  
  // 支援的格式
  supportedFormats: [".wav", ".ogg", ".flac", ".aac", ".m4a", ".wma"],
  targetFormat: ".mp3",
  
  // MP3 編碼設定
  mp3Settings: {
    bitrate: "128k",        // 位元率 (64k, 128k, 192k, 320k)
    quality: "2",           // 品質 (0-9, 2 是很好的平衡)
    channels: "2",          // 聲道數 (1=單聲道, 2=立體聲)
    sampleRate: "44100"     // 採樣率 (22050, 44100, 48000)
  },
  
  // 行為設定
  backup: true,             // 是否備份原檔
  deleteOriginal: true,     // 是否刪除原檔
  updateTypeScript: true,   // 是否更新 TypeScript 檔案
  verbose: true             // 是否顯示詳細資訊
};
```

## 輸出範例

### 基本版本輸出
```
🎵 開始轉換音效檔案...
🔄 轉換: sfx_explosion.wav -> sfx_explosion.mp3
💾 備份: sfx_explosion.wav
✅ 轉換成功: sfx_explosion.wav -> sfx_explosion.mp3
📝 AudioAssets.ts 已更新!

🎵 轉換完成!
📊 總共轉換了 1 個檔案:
  sfx_explosion.wav -> sfx_explosion.mp3
```

### 進階版本輸出
```
🎵 開始轉換音效檔案...
📋 配置:
  支援格式: .wav, .ogg, .flac, .aac, .m4a, .wma
  目標格式: .mp3
  MP3 位元率: 128k
  備份原檔: 是
  刪除原檔: 是
  更新 TypeScript: 是

✅ FFmpeg 已安裝
版本資訊: ffmpeg version 4.4.2

🔄 處理: sfx_explosion.wav
  原始檔案大小: 328.00 KB
  原始格式: wav
  原始位元率: 1411k
  💾 已備份: sfx_explosion.wav
  ✅ 轉換成功: sfx_explosion.wav -> sfx_explosion.mp3
  轉換後大小: 156.23 KB
  壓縮率: 52.4%
  🗑️  已刪除原檔: sfx_explosion.wav

==================================================
🎵 轉換完成統計
==================================================
📊 總共處理: 1 個檔案
✅ 成功轉換: 1 個檔案
⏭️  跳過檔案: 0 個檔案
❌ 轉換失敗: 0 個檔案

💾 檔案大小統計:
  原始總大小: 328.00 KB
  轉換後總大小: 156.23 KB
  總壓縮率: 52.4%

📋 轉換清單:
  sfx_explosion.wav -> sfx_explosion.mp3
```

## 注意事項

### 檔案備份
- 原檔會自動備份到 `originalAudioAssets/` 目錄
- 轉換失敗時會自動恢復原檔
- 建議在轉換前手動備份重要檔案

### 檔案大小優化
- MP3 格式通常比 WAV 小 50-80%
- 可以調整位元率來平衡品質和檔案大小
- 建議使用 128k 位元率作為平衡點

### 相容性
- MP3 格式具有最佳的瀏覽器相容性
- 支援所有現代瀏覽器和行動裝置
- 檔案大小較小，載入速度更快

### 品質設定
- **位元率**: 64k (低品質) → 320k (高品質)
- **品質參數**: 0 (最高品質) → 9 (最低品質)
- **建議設定**: 128k 位元率 + 品質參數 2

## 故障排除

### FFmpeg 未安裝
```
❌ FFmpeg 未安裝或不在 PATH 中
請安裝 FFmpeg:
  Windows: https://ffmpeg.org/download.html
  macOS: brew install ffmpeg
  Ubuntu: sudo apt install ffmpeg
```

### 檔案權限問題
- 確保有讀取原檔的權限
- 確保有寫入目標目錄的權限
- 確保有刪除檔案的權限

### 轉換失敗
- 檢查檔案是否損壞
- 檢查檔案格式是否支援
- 檢查磁碟空間是否足夠

## 自定義配置

可以根據需求修改配置：

```javascript
// 高品質設定
mp3Settings: {
  bitrate: "320k",
  quality: "0",
  channels: "2",
  sampleRate: "48000"
}

// 小檔案設定
mp3Settings: {
  bitrate: "64k",
  quality: "5",
  channels: "1",
  sampleRate: "22050"
}
``` 