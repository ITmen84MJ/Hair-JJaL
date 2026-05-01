/**
 * PNG 아이콘 생성 스크립트
 * SVG를 기반으로 192×192, 512×512 PNG 아이콘을 생성합니다.
 *
 * 실행: node scripts/generate-icons.mjs
 * 필요 패키지: npm install -D sharp   (또는 아래 대체 방법 참고)
 *
 * sharp가 없는 경우 아래 온라인 도구로 직접 변환 가능:
 *   https://svg2png.com  또는  https://cloudconvert.com/svg-to-png
 *   public/icon.svg → 192×192 → public/icon-192.png
 *   public/icon.svg → 512×512 → public/icon-512.png
 *   public/icon.svg → 180×180 → public/apple-touch-icon.png
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

let sharp;
try {
  const m = await import('sharp');
  sharp = m.default;
} catch {
  console.log('');
  console.log('⚠️  sharp 패키지가 없습니다. 아이콘을 수동으로 변환해주세요:');
  console.log('');
  console.log('  1. npm install -D sharp  후 다시 실행하거나,');
  console.log('  2. https://cloudconvert.com/svg-to-png 에서');
  console.log('     public/icon.svg를 아래 3가지 크기로 변환하세요:');
  console.log('     • 192×192  →  public/icon-192.png');
  console.log('     • 512×512  →  public/icon-512.png');
  console.log('     • 180×180  →  public/apple-touch-icon.png');
  console.log('');
  process.exit(0);
}

const svgBuffer = readFileSync(resolve(publicDir, 'icon.svg'));

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

for (const { size, name } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve(publicDir, name));
  console.log(`✅ public/${name} 생성 완료`);
}
