import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

// Standard icon SVG
const iconSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f59e0b"/>
      <stop offset="100%" style="stop-color:#ea580c"/>
    </linearGradient>
    <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#fef3c7"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bgGradient)"/>
  <path d="M256 80C186.144 80 130 136.144 130 206C130 293.5 256 432 256 432C256 432 382 293.5 382 206C382 136.144 325.856 80 256 80Z" fill="url(#pinGradient)" stroke="white" stroke-width="8"/>
  <circle cx="256" cy="200" r="56" fill="url(#bgGradient)" stroke="white" stroke-width="4"/>
  <rect x="232" y="172" width="12" height="56" rx="3" fill="white"/>
  <rect x="252" y="172" width="12" height="56" rx="3" fill="white"/>
  <rect x="272" y="172" width="12" height="40" rx="3" fill="white"/>
</svg>`;

// Maskable icon SVG (with padding for safe zone - content in inner 80%)
const maskableSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f59e0b"/>
      <stop offset="100%" style="stop-color:#ea580c"/>
    </linearGradient>
    <linearGradient id="pinGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#fef3c7"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bgGradient2)"/>
  <g transform="translate(51, 51) scale(0.8)">
    <path d="M256 80C186.144 80 130 136.144 130 206C130 293.5 256 432 256 432C256 432 382 293.5 382 206C382 136.144 325.856 80 256 80Z" fill="url(#pinGradient2)" stroke="white" stroke-width="10"/>
    <circle cx="256" cy="200" r="56" fill="url(#bgGradient2)" stroke="white" stroke-width="5"/>
    <rect x="232" y="172" width="12" height="56" rx="3" fill="white"/>
    <rect x="252" y="172" width="12" height="56" rx="3" fill="white"/>
    <rect x="272" y="172" width="12" height="40" rx="3" fill="white"/>
  </g>
</svg>`;

async function generateIcon(svg, size, filename) {
  const buffer = Buffer.from(svg);
  await sharp(buffer)
    .resize(size, size)
    .png()
    .toFile(join(iconsDir, filename));
  console.log(`Generated: ${filename}`);
}

async function main() {
  try {
    // Ensure icons directory exists
    await mkdir(iconsDir, { recursive: true });

    // Generate standard icons
    await generateIcon(iconSvg, 192, 'icon-192.png');
    await generateIcon(iconSvg, 512, 'icon-512.png');

    // Generate maskable icons
    await generateIcon(maskableSvg, 192, 'icon-maskable-192.png');
    await generateIcon(maskableSvg, 512, 'icon-maskable-512.png');

    // Also generate apple touch icon
    await generateIcon(iconSvg, 180, 'apple-touch-icon.png');

    // Generate favicon
    await generateIcon(iconSvg, 32, 'favicon-32.png');
    await generateIcon(iconSvg, 16, 'favicon-16.png');

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();
