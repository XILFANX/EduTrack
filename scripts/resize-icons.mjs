/**
 * resize-icons.mjs
 * Resizes EduTrack and EstateTrack logos to all required PWA icon sizes.
 * Uses sharp (already a transitive dep via Next.js image optimisation).
 * Run from: apps/web/  →  node ../../scripts/resize-icons.mjs
 */

import sharp from 'sharp'
import { copyFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Source logos (absolute paths) ─────────────────────────────────────────────
const EDUTRACK_SRC  = 'C:\\Users\\jxilf\\.gemini\\antigravity-ide\\brain\\dcf24f39-ecb9-41b5-86b9-517928c1726a\\media__1786189633500.png'
const ESTATETRACK_SRC = 'C:\\Users\\jxilf\\.gemini\\antigravity-ide\\brain\\dcf24f39-ecb9-41b5-86b9-517928c1726a\\media__1786189623033.png'

// ── Output directory ───────────────────────────────────────────────────────────
const PUBLIC = path.resolve(__dirname, '../apps/web/public')

// ── EduTrack icon sizes ────────────────────────────────────────────────────────
const EDUTRACK_ICONS = [
  { size: 72,  name: 'icon-72x72.png'   },
  { size: 96,  name: 'icon-96x96.png'   },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 180, name: 'icon-180x180.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 512, name: 'logo.png'         },  // main logo reference
  { size: 180, name: 'apple-icon.png'   },
  { size: 180, name: 'apple-touch-icon.png' },
]

async function resizeIcon(src, size, destPath) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 10, g: 22, b: 40, alpha: 1 } })
    .png({ quality: 100 })
    .toFile(destPath)
  console.log(`  ✓ ${path.basename(destPath)} (${size}×${size})`)
}

async function run() {
  console.log('\n── EduTrack icons ────────────────────────────────────')
  for (const { size, name } of EDUTRACK_ICONS) {
    await resizeIcon(EDUTRACK_SRC, size, path.join(PUBLIC, name))
  }

  console.log('\n── EstateTrack icon ──────────────────────────────────')
  await resizeIcon(ESTATETRACK_SRC, 512, path.join(PUBLIC, 'EstateTrack.png'))

  console.log('\n── Purging unused Next.js default SVGs ───────────────')
  const toDelete = ['file.svg', 'globe.svg', 'next.svg', 'vercel.svg', 'window.svg']
  for (const f of toDelete) {
    const p = path.join(PUBLIC, f)
    if (existsSync(p)) {
      const { unlink } = await import('fs/promises')
      await unlink(p)
      console.log(`  🗑  deleted ${f}`)
    } else {
      console.log(`  – ${f} not found, skipping`)
    }
  }

  console.log('\n✅ All icons written to apps/web/public/\n')
}

run().catch(e => { console.error(e); process.exit(1) })
