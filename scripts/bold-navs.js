const fs = require('fs')
const path = require('path')

const repo = process.argv[2]
if (!repo || (repo !== 'EduTrack' && repo !== 'EstateTrack')) {
  console.error('Usage: node bold-navs.js <EduTrack|EstateTrack>')
  process.exit(1)
}

const dirPath = path.join(__dirname, '..', 'apps', 'web', 'components')

const theme = repo === 'EduTrack' 
  ? { color: 'cyan', from: 'blue', darkBg: 'from-blue-900/40 dark:to-cyan-900/20' }
  : { color: 'fuchsia', from: 'purple', darkBg: 'from-purple-900/40 dark:to-fuchsia-900/20' }

function applyBoldness(content) {
  let updated = content

  // 1. Upgrade Tab Icons
  updated = updated.replace(/className=\{`w-\[1\.125rem\] h-\[1\.125rem\] /g, 'className={`w-6 h-6 stroke-[2.5] ')
  
  // 2. Upgrade Tab Text
  updated = updated.replace(/className=\{`text-\[9px\] font-bold /g, 'className={`text-[10px] font-extrabold uppercase ')
  
  // 3. Upgrade Menu Items Icons
  updated = updated.replace(/<Icon className="w-5 h-5" \/>/g, '<Icon className="w-7 h-7" strokeWidth={2.5} />')

  // 4. Upgrade Menu Items Wrappers
  // Replace the active state
  const activeRegex = new RegExp(`bg-${theme.color}-600 text-white shadow-lg shadow-${theme.color}-500/30`, 'g')
  updated = updated.replace(activeRegex, `bg-gradient-to-br from-${theme.color}-600 to-${theme.from}-600 text-white shadow-lg shadow-${theme.color}-500/30 -translate-y-1`)
  
  // Replace the inactive state
  const inactiveRegex = new RegExp(`bg-muted text-foreground group-hover:bg-${theme.color}-100 group-hover:text-${theme.color}-600 dark:group-hover:bg-${theme.color}-900/30 dark:group-hover:text-${theme.color}-400`, 'g')
  updated = updated.replace(inactiveRegex, `bg-gradient-to-br from-${theme.from}-50 to-${theme.color}-50 dark:${theme.darkBg} border border-${theme.from}-100/50 dark:border-${theme.from}-800/50 text-${theme.color}-600 dark:text-${theme.color}-400 group-hover:shadow-lg group-hover:shadow-${theme.color}-500/20 group-hover:-translate-y-1`)
  
  // Upgrade the size and roundedness of wrapper
  updated = updated.replace(/relative w-12 h-12 rounded-2xl/g, 'relative w-14 h-14 rounded-[1.25rem]')

  // 5. Upgrade Menu Items Text
  const textRegex = new RegExp(`text-\\[10px\\] font-semibold text-center \\\$\\{active \\? 'text-${theme.color}-600 dark:text-${theme.color}-400' : 'text-muted-foreground'\\}`, 'g')
  updated = updated.replace(textRegex, `text-xs font-bold text-center mt-1 transition-colors \${active ? 'text-${theme.color}-600 dark:text-${theme.color}-400' : 'text-foreground group-hover:text-${theme.color}-600'}`)

  // 6. If there's a Menu icon for the 'More' button, make it match the tabs
  updated = updated.replace(/<Menu className=\{`w-\[1\.125rem\] h-\[1\.125rem\] /g, '<Menu className={`w-6 h-6 stroke-[2.5] ')
  
  return updated
}

function walk(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      walk(fullPath)
    } else if (stat.isFile() && fullPath.endsWith('-nav.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8')
      const updated = applyBoldness(content)
      if (updated !== content) {
        fs.writeFileSync(fullPath, updated, 'utf8')
        console.log(`Boldened ${file}`)
      }
    }
  }
}

console.log(`Applying bold navigations in ${repo}...`)
walk(dirPath)
console.log('Done.')
