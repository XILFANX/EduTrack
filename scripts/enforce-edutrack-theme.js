#!/usr/bin/env node
/**
 * enforce-edutrack-theme.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Upgrades EduTrack colour tokens to the new electric-blue-600 palette.
 *
 * Changes:
 *   1. cyan-600/cyan-500 solid interactive elements → blue-600/blue-500
 *      (hero/decorative gradients that already use from-cyan-* are left as-is)
 *   2. orange-* destructive badges/buttons → red-* (danger red)
 *   3. Hardcoded hex remnants → new values
 *
 * Scope: EduTrack/apps/web only — never touches EstateTrack.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs')
const path = require('path')

const WEB_ROOT = path.resolve(__dirname, '../apps/web')

// ─── Replacements ─────────────────────────────────────────────────────────────
// NOTE: We do NOT replace cyan in gradient positions (from-cyan-*, to-cyan-*,
// via-cyan-*) because those are intentional gradient anchors for hero sections.
// We only target solid bg-, text-, border-, ring-, shadow-, focus:ring- patterns.
const REPLACEMENTS = [
  // ── cyan solid elements → electric blue (active pills, buttons, rings) ────
  // bg-cyan-600 → bg-blue-600 (solid buttons / active tab pills)
  ['bg-cyan-600',          'bg-blue-600'],
  ['bg-cyan-500',          'bg-blue-500'],
  ['bg-cyan-700',          'bg-blue-700'],
  // hover states
  ['hover:bg-cyan-600',    'hover:bg-blue-600'],
  ['hover:bg-cyan-700',    'hover:bg-blue-700'],
  ['hover:bg-cyan-500',    'hover:bg-blue-500'],
  // dark: variants for solid elements
  ['dark:bg-cyan-600',     'dark:bg-blue-600'],
  ['dark:bg-cyan-500',     'dark:bg-blue-500'],
  // text-cyan-* for active labels, text accents
  ['text-cyan-600',        'text-blue-600'],
  ['text-cyan-700',        'text-blue-700'],
  // dark text
  ['dark:text-cyan-400',   'dark:text-blue-400'],
  ['dark:text-cyan-300',   'dark:text-blue-300'],
  // hover text
  ['hover:text-cyan-600',  'hover:text-blue-600'],
  ['dark:hover:text-cyan-400', 'dark:hover:text-blue-400'],
  // border-cyan
  ['border-cyan-500',      'border-blue-500'],
  ['border-cyan-600',      'border-blue-600'],
  // ring / focus
  ['ring-cyan-500',        'ring-blue-500'],
  ['focus:ring-cyan-500',  'focus:ring-blue-500'],
  ['ring-cyan-600',        'ring-blue-600'],
  // shadow
  ['shadow-cyan-500',      'shadow-blue-500'],
  ['shadow-cyan-600',      'shadow-blue-600'],
  // light bg accents (icon backgrounds etc.) — these map cyan-100→blue-100
  ['bg-cyan-100',          'bg-blue-100'],
  ['dark:bg-cyan-900',     'dark:bg-blue-900'],
  ['dark:bg-cyan-900/40',  'dark:bg-blue-900/40'],
  ['dark:bg-cyan-900/30',  'dark:bg-blue-900/30'],
  ['dark:bg-cyan-500/10',  'dark:bg-blue-500/10'],
  // border-cyan-200 (card borders) → blue-200
  ['border-cyan-200',      'border-blue-200'],
  ['dark:border-cyan-800', 'dark:border-blue-800'],
  ['dark:border-cyan-800/50', 'dark:border-blue-800/50'],
  // bg-cyan-50 (icon containers) → bg-blue-50
  ['bg-cyan-50',           'bg-blue-50'],
  ['dark:bg-cyan-950',     'dark:bg-blue-950'],
  ['dark:bg-cyan-950/30',  'dark:bg-blue-950/30'],

  // ── Hex remnants ─────────────────────────────────────────────────────────
  ['#22d3ee', '#3b82f6'],   // cyan-400 → blue-500
  ['#06b6d4', '#2563eb'],   // cyan-500 → blue-600

  // ── orange → danger red (destructive only contexts) ────────────────────
  // suspended badges, warning statuses
  ['bg-orange-100 text-orange-700',         'bg-red-100 text-red-700'],
  ['dark:bg-orange-900/30 dark:text-orange-400', 'dark:bg-red-900/30 dark:text-red-400'],
  ['bg-orange-100',         'bg-red-100'],
  ['text-orange-700',       'text-red-700'],
  ['text-orange-600',       'text-red-600'],
  ['text-orange-500',       'text-red-500'],
  ['text-orange-400',       'text-red-400'],
  ['bg-orange-500',         'bg-red-500'],
  ['dark:bg-orange-500/20', 'dark:bg-red-500/20'],
  ['dark:text-orange-400',  'dark:text-red-400'],
  ['dark:text-orange-300',  'dark:text-red-300'],
  ['text-orange-900',       'text-red-900'],
  ['bg-orange-900/30',      'bg-red-900/30'],
  ['border-orange-',        'border-red-'],
  ['ring-orange-',          'ring-red-'],
]

const EXTENSIONS = new Set(['.tsx', '.ts', '.css', '.js', '.mjs'])
const SKIP_DIRS  = new Set(['node_modules', '.next', '.git', 'dist', 'out'])

// Gradient anchor patterns — do NOT replace these
const GRADIENT_SAFE = /\b(from|to|via)-cyan-/

let filesChanged = 0
let replacementsTotal = 0

function walk(dir) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) }
  catch { return }

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full)
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      processFile(full)
    }
  }
}

function processFile(filePath) {
  let content
  try { content = fs.readFileSync(filePath, 'utf8') }
  catch { return }

  const original = content
  let count = 0

  for (const [from, to] of REPLACEMENTS) {
    // Skip gradient anchor patterns
    if (GRADIENT_SAFE.test(from)) continue

    const escaped = from.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    const regex = new RegExp(escaped, 'g')
    const before = content
    content = content.replace(regex, to)
    if (content !== before) {
      count += (before.match(regex) || []).length
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8')
    filesChanged++
    replacementsTotal += count
    console.log(`  ✔ ${path.relative(WEB_ROOT, filePath)}  (${count} replacements)`)
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────
console.log('EduTrack theme enforce — cyan solid → electric blue, orange → danger red')
console.log(`Scanning: ${WEB_ROOT}\n`)
walk(WEB_ROOT)
console.log(`\nDone. ${filesChanged} files changed, ~${replacementsTotal} token replacements.`)
