# KnightBase

## 專案簡介

KnightBase 是一個為了未來遊戲開發而建立的基底架構框架專案。本專案提供了完整的遊戲開發框架，包含角色系統、關卡系統、音效管理、本地化支援等功能，讓開發者能夠快速建立新的遊戲專案。

雖然目前還有部分頁面尚未完成，但基本架構已經相當完整，可以作為其他遊戲專案的基礎。

## 素材來源

本專案內的所有素材皆透過 AI 工具生成：

- **程式開發**：悠太翼 (@YuutaTsubasa)
- **程式輔助**：ChatGPT 4o、GitHub Copilot
- **美術素材**：Midjourney
- **音樂素材**：Suno AI
- **音效素材**：ElevenLabs

## 技術架構

- **前端框架**：SvelteKit + TypeScript
- **桌面應用**：Tauri (Rust)
- **建置工具**：Vite
- **包管理器**：pnpm
- **資料格式**：CSV (用於遊戲資料管理)

## 如何啟動本專案

### 系統需求

- Node.js (v18 或更高版本)
- Rust (用於 Tauri)
- pnpm (推薦) 或 npm

### 安裝步驟

1. **複製專案**
   ```bash
   git clone https://github.com/YuutaTsubasa/knightbase.git
   cd knightbase
   ```

2. **安裝依賴套件**
   ```bash
   pnpm install
   # 或使用 npm
   npm install
   ```

3. **啟動開發伺服器**
   ```bash
   pnpm dev
   # 或
   npm run dev
   ```

4. **啟動 Tauri 應用程式**
   ```bash
   pnpm tauri dev
   # 或
   npm run tauri dev
   ```

### 建置專案

```bash
# 建置 Web 版本
pnpm build

# 建置 Tauri 桌面應用程式
pnpm tauri build
```

## 程式觀點：專案架構

### 系統架構

專案採用模組化設計，主要系統包含：

#### 核心系統 (`src/lib/systems/`)

- **AudioManager.ts** - 音效管理系統，支援音量控制、音效分組
- **VideoManager.ts** - 影片播放管理系統
- **PlayerStore.ts** - 玩家資料管理，包含等級、經驗值、設定等
- **LocalizationStore.ts** - 多語言本地化系統
- **StaticDataStore.ts** - 靜態遊戲資料管理 (CSV 資料載入)
- **PopupStore.ts** - 彈窗系統管理
- **Orientation.ts** - 螢幕方向管理

#### 資產管理 (`src/lib/assets/`)

- **ImageAssets.ts** - 圖片資產路徑定義
- **AudioAssets.ts** - 音效資產路徑定義
- **VideoAssets.ts** - 影片資產路徑定義
- **FontAssets.ts** - 字體資產定義
- **AudioGroupSettings.ts** - 音效分組設定

#### 可用元件 (`src/lib/components/`)

**基礎 UI 元件**：
- `Button.svelte` - 可自訂的按鈕元件
- `Image.svelte` - 圖片顯示元件
- `Video.svelte` - 影片播放元件
- `Page.svelte` - 頁面容器元件
- `Topbar.svelte` - 頂部導航列
- `StatusBox.svelte` - 狀態顯示框
- `SpaceBetweenTextGroup.svelte` - 文字間距元件

**專用元件**：
- `mainmenu/` - 主選單相關元件
  - `BannerCarousel.svelte` - 輪播橫幅
  - `MainMenuButtonGroup.svelte` - 主選單按鈕群組
  - `PlayerInfoBox.svelte` - 玩家資訊顯示
  - `ResourceBar.svelte` - 資源條顯示
- `popup/` - 彈窗系統元件

#### 動畫系統 (`src/lib/animations/`)

- `transitions/` - 轉場動畫元件
  - `FadeTransitionComponent.ts` - 淡入淡出效果
  - `ScaleHeightTransitionComponent.ts` - 高度縮放效果

#### 工具函數 (`src/lib/utils/`)

- **Constant.ts** - 常數定義
- **StringUtils.ts** - 字串處理工具
- **Wait.ts** - 延遲執行工具

### 資料驗證架構

專案使用 CSV 檔案來管理遊戲資料，所有資料檔案位於 `static/assets/staticData/`：

- `character.csv` - 角色基本屬性
- `stage.csv` - 關卡資訊
- `item.csv` - 道具資料
- `equipment.csv` - 裝備資料
- `mission.csv` - 任務資料
- `localization.csv` - 多語言文字

## 企劃觀點：如何新增角色與關卡

### 新增角色

1. **編輯角色資料**
   在 `static/assets/staticData/character.csv` 中新增角色資料：
   ```csv
   characterId,characterNameKey,characterDescriptionKey,BaseHp,BaseSp,BaseAtk,BaseDef,BaseSkillCd
   newCharacter,newCharacterName,newCharacterDescription,3000,150,350,250,10
   ```

2. **準備角色圖片**
   在 `static/assets/images/characters/` 建立角色資料夾，例如 `newCharacter/`，並放入：
   - `newCharacterPortrait.png` - 角色肖像
   - `newCharacterRun.png` - 跑步動畫
   - `newCharacterJump.png` - 跳躍動畫
   - `newCharacterAttack.png` - 攻擊動畫
   - `newCharacterAttackEffect.png` - 攻擊特效

