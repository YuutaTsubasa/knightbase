# KnightBase Development Instructions

KnightBase is a SvelteKit + Tauri game development framework that provides a complete foundation for cross-platform game development. This framework includes character systems, stage management, audio/video handling, localization support, and asset management utilities.

**ALWAYS follow these instructions first and only search for additional information if these instructions are incomplete or incorrect.**

## System Requirements and Installation

### Required Dependencies
Install these dependencies in order before proceeding:

1. **Node.js (v18+)**
   ```bash
   # Verify installation
   node --version  # Should show v18.0.0 or higher
   ```

2. **pnpm Package Manager**
   ```bash
   npm install -g pnpm
   pnpm --version  # Should show 8.0.0 or higher
   ```

3. **Rust Toolchain (for Tauri)**
   ```bash
   # Verify installation
   rustc --version  # Should show 1.70.0 or higher
   cargo --version
   ```

4. **FFmpeg (for audio conversion)**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install -y ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html and add to PATH
   
   # Verify installation
   ffmpeg -version
   ```

5. **Tauri System Dependencies (Linux only)**
   ```bash
   sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf pkg-config
   ```

### Project Setup
```bash
# 1. Clone and navigate to repository
git clone <repository-url>
cd knightbase

# 2. Install dependencies - takes ~15 seconds
pnpm install

# 3. Approve build scripts for Sharp and esbuild
pnpm approve-builds
# Select esbuild and sharp, approve both

# 4. Verify TypeScript compilation - takes ~10 seconds
pnpm check
```

## Building and Running

### Web Development
```bash
# Start development server - takes ~2 seconds, NEVER CANCEL
pnpm dev
# ➜ Server runs at http://localhost:1420/
# ➜ Hot reload enabled, changes reflect immediately

# Build web version - takes ~20 seconds, NEVER CANCEL
# NEVER CANCEL: Build takes 20 seconds. Set timeout to 60+ seconds.
pnpm build
# ➜ Output: .svelte-kit/output/ and build/
```

### Tauri Desktop Application
```bash
# CRITICAL: Ensure system dependencies are installed first (see above)

# Start Tauri development - takes 5-8 minutes on first run, NEVER CANCEL
# NEVER CANCEL: First Tauri build takes 8 minutes. Set timeout to 15+ minutes.
pnpm tauri dev
# ➜ Compiles Rust backend and opens desktop window
# ➜ Subsequent runs take ~30 seconds

# Build desktop application - takes 6-10 minutes, NEVER CANCEL  
# NEVER CANCEL: Tauri build takes 10 minutes. Set timeout to 20+ minutes.
pnpm tauri build
# ➜ Creates installers in src-tauri/target/release/bundle/
```

**IMPORTANT BUILD NOTES:**
- **NEVER CANCEL** any build command, especially Tauri builds
- First Tauri compilation downloads 500+ dependencies and takes 8+ minutes
- Subsequent Tauri dev starts take ~30 seconds  
- Web builds are much faster (~20 seconds)
- Always wait for "✓ built" or "Finished" messages

## Asset Management

### Image Conversion (PNG to WebP)
```bash
# Convert PNG images to optimized WebP format - takes ~2 seconds
pnpm convert:images
# ➜ Processes images defined in src/lib/assets/ImageAssets.ts
# ➜ Backs up originals to originalAssets/images/
# ➜ Updates file references automatically
```

### Audio Conversion (Various formats to MP3)
```bash
# Basic audio conversion - takes ~5 seconds
pnpm convert:audios

# Advanced audio conversion with detailed output - takes ~5 seconds  
pnpm convert:audios:advanced
# ➜ Supports: WAV, OGG, FLAC, AAC, M4A → MP3
# ➜ Backs up originals to originalAudioAssets/
# ➜ Updates src/lib/assets/AudioAssets.ts automatically
```

## Validation and Testing

### Manual Validation Workflow
**ALWAYS perform these validation steps after making changes:**

1. **Build Verification**
   ```bash
   pnpm build  # Must complete without errors
   ```

2. **Development Server Test**
   ```bash
   pnpm dev
   # ➜ Navigate to http://localhost:1420/
   # ➜ Click through: Welcome → Title → Main Menu
   # ➜ Test navigation: Battle, Mission, Shop, Settings
   ```

3. **TypeScript Check**
   ```bash
   pnpm check  # Must pass without errors
   ```

4. **Asset Conversion Test**
   ```bash
   pnpm convert:images   # Should complete without errors
   pnpm convert:audios   # Should complete without errors
   ```

### Complete User Scenarios to Test
**ALWAYS test these complete workflows after changes:**

1. **Game Flow Navigation**
   - Start development server
   - Navigate through: Welcome screen → Title screen → Main menu
   - Click each menu button (Battle, Mission, Shop, Settings)
   - Verify no console errors or broken images

2. **Asset Pipeline Validation**
   - Add a test PNG image to static/assets/images/
   - Update src/lib/assets/ImageAssets.ts with new image path
   - Run `pnpm convert:images`
   - Verify WebP conversion and automatic path updates

3. **Tauri Desktop Validation** (if desktop changes made)
   - Run `pnpm tauri dev` (wait 8+ minutes for first build)
   - Verify desktop window opens with game interface
   - Test basic navigation in desktop app

## Project Structure and Key Files

### Core Framework Components
```
src/lib/
├── systems/           # Core game systems
│   ├── AudioManager.ts      # Audio playback and volume control
│   ├── VideoManager.ts      # Video playback management  
│   ├── PlayerStore.ts       # Player data and progression
│   ├── LocalizationStore.ts # Multi-language support
│   ├── StaticDataStore.ts   # CSV data loading
│   └── PopupStore.ts        # Modal/popup management
├── assets/            # Asset definitions and paths
│   ├── ImageAssets.ts       # Image file path registry
│   ├── AudioAssets.ts       # Audio file path registry
│   └── AudioGroupSettings.ts # Audio group configurations
├── components/        # Reusable UI components
│   ├── Button.svelte        # Customizable button component
│   ├── Image.svelte         # Image display component
│   ├── Page.svelte          # Page container component
│   └── mainmenu/           # Main menu specific components
└── utils/             # Helper functions
    ├── Constant.ts          # Application constants
    └── StringUtils.ts       # String manipulation utilities
