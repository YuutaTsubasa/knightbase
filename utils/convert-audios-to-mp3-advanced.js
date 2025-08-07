import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// 配置選項
const config = {
  audioDir: path.resolve("static/assets/audios"),
  backupDir: path.resolve("originalAssets/audios"),
  tsPath: path.resolve("src/lib/assets/AudioAssets.ts"),
  supportedFormats: [".wav", ".ogg", ".flac", ".aac", ".m4a", ".wma"],
  targetFormat: ".mp3",
  // MP3 編碼設定
  mp3Settings: {
    bitrate: "128k",        // 位元率
    quality: "2",           // 品質 (0-9, 2 是很好的平衡)
    channels: "2",          // 聲道數
    sampleRate: "44100"     // 採樣率
  },
  // 備份設定
  backup: true,
  // 是否刪除原檔
  deleteOriginal: true,
  // 是否更新 TypeScript 檔案
  updateTypeScript: true,
  // 是否顯示詳細資訊
  verbose: true
};

// 建立備份資料夾
if (!fs.existsSync(config.backupDir)) {
  fs.mkdirSync(config.backupDir, { recursive: true });
}

// 檢查 FFmpeg 是否可用
async function checkFFmpeg() {
  try {
    const { stdout } = await execAsync("ffmpeg -version");
    if (config.verbose) {
      console.log("✅ FFmpeg 已安裝");
      console.log("版本資訊:", stdout.split('\n')[0]);
    }
    return true;
  } catch (error) {
    console.error("❌ FFmpeg 未安裝或不在 PATH 中");
    console.error("請安裝 FFmpeg:");
    console.error("  Windows: https://ffmpeg.org/download.html");
    console.error("  macOS: brew install ffmpeg");
    console.error("  Ubuntu: sudo apt install ffmpeg");
    return false;
  }
}

// 獲取檔案資訊
async function getAudioInfo(filePath) {
  try {
    const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`);
    return JSON.parse(stdout);
  } catch (error) {
    console.error(`❌ 無法獲取檔案資訊: ${filePath}`);
    return null;
  }
}

// 轉換音效檔案
async function convertAudio(inputPath, outputPath, originalInfo = null) {
  try {
    // 根據原始檔案資訊調整編碼參數
    let command = `ffmpeg -i "${inputPath}"`;
    
    // 添加音訊編碼參數
    command += ` -c:a libmp3lame`;
    command += ` -b:a ${config.mp3Settings.bitrate}`;
    command += ` -q:a ${config.mp3Settings.quality}`;
    command += ` -ar ${config.mp3Settings.sampleRate}`;
    command += ` -ac ${config.mp3Settings.channels}`;
    command += ` -y "${outputPath}"`;

    if (config.verbose) {
      console.log(`🔄 執行命令: ${command}`);
    }

    await execAsync(command);
    return true;
  } catch (error) {
    console.error(`❌ 轉換失敗: ${inputPath}`);
    console.error(error.message);
    return false;
  }
}

// 讀取 TypeScript 檔案
function readAudioAssets() {
  if (!fs.existsSync(config.tsPath)) {
    console.error("❌ AudioAssets.ts 檔案不存在");
    return null;
  }
  return fs.readFileSync(config.tsPath, "utf-8");
}

// 更新 TypeScript 檔案中的路徑
function updateAudioAssets(tsContent, conversions) {
  let updatedContent = tsContent;
  let changed = false;

  conversions.forEach(({ oldPath, newPath }) => {
    const oldUrl = `/assets/audios/${oldPath}`;
    const newUrl = `/assets/audios/${newPath}`;
    
    if (updatedContent.includes(oldUrl)) {
      updatedContent = updatedContent.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
      changed = true;
      console.log(`📝 更新路徑: ${oldUrl} -> ${newUrl}`);
    }
  });

  return { content: updatedContent, changed };
}

// 顯示檔案大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 獲取檔案大小
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

// 主函數
async function main() {
  console.log("🎵 開始轉換音效檔案...");
  console.log("📋 配置:");
  console.log(`  支援格式: ${config.supportedFormats.join(', ')}`);
  console.log(`  目標格式: ${config.targetFormat}`);
  console.log(`  MP3 位元率: ${config.mp3Settings.bitrate}`);
  console.log(`  備份原檔: ${config.backup ? '是' : '否'}`);
  console.log(`  刪除原檔: ${config.deleteOriginal ? '是' : '否'}`);
  console.log(`  更新 TypeScript: ${config.updateTypeScript ? '是' : '否'}`);
  console.log("");

  // 檢查 FFmpeg
  if (!(await checkFFmpeg())) {
    process.exit(1);
  }

  // 讀取 TypeScript 檔案
  const tsContent = config.updateTypeScript ? readAudioAssets() : null;
  if (config.updateTypeScript && !tsContent) {
    process.exit(1);
  }

  // 掃描音效目錄
  const audioFiles = fs.readdirSync(config.audioDir);
  const conversions = [];
  const converted = [];
  const skipped = [];
  const failed = [];

  let totalOriginalSize = 0;
  let totalConvertedSize = 0;

  for (const file of audioFiles) {
    const ext = path.extname(file).toLowerCase();
    
    // 跳過已經是 MP3 的檔案
    if (ext === config.targetFormat) {
      skipped.push(file);
      console.log(`⏭️  跳過 MP3 檔案: ${file}`);
      continue;
    }

    // 檢查是否為支援的格式
    if (!config.supportedFormats.includes(ext)) {
      skipped.push(file);
      console.log(`⏭️  跳過不支援的格式: ${file}`);
      continue;
    }

    const inputPath = path.join(config.audioDir, file);
    const outputName = path.basename(file, ext) + config.targetFormat;
    const outputPath = path.join(config.audioDir, outputName);
    const backupPath = path.join(config.backupDir, file);

    console.log(`\n🔄 處理: ${file}`);
    
    // 獲取原始檔案資訊
    const originalInfo = await getAudioInfo(inputPath);
    const originalSize = getFileSize(inputPath);
    totalOriginalSize += originalSize;

    if (config.verbose && originalInfo) {
      const format = originalInfo.format;
      console.log(`  原始檔案大小: ${formatFileSize(originalSize)}`);
      console.log(`  原始格式: ${format.format_name}`);
      console.log(`  原始位元率: ${format.bit_rate ? Math.round(format.bit_rate / 1000) + 'k' : '未知'}`);
    }

    // 備份原檔
    if (config.backup) {
      fs.copyFileSync(inputPath, backupPath);
      console.log(`  💾 已備份: ${file}`);
    }

    // 轉換檔案
    const success = await convertAudio(inputPath, outputPath, originalInfo);
    
    if (success) {
      const convertedSize = getFileSize(outputPath);
      totalConvertedSize += convertedSize;
      
      if (config.verbose) {
        console.log(`  ✅ 轉換成功: ${file} -> ${outputName}`);
        console.log(`  轉換後大小: ${formatFileSize(convertedSize)}`);
        const compressionRatio = ((originalSize - convertedSize) / originalSize * 100).toFixed(1);
        console.log(`  壓縮率: ${compressionRatio}%`);
      } else {
        console.log(`  ✅ ${file} -> ${outputName}`);
      }
      
      // 刪除原檔
      if (config.deleteOriginal) {
        fs.unlinkSync(inputPath);
        console.log(`  🗑️  已刪除原檔: ${file}`);
      }
      
      conversions.push({
        oldPath: file,
        newPath: outputName
      });
      converted.push(`${file} -> ${outputName}`);
    } else {
      failed.push(file);
      console.log(`  ❌ 轉換失敗: ${file}`);
      
      // 轉換失敗，恢復原檔
      if (config.backup) {
        fs.copyFileSync(backupPath, inputPath);
        console.log(`  🔄 已恢復原檔: ${file}`);
      }
    }
  }

  // 更新 TypeScript 檔案
  if (config.updateTypeScript && conversions.length > 0) {
    const { content: updatedContent, changed } = updateAudioAssets(tsContent, conversions);
    
    if (changed) {
      fs.writeFileSync(config.tsPath, updatedContent, "utf-8");
      console.log("\n📝 AudioAssets.ts 已更新!");
    }
  }

  // 輸出統計結果
  console.log("\n" + "=".repeat(50));
  console.log("🎵 轉換完成統計");
  console.log("=".repeat(50));
  console.log(`📊 總共處理: ${audioFiles.length} 個檔案`);
  console.log(`✅ 成功轉換: ${converted.length} 個檔案`);
  console.log(`⏭️  跳過檔案: ${skipped.length} 個檔案`);
  console.log(`❌ 轉換失敗: ${failed.length} 個檔案`);
  
  if (converted.length > 0) {
    console.log(`\n💾 檔案大小統計:`);
    console.log(`  原始總大小: ${formatFileSize(totalOriginalSize)}`);
    console.log(`  轉換後總大小: ${formatFileSize(totalConvertedSize)}`);
    const totalCompressionRatio = ((totalOriginalSize - totalConvertedSize) / totalOriginalSize * 100).toFixed(1);
    console.log(`  總壓縮率: ${totalCompressionRatio}%`);
  }

  if (converted.length > 0) {
    console.log(`\n📋 轉換清單:`);
    converted.forEach(line => console.log(`  ${line}`));
  }

  if (failed.length > 0) {
    console.log(`\n❌ 失敗清單:`);
    failed.forEach(file => console.log(`  ${file}`));
  }

  if (converted.length === 0 && failed.length === 0) {
    console.log("✨ 沒有需要轉換的檔案");
  }
}

// 執行主函數
main().catch(error => {
  console.error("❌ 執行失敗:", error);
  process.exit(1);
}); 