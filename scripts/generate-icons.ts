import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sourceIcon = path.join(rootDir, 'client/public/icon-512.png');
const outputDir = path.join(rootDir, 'client/public/app-icons');

const BRAND_COLOR = '#1e3a5f';

const iconSizes = [20, 29, 40, 60, 76, 83, 1024];

const splashScreens = [
  { name: 'splash-2732x2732.png', width: 2732, height: 2732 },
  { name: 'splash-1284x2778.png', width: 1284, height: 2778 },
  { name: 'splash-2778x1284.png', width: 2778, height: 1284 },
];

async function generateIcons() {
  console.log('Generating app icons...');
  for (const size of iconSizes) {
    const filename = size === 83 ? 'icon-83.5.png' : `icon-${size}.png`;
    await sharp(sourceIcon)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(outputDir, filename));
    console.log(`  Created ${filename} (${size}x${size})`);
  }
}

async function generateSplashScreens() {
  console.log('Generating splash screens...');
  const logoSize = 512;

  for (const splash of splashScreens) {
    const background = await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 4,
        background: BRAND_COLOR,
      },
    }).png().toBuffer();

    const logo = await sharp(sourceIcon)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const left = Math.round((splash.width - logoSize) / 2);
    const top = Math.round((splash.height - logoSize) / 2);

    await sharp(background)
      .composite([{ input: logo, left, top }])
      .png()
      .toFile(path.join(outputDir, splash.name));

    console.log(`  Created ${splash.name} (${splash.width}x${splash.height})`);
  }
}

async function main() {
  await generateIcons();
  await generateSplashScreens();
  console.log('Done! All assets generated in client/public/app-icons/');
}

main().catch(console.error);
