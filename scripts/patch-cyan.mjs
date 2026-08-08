/**
 * patch-cyan.mjs
 * Replaces all remaining design-time cyan-600/cyan-700 colour tokens
 * with the brand electric-blue (#1D6FEB) equivalents across all TSX files.
 *
 * Rules:
 *  bg-cyan-600  → replaced with inline style background where possible
 *  text-cyan-600/dark:text-cyan-400 → kept (they resolve to the same hue now via CSS vars)
 *  Only action buttons/badges that are brand-primary colours get hard-coded electric-blue
 *
 * This script does STRING replacement on the Tailwind class level only.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import path from 'path'

const ROOT = 'C:\\Users\\jxilf\\OneDrive\\Desktop\\EduTrack\\apps\\web'

const REPLACEMENTS = [
  // Primary action button backgrounds — switch from cyan-600 to electric-blue
  // We do simple class-level substitution that Tailwind JIT can still pick up
  // Note: text-cyan-* stays — it maps correctly to the CSS var now
  ['bg-cyan-600 hover:bg-cyan-700', 'bg-[#1D6FEB] hover:bg-[#1558C8]'],
  ['bg-cyan-600 hover:bg-cyan-600', 'bg-[#1D6FEB] hover:bg-[#1558C8]'],
  // Unread dot
  ["bg-cyan-600'", "bg-[#1D6FEB]'"],
  // Message bubble sent side
  ["bg-cyan-600 text-white rounded-br-sm'", "bg-[#1D6FEB] text-white rounded-br-sm'"],
  ["bg-cyan-600 text-white rounded-br-sm\"", "bg-[#1D6FEB] text-white rounded-br-sm\""],
  // Toggle on state
  ["? 'bg-cyan-600'", "? 'bg-[#1D6FEB]'"],
  ['? "bg-cyan-600"', '? "bg-[#1D6FEB]"'],
  // Notification bell dot
  ["bg-cyan-600'}", "bg-[#1D6FEB]'}"],
  // Round send button
  ["bg-cyan-600 text-white disabled:opacity-50 hover:bg-cyan-700", "bg-[#1D6FEB] text-white disabled:opacity-50 hover:bg-[#1558C8]"],
  // Students client hero banner
  ["from-cyan-600 to-cyan-600", "from-[#1D6FEB] to-[#1558C8]"],
  // Student profile hero banner
  ["from-cyan-600 to-blue-500", "from-[#1D6FEB] to-[#22D3EE]"],
  // Messages layout active thread
  ["bg-cyan-600 text-white shadow-md'", "bg-[#1D6FEB] text-white shadow-md'"],
  // Messaging policies save button
  ["bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-60 shadow-sm", "bg-[#1D6FEB] hover:bg-[#1558C8] text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-60 shadow-sm"],
  // Enroll modal step indicator selected
  ["border-cyan-600 bg-cyan-600 text-white'", "border-[#1D6FEB] bg-[#1D6FEB] text-white'"],
]

function walk(dir, cb) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) {
      if (['node_modules', '.next', '.git'].includes(name)) continue
      walk(full, cb)
    } else if (name.endsWith('.tsx') || name.endsWith('.ts')) {
      cb(full)
    }
  }
}

let totalFiles = 0
let patchedFiles = 0
let totalPatches = 0

walk(ROOT, (file) => {
  totalFiles++
  let src = readFileSync(file, 'utf8')
  let changed = false
  let filePatches = 0

  for (const [from, to] of REPLACEMENTS) {
    if (src.includes(from)) {
      src = src.split(from).join(to)
      filePatches++
      totalPatches++
      changed = true
    }
  }

  if (changed) {
    writeFileSync(file, src, 'utf8')
    console.log(`  ✓ ${file.replace(ROOT, '').replace(/\\/g, '/')} — ${filePatches} patch(es)`)
    patchedFiles++
  }
})

console.log(`\n✅ Done. Scanned ${totalFiles} files, patched ${patchedFiles}, total replacements: ${totalPatches}\n`)
