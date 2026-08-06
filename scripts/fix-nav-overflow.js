const fs = require('fs')
const path = require('path')

function findNavFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file))
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.next') {
      findNavFiles(path.join(dir, file), fileList)
    } else if (file.endsWith('-nav.tsx')) {
      fileList.push(path.join(dir, file))
    }
  }
  return fileList
}

function processNavFiles(baseDir) {
  const appsDir = path.join(baseDir, 'apps', 'web')
  if (!fs.existsSync(appsDir)) return

  const navFiles = findNavFiles(appsDir)
  for (const file of navFiles) {
    let content = fs.readFileSync(file, 'utf-8')
    
    // 1. reduce bottom tab icons to `w-5 h-5`
    // Wait, the icons in the tabs are usually inside the TABS.map
    // We can replace `w-6 h-6 stroke-[2.5]` with `w-5 h-5 stroke-[2.5]`
    content = content.replace(/<Icon className=\{`w-6 h-6 stroke-\[2\.5\]/g, '<Icon className={`w-5 h-5 stroke-[2.5]')
    content = content.replace(/<Menu className=\{`w-6 h-6 stroke-\[2\.5\]/g, '<Menu className={`w-5 h-5 stroke-[2.5]')
    
    // 2. reduce text to `text-[9px] tracking-tight`
    content = content.replace(/text-\[10px\] font-extrabold uppercase tracking-wide/g, 'text-[9px] font-extrabold uppercase tracking-tight')
    
    // 3. link wrapper `flex-1 min-w-0 px-1`
    // Old wrapper: className="relative py-2.5 px-2 sm:px-3 rounded-2xl transition-all duration-300 tap-highlight-transparent group flex flex-col items-center flex-1"
    content = content.replace(/px-2 sm:px-3 (.*?)flex-1/g, 'px-1 $1flex-1 min-w-0')
    
    // 4. max-width of `32rem`
    // Old: max-w-[min(calc(100vw-2.5rem),28rem)]
    content = content.replace(/max-w-\[min\(calc\(100vw-2\.5rem\),28rem\)\]/g, 'max-w-[min(calc(100vw-2rem),32rem)]')
    
    fs.writeFileSync(file, content)
    console.log(`Updated ${file}`)
  }
}

processNavFiles('c:\\Users\\jxilf\\OneDrive\\Desktop\\EduTrack')
processNavFiles('c:\\Users\\jxilf\\OneDrive\\Desktop\\EstateTrack')
