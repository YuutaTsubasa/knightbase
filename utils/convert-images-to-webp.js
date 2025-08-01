import fs from "fs";
import path from "path";
import sharp from "sharp";

const tsPath = path.resolve("src/lib/assets/ImageAssets.ts");
const backupDir = path.resolve("originalAssets");
const exts = [".png", ".jpg", ".jpeg"];

// 建立備份資料夾
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

// 讀取 TypeScript 檔案
let tsContent = fs.readFileSync(tsPath, "utf-8");

// 用正則找出所有圖片路徑
const regex = /(['"])(\/assets\/images\/[^\s'"]+\.(png|jpg|jpeg))\1/g;
let changed = false;
let match;
const converted = [];

while ((match = regex.exec(tsContent)) !== null) {
  const origPath = match[2];
  const ext = path.extname(origPath).toLowerCase();
  if (!exts.includes(ext)) continue;

  const absPath = path.join(process.cwd(), "static", origPath);
  const backupPath = path.join(backupDir, path.basename(origPath));
  const webpName = path.basename(origPath, ext) + ".webp";
  const webpRelPath = path.posix.join(path.dirname(origPath), webpName);
  const webpAbsPath = path.join(process.cwd(), "static", webpRelPath);

  // 備份原檔
  fs.copyFileSync(absPath, backupPath);

  // 轉 webp
  await sharp(absPath)
    .webp({ quality: 90 })
    .toFile(webpAbsPath);

  // 刪除原檔
  fs.unlinkSync(absPath);

  // 替換 ts 檔案內容
  tsContent = tsContent.replace(origPath, webpRelPath);
  changed = true;
  converted.push(`${origPath} -> ${webpRelPath}`);
}

// 寫回 TypeScript 檔案
if (changed) {
  fs.writeFileSync(tsPath, tsContent, "utf-8");
  console.log("ImageAssets.ts updated!");
  converted.forEach(line => console.log(line));
} else {
  console.log("No images converted.");
}