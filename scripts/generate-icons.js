const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Source logo (assuming you have a high-res logo at this path)
const sourceImage = path.join(__dirname, '../public/applogo.png');

// Define all the icon sizes we need
const icons = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 }
];

// Generate each icon
async function generateIcons() {
  for (const icon of icons) {
    await sharp(sourceImage)
      .resize(icon.size, icon.size)
      .toFile(path.join(iconsDir, icon.name));
    
    console.log(`Generated ${icon.name}`);
  }
  
  console.log('All icons generated successfully!');
}

// Run the generation
generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});