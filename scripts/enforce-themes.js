const fs = require('fs')
const path = require('path')

const repo = process.argv[2]
if (!repo || (repo !== 'EduTrack' && repo !== 'EstateTrack')) {
  console.error('Usage: node enforce-themes.js <EduTrack|EstateTrack>')
  process.exit(1)
}

const dirPath = path.join(__dirname, '..', 'apps', 'web')

const eduMap = {
  'bg-blue-': 'bg-cyan-',
  'text-blue-': 'text-cyan-',
  'border-blue-': 'border-cyan-',
  'ring-blue-': 'ring-cyan-',
  'shadow-blue-': 'shadow-cyan-',
  'from-blue-': 'from-cyan-',
  'via-blue-': 'via-cyan-',
  'to-blue-': 'to-cyan-',
}

const estateMap = {
  'bg-blue-': 'bg-fuchsia-',
  'text-blue-': 'text-fuchsia-',
  'border-blue-': 'border-fuchsia-',
  'ring-blue-': 'ring-fuchsia-',
  'shadow-blue-': 'shadow-fuchsia-',
  'from-blue-': 'from-fuchsia-',
  'via-blue-': 'via-fuchsia-',
  'to-blue-': 'to-fuchsia-',
  'bg-indigo-': 'bg-purple-',
  'text-indigo-': 'text-purple-',
  'border-indigo-': 'border-purple-',
  'ring-indigo-': 'ring-purple-',
  'shadow-indigo-': 'shadow-purple-',
  'from-indigo-': 'from-purple-',
  'via-indigo-': 'via-purple-',
  'to-indigo-': 'to-purple-',
}

const map = repo === 'EduTrack' ? eduMap : estateMap

function replaceColors(content) {
  let updated = content
  for (const [oldC, newC] of Object.entries(map)) {
    // Basic replace using regex to catch all instances
    const regex = new RegExp(oldC, 'g')
    updated = updated.replace(regex, newC)
  }
  
  if (repo === 'EduTrack') {
    // Restore the hero gradient which was specifically requested as cyan-blue
    updated = updated.replace(/from-cyan-600 via-cyan-500 to-cyan-600/g, 'from-blue-600 via-cyan-500 to-blue-600')
    updated = updated.replace(/from-cyan-600 to-cyan-500/g, 'from-cyan-600 to-blue-500')
    updated = updated.replace(/from-cyan-50 to-cyan-50/g, 'from-blue-50 to-cyan-50')
  } else {
    updated = updated.replace(/from-fuchsia-600 via-fuchsia-500 to-fuchsia-600/g, 'from-purple-600 via-fuchsia-500 to-purple-600')
  }
  
  return updated
}

function walk(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next')) {
        walk(fullPath)
      }
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf8')
      const updated = replaceColors(content)
      if (updated !== content) {
        fs.writeFileSync(fullPath, updated, 'utf8')
        // console.log(`Updated ${fullPath}`)
      }
    }
  }
}

console.log(`Sweeping ${repo} UI themes...`)
walk(dirPath)
console.log('Done.')
