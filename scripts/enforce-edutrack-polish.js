// enforce-edutrack-polish.js
// Round 2: orange purge, dusty slate→navy, red buttons→blue, standalone cyan→blue
// Run: node scripts/enforce-edutrack-polish.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../apps/web');
const EXTS = ['.tsx', '.ts', '.css'];

let totalFiles = 0;
let totalChanges = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (['node_modules', '.next', '.git', 'public'].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (EXTS.some(x => e.name.endsWith(x))) processFile(full);
  }
}

function processFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  let out = src;

  // ── 1. ORANGE → BLUE (interactive elements) ─────────────────────────────
  // bg-orange-* → bg-blue-* (buttons, badges, backgrounds)
  out = out.replace(/\bbg-orange-600\b/g, 'bg-blue-600');
  out = out.replace(/\bbg-orange-700\b/g, 'bg-blue-700');
  out = out.replace(/\bbg-orange-500\b/g, 'bg-blue-500');
  out = out.replace(/\bbg-orange-400\b/g, 'bg-blue-400');
  out = out.replace(/\bbg-orange-50\b/g, 'bg-blue-50');
  out = out.replace(/\bbg-orange-100\b/g, 'bg-blue-100');
  out = out.replace(/\bbg-orange-200\b/g, 'bg-blue-100');

  // dark:bg-orange-* → dark:bg-blue-*
  out = out.replace(/\bdark:bg-orange-600\b/g, 'dark:bg-blue-600');
  out = out.replace(/\bdark:bg-orange-700\b/g, 'dark:bg-blue-700');
  out = out.replace(/\bdark:bg-orange-900\/(\d+)/g, 'dark:bg-blue-900/$1');
  out = out.replace(/\bdark:bg-orange-950\/(\d+)/g, 'dark:bg-blue-950/$1');
  out = out.replace(/\bdark:bg-orange-50\b/g, 'dark:bg-blue-900/20');

  // hover:bg-orange-* → hover:bg-blue-*
  out = out.replace(/\bhover:bg-orange-600\b/g, 'hover:bg-blue-700');
  out = out.replace(/\bhover:bg-orange-700\b/g, 'hover:bg-blue-800');
  out = out.replace(/\bhover:bg-orange-50\b/g, 'hover:bg-blue-50');
  out = out.replace(/\bhover:bg-orange-100\b/g, 'hover:bg-blue-100');
  out = out.replace(/\bdark:hover:bg-orange-900\/(\d+)/g, 'dark:hover:bg-blue-900/$1');

  // text-orange-* → text-blue-* (not error text)
  out = out.replace(/\btext-orange-800\b/g, 'text-blue-800');
  out = out.replace(/\btext-orange-700\b/g, 'text-blue-700');
  out = out.replace(/\btext-orange-600\b/g, 'text-blue-600');
  out = out.replace(/\btext-orange-500\b/g, 'text-blue-500');
  out = out.replace(/\btext-orange-400\b/g, 'text-blue-400');
  out = out.replace(/\btext-orange-200\b/g, 'text-blue-200');
  out = out.replace(/\bdark:text-orange-200\b/g, 'dark:text-blue-300');
  out = out.replace(/\bdark:text-orange-300\b/g, 'dark:text-blue-300');
  out = out.replace(/\bdark:text-orange-400\b/g, 'dark:text-blue-400');

  // border-orange-* → border-blue-*
  out = out.replace(/\bborder-orange-600\b/g, 'border-blue-600');
  out = out.replace(/\bborder-orange-500\b/g, 'border-blue-500');
  out = out.replace(/\bborder-orange-200\b/g, 'border-blue-200');
  out = out.replace(/\bborder-orange-100\b/g, 'border-blue-100');
  out = out.replace(/\bdark:border-orange-800\/(\d+)/g, 'dark:border-blue-800/$1');
  out = out.replace(/\bdark:border-orange-700\b/g, 'dark:border-blue-700');
  out = out.replace(/\bdark:border-orange-900\/(\d+)/g, 'dark:border-blue-900/$1');

  // shadow-orange-* → shadow-blue-*
  out = out.replace(/\bshadow-orange-\d+\/\d+/g, 'shadow-blue-900/20');

  // from/to/via orange gradients → blue
  out = out.replace(/\bfrom-orange-\d+\b/g, 'from-blue-600');
  out = out.replace(/\bto-orange-\d+\b/g, 'to-blue-700');
  out = out.replace(/\bvia-orange-\d+\b/g, 'via-blue-600');

  // ring-orange-* → ring-blue-*
  out = out.replace(/\bfocus:ring-orange-\d+\b/g, 'focus:ring-blue-500');

  // ── 2. RED BUTTONS → BLUE (destructive action buttons only) ─────────────
  // Pattern: bg-red-600 on buttons → bg-blue-600
  out = out.replace(/\bbg-red-600 hover:bg-red-700\b/g, 'bg-blue-600 hover:bg-blue-700');
  out = out.replace(/\bbg-red-600\b/g, (match, offset, str) => {
    // Keep text-red-600 validation messages, only replace bg-red-600
    return 'bg-blue-600';
  });
  out = out.replace(/\bhover:bg-red-700\b/g, 'hover:bg-blue-700');

  // shadow-red-900/* → shadow-blue-900/*
  out = out.replace(/\bshadow-red-900\/\d+\b/g, 'shadow-blue-900/20');

  // border-t-red-500 (error modal border) → border-t-blue-500
  out = out.replace(/\bborder-t-red-500\b/g, 'border-t-blue-500');

  // ── 3. STANDALONE CYAN ICONS → BLUE ─────────────────────────────────────
  // text-cyan-500 on icons (not inside gradient classes) → text-blue-600
  // Only when NOT part of from-cyan-*/to-cyan-* gradient
  out = out.replace(/\btext-cyan-500\b/g, 'text-blue-600');
  out = out.replace(/\btext-cyan-400\b/g, 'text-blue-500');
  out = out.replace(/\btext-cyan-300\b/g, 'text-blue-400');
  out = out.replace(/\bdark:text-cyan-500\b/g, 'dark:text-blue-400');
  out = out.replace(/\bdark:text-cyan-400\b/g, 'dark:text-blue-400');

  // bg-cyan-* standalone (not part of gradient) → bg-blue-*
  out = out.replace(/\bbg-cyan-500\/(\d+)\b/g, 'bg-blue-600/$1');
  out = out.replace(/\bbg-cyan-400\/(\d+)\b/g, 'bg-blue-500/$1');

  // border-cyan-* → border-blue-*
  out = out.replace(/\bborder-cyan-500\/(\d+)\b/g, 'border-blue-500/$1');
  out = out.replace(/\bborder-cyan-100\b/g, 'border-blue-100');

  // dark:from-cyan-900 (quick action icon bg) → dark:from-blue-900
  out = out.replace(/\bdark:from-cyan-900\/(\d+)\b/g, 'dark:from-blue-900/$1');
  out = out.replace(/\bdark:to-cyan-900\/(\d+)\b/g, 'dark:to-blue-900/$1');

  // Preserve from-cyan-500/to-cyan-* in gradient strings (these are intentional hero gradients)
  // The above replacements don't touch from-cyan-500 since we only target text-cyan-* and bg-cyan-*

  // ── 4. DUSTY SLATE CARDS → NAVY ─────────────────────────────────────────
  // dark:bg-slate-800 → dark:bg-[#0d1b2e]
  out = out.replace(/\bdark:bg-slate-800\/50\b/g, 'dark:bg-[#0d1b2e]/80');
  out = out.replace(/\bdark:bg-slate-800\/(\d+)\b/g, 'dark:bg-[#0d1b2e]/$1');
  out = out.replace(/\bdark:bg-slate-800\b/g, 'dark:bg-[#0d1b2e]');
  out = out.replace(/\bdark:bg-slate-900\/50\b/g, 'dark:bg-[#060d1a]/80');
  out = out.replace(/\bdark:bg-slate-900\/(\d+)\b/g, 'dark:bg-[#060d1a]/$1');
  out = out.replace(/\bdark:bg-slate-900\b/g, 'dark:bg-[#060d1a]');

  // Standalone (non-dark-prefixed) bg-slate-800/900 in dark contexts
  // Only in className strings that suggest dark-mode UI components
  out = out.replace(/\bbg-slate-800\/50\b/g, 'bg-[#0d1b2e]/80');
  out = out.replace(/\bbg-slate-800\b/g, 'bg-[#0d1b2e]');
  out = out.replace(/\bbg-slate-900\/50\b/g, 'bg-[#060d1a]/80');

  // dark:border-slate-800 → dark:border-[#1a2744]
  out = out.replace(/\bdark:border-slate-800\b/g, 'dark:border-[#1a2744]');
  out = out.replace(/\bdark:border-slate-700\b/g, 'dark:border-[#1a2744]');

  // dark:hover:bg-slate-800 → dark:hover:bg-[#1a2744]
  out = out.replace(/\bdark:hover:bg-slate-800\/(\d+)\b/g, 'dark:hover:bg-[#1a2744]/$1');
  out = out.replace(/\bdark:hover:bg-slate-800\b/g, 'dark:hover:bg-[#1a2744]');

  if (out !== src) {
    fs.writeFileSync(filePath, out, 'utf8');
    totalFiles++;
    const changes = (src.match(/\n/g) || []).length - (out.match(/\n/g) || []).length;
    totalChanges++;
    console.log(`  Updated: ${path.relative(ROOT, filePath)}`);
  }
}

console.log('EduTrack Polish Pass — Round 2');
console.log('================================');
walk(ROOT);
console.log(`\nDone. Updated ${totalFiles} files.`);