3. **更新圖片資產**
   在 `src/lib/assets/ImageAssets.ts` 中新增角色圖片路徑：
   ```typescript
   newCharacterPortrait: '/assets/images/characters/newCharacter/newCharacterPortrait.webp',
   newCharacterRun: '/assets/images/characters/newCharacter/newCharacterRun.webp',
   // ... 其他動畫圖片
   ```

4. **新增本地化文字**
   在 `static/assets/staticData/localization.csv` 中新增角色名稱和描述：
   ```csv
   newCharacterName,zh,新角色名稱
   newCharacterDescription,zh,新角色的詳細描述
   ```

### 新增關卡

1. **編輯關卡資料**
   在 `static/assets/staticData/stage.csv` 中新增關卡：
   ```csv
   id,nameKey,iconSvg,descriptionKey,groundOffsetY
   newStage,newStageName,"<svg>...</svg>",newStageDescription,-140
   ```

2. **準備關卡背景**
   將關卡背景圖片放入 `static/assets/images/`：
   - `newStageBackground.png`

3. **更新圖片資產**
   在 `src/lib/assets/ImageAssets.ts` 中新增背景圖片：
   ```typescript
   newStageBackground: '/assets/images/newStageBackground.webp',
   ```

4. **新增本地化文字**
   在 `localization.csv` 中新增關卡名稱和描述。

## 美術觀點：資產管理

### 資產檔案結構

```
static/assets/
├── images/           # 圖片資源
│   ├── characters/   # 角色圖片
│   │   ├── yuuta/   # 各角色資料夾
│   │   └── alice/
│   └── *.webp       # 其他遊戲圖片
├── audios/          # 音效檔案
├── videos/          # 影片檔案
├── fonts/           # 字體檔案
└── staticData/      # 遊戲資料 CSV
```

### 圖片格式要求

- **建議格式**：PNG (原始素材)
- **最終格式**：WebP (經過壓縮優化)
- **命名規則**：使用駝峰式命名，例如 `characterPortrait.png`

### 自動圖片轉換

專案提供自動將 PNG 轉換為 WebP 的工具：

```bash
# 執行圖片轉換
pnpm convert:images
```

**轉換流程**：
1. 自動掃描 `src/lib/assets/ImageAssets.ts` 中定義的圖片路徑
2. 尋找對應的 PNG 檔案
3. 使用 Sharp 函式庫轉換為 WebP 格式
4. 自動備份原始檔案到 `originalAssets/` 資料夾
5. 更新 ImageAssets.ts 中的檔案路徑

**手動新增圖片步驟**：
1. 將 PNG 圖片放入對應的 `static/assets/images/` 資料夾
2. 在 `ImageAssets.ts` 中新增圖片路徑 (使用 .png 副檔名)
3. 執行 `pnpm convert:images` 進行轉換
4. 圖片路徑會自動更新為 .webp

## 音樂音效觀點：音效資產管理

### 音效格式要求

- **支援格式**：WAV, OGG, FLAC, AAC, M4A
- **最終格式**：MP3 (統一格式)
- **建議規格**：44.1kHz, 立體聲

### 自動音效轉換

專案提供兩種音效轉換工具：

#### 基本轉換
```bash
pnpm convert:audios
```

#### 進階轉換（更好的音質控制）
```bash
pnpm convert:audios:advanced
```

**轉換流程**：
1. 掃描 `static/assets/audios/` 資料夾中的音效檔案
2. 使用 FFmpeg 轉換為 MP3 格式
3. 自動備份原始檔案到 `originalAudioAssets/` 資料夾
4. 更新 `AudioAssets.ts` 中的檔案路徑

### 音效資產註冊

在 `src/lib/assets/AudioAssets.ts` 中註冊新的音效：

```typescript
export const audioAssets: Record<string, string> = {
  bgmMainMenu: '/assets/audios/bgmMainMenu.mp3',
  sfxButtonClick: '/assets/audios/sfxButtonClick.mp3',
  // 新增音效
  newSoundEffect: '/assets/audios/newSoundEffect.mp3',
};
```

### 音效分組管理

在 `src/lib/assets/AudioGroupSettings.ts` 中設定音效分組：

```typescript
export const audioGroupSettings = {
  bgm: ['bgmMainMenu', 'bgmBattle'],
  sfx: ['sfxButtonClick', 'sfxAttack'],
};
```

## 開發工具

### 實用指令

```bash
# 開發
pnpm dev              # 啟動開發伺服器
pnpm tauri dev        # 啟動 Tauri 開發模式

# 建置
pnpm build            # 建置 Web 版本
pnpm tauri build      # 建置桌面應用程式

# 檢查
pnpm check            # TypeScript 型別檢查
pnpm check:watch      # 監聽模式型別檢查

# 資產轉換
pnpm convert:images   # 轉換圖片為 WebP
pnpm convert:audios   # 轉換音效為 MP3
```

### 建議開發環境

**推薦 IDE**：[VS Code](https://code.visualstudio.com/)

**推薦擴充套件**：
- [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) 
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [TypeScript Importer](https://marketplace.visualstudio.com/items?itemName=pmneo.tsimporter)

## 專案狀態

- ✅ 基本架構完成
- ✅ 核心系統實作
- ✅ 資產管理系統
- ✅ 多語言支援
- 🚧 部分頁面仍在開發中
- 🚧 遊戲玩法系統持續優化

## 授權

本專案採用 [MIT License](LICENSE) 授權。

## 貢獻指南

歡迎提交 Issue 和 Pull Request 來改善這個專案！

1. Fork 此專案
2. 建立新的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

---

**KnightBase** - 為未來遊戲開發而生的框架專案
