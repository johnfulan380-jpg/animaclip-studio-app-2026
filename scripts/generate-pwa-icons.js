import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const publicDir = path.resolve('public');
  const svgPath = path.join(publicDir, 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating PWA icons for PWABuilder from', svgPath);

  // 1. icon-192.png (192x192)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Created icon-192.png');

  // Also copy to pwa-192x192.png for backward compat
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 2. icon-512.png (512x512 with safe-zone padding for "any maskable")
  const innerIcon512 = await sharp(svgBuffer)
    .resize(410, 410)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 15, b: 15, alpha: 1 }, // #0f0f0f dark background matching manifest
    },
  })
    .composite([{ input: innerIcon512, top: 51, left: 51 }])
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Created icon-512.png (maskable safe zone)');

  // Also update pwa-512x512.png & pwa-maskable-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 15, b: 15, alpha: 1 },
    },
  })
    .composite([{ input: innerIcon512, top: 51, left: 51 }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('All PWA icons generated successfully for PWABuilder!');
}

generateIcons().catch(console.error);