```

### Asset Organization
```
static/assets/
├── images/           # WebP images (converted from PNG)
├── audios/           # MP3 audio files (converted from various formats)
├── videos/           # Video files
└── staticData/       # CSV game data files
    ├── character.csv        # Character definitions
    ├── stage.csv           # Stage/level data
    ├── localization.csv    # Translation strings
    └── *.csv               # Other game data
```

### Build Configuration
```
src-tauri/            # Tauri (Rust) desktop app configuration
├── Cargo.toml              # Rust dependencies
├── tauri.conf.json         # Tauri app configuration
└── src/                    # Rust source code
```

## Common Development Tasks

### Adding New Game Content
1. **New Character**
   - Add character data to `static/assets/staticData/character.csv`
   - Add character images to `static/assets/images/characters/[name]/`
   - Update `src/lib/assets/ImageAssets.ts` with new image paths
   - Add localization strings to `localization.csv`
   - Run `pnpm convert:images` to optimize images

2. **New Audio Assets**
   - Place audio files in `static/assets/audios/`
   - Update `src/lib/assets/AudioAssets.ts`
   - Update `src/lib/assets/AudioGroupSettings.ts` for grouping
   - Run `pnpm convert:audios` to convert to MP3

3. **New UI Components**
   - Create component in `src/lib/components/`
   - Follow existing component patterns (Button.svelte, Image.svelte)
   - Import and use in page components

### Troubleshooting Common Issues

1. **Tauri Build Fails**
   ```bash
   # Install missing system dependencies
   sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf pkg-config
   ```

2. **Sharp/Image Conversion Issues**
   ```bash
   # Approve Sharp build scripts
   pnpm approve-builds
   # Select 'sharp' and approve
   ```

3. **Audio Conversion Fails**
   ```bash
   # Verify FFmpeg installation
   ffmpeg -version
   # Install if missing (see requirements section)
   ```

4. **TypeScript Errors**
   ```bash
   # Run type checking
   pnpm check
   # Fix reported type errors before proceeding
   ```

## Development Best Practices

### Always Follow These Rules
- **NEVER CANCEL** long-running builds (especially Tauri)
- **ALWAYS** run `pnpm check` before committing changes
- **ALWAYS** test complete user workflows after changes
- **ALWAYS** run asset conversion after adding new assets
- **ALWAYS** verify the development server starts without errors

### Performance Expectations
- `pnpm install`: ~15 seconds
- `pnpm build`: ~20 seconds (web), NEVER CANCEL
- `pnpm tauri dev`: 8 minutes (first run), 30 seconds (subsequent), NEVER CANCEL
- `pnpm tauri build`: 10 minutes, NEVER CANCEL
- `pnpm convert:images`: ~2 seconds
- `pnpm convert:audios`: ~5 seconds
- `pnpm check`: ~10 seconds

### Asset Optimization
- Images: Always convert PNG → WebP using `pnpm convert:images`
- Audio: Always convert to MP3 using `pnpm convert:audios`
- Originals automatically backed up to `originalAssets/` and `originalAudioAssets/`

## Framework Features

### Localization System
- CSV-based translation system in `static/assets/staticData/localization.csv`
- Runtime language switching support
- Managed via `LocalizationStore.ts`

### Audio Management
- Background music and sound effects support
- Volume control and audio grouping
- Format: MP3 (converted automatically)
- Managed via `AudioManager.ts`

### Game Data System
- CSV-based data management for characters, stages, items
- Hot-reloadable in development
- Type-safe data loading via `StaticDataStore.ts`

### Cross-Platform Support
- Web: SvelteKit with static adapter
- Desktop: Tauri (Rust + WebView)
- Shared codebase with platform-specific optimizations

This framework provides a complete foundation for game development with proven build processes, asset pipelines, and development workflows. Always follow these instructions for reliable development experience.