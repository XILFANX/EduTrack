const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const SOURCE = 'C:\\Users\\jxilf\\.gemini\\antigravity-ide\\brain\\fa50a91e-889f-48f3-a098-64cdd571c74c\\media__1786026937893.png'
const PUBLIC = path.join(__dirname, '..', 'apps', 'web', 'public')

const SIZES = [
  { name: 'logo.png', size: 512 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-180x180.png', size: 180 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-72x72.png', size: 72 },
  { name: 'apple-icon.png', size: 180 },
  { name: 'apple-touch-icon.png', size: 180 },
]

async function main() {
  for (const { name, size } of SIZES) {
    const dest = path.join(PUBLIC, name)
    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(dest)
    console.log(`✓ ${name} (${size}x${size})`)
  }
  console.log('\nAll icons generated.')
}

main().catch(console.error)
