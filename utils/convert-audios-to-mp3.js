import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const audioDir = path.resolve("static/assets/audios");
const backupDir = path.resolve("originalAudioAssets");
const tsPath = path.resolve("src/lib/assets/AudioAssets.ts");

// 支援的音效格式
const supportedFormats = [".wav", ".ogg", ".flac", ".aac", ".m4a"];
const targetFormat = ".mp3";

// 建立備份資料夾
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 檢查 ffmpeg 是否可用
async function checkFFmpeg() {
  try {
    await execAsync("ffmpeg -version");
    return true;
  } catch (error) {
    console.error("❌ FFmpeg 未安裝或不在 PATH 中");
    console.error("請安裝 FFmpeg: https://ffmpeg.org/download.html");
    return false;
  }
}

// 轉換音效檔案
async function convertAudio(inputPath, outputPath) {
  try {
    const command = `ffmpeg -i "${inputPath}" -c:a libmp3lame -b:a 128k -y "${outputPath}"`;
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
  if (!fs.existsSync(tsPath)) {
    console.error("❌ AudioAssets.ts 檔案不存在");
    return null;
  }
  return fs.readFileSync(tsPath, "utf-8");
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

// 主函數
async function main() {
  console.log("🎵 開始轉換音效檔案...");

  // 檢查 FFmpeg
  if (!(await checkFFmpeg())) {
    process.exit(1);
  }

  // 讀取 TypeScript 檔案
  const tsContent = readAudioAssets();
  if (!tsContent) {
    process.exit(1);
  }

  // 掃描音效目錄
  const audioFiles = fs.readdirSync(audioDir);
  const conversions = [];
  const converted = [];

  for (const file of audioFiles) {
    const ext = path.extname(file).toLowerCase();
    
    // 跳過已經是 MP3 的檔案
    if (ext === targetFormat) {
      console.log(`⏭️  跳過 MP3 檔案: ${file}`);
      continue;
    }

    // 檢查是否為支援的格式
    if (!supportedFormats.includes(ext)) {
      console.log(`⏭️  跳過不支援的格式: ${file}`);
      continue;
    }

    const inputPath = path.join(audioDir, file);
    const outputName = path.basename(file, ext) + targetFormat;
    const outputPath = path.join(audioDir, outputName);
    const backupPath = path.join(backupDir, file);

    console.log(`🔄 轉換: ${file} -> ${outputName}`);

    // 備份原檔
    fs.copyFileSync(inputPath, backupPath);
    console.log(`💾 備份: ${file}`);

    // 轉換檔案
    const success = await convertAudio(inputPath, outputPath);
    
    if (success) {
      // 刪除原檔
      fs.unlinkSync(inputPath);
      console.log(`✅ 轉換成功: ${file} -> ${outputName}`);
      
      conversions.push({
        oldPath: file,
        newPath: outputName
      });
      converted.push(`${file} -> ${outputName}`);
    } else {
      // 轉換失敗，恢復原檔
      fs.copyFileSync(backupPath, inputPath);
      console.log(`❌ 轉換失敗，已恢復原檔: ${file}`);
    }
  }

  // 更新 TypeScript 檔案
  if (conversions.length > 0) {
    const { content: updatedContent, changed } = updateAudioAssets(tsContent, conversions);
    
    if (changed) {
      fs.writeFileSync(tsPath, updatedContent, "utf-8");
      console.log("📝 AudioAssets.ts 已更新!");
    }
  }

  // 輸出結果
  console.log("\n🎵 轉換完成!");
  console.log(`📊 總共轉換了 ${converted.length} 個檔案:`);
  converted.forEach(line => console.log(`  ${line}`));
  
  if (converted.length === 0) {
    console.log("✨ 沒有需要轉換的檔案");
  }
}

// 執行主函數
main().catch(error => {
  console.error("❌ 執行失敗:", error);
  process.exit(1);
}); 