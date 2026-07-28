const fs = require('fs')
const path = require('path')

function processDir(dir) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      processDir(fullPath)
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8')
      let changed = false
      
      if (content.includes('@/lib/feedback')) {
        content = content.replace(/import\s+\{.*?(showFeedback|showError).*?\}\s+from\s+['"]@\/lib\/feedback['"]/g, "import { UX } from '@/lib/ux'")
        content = content.replace(/showFeedback\(\{/g, 'UX.successModal({')
        content = content.replace(/showFeedback\(/g, 'UX.successModal(')
        content = content.replace(/showError\(/g, 'UX.errorModal(')
        changed = true
      }
      
      if (content.includes('@/components/providers/confirm-provider')) {
        content = content.replace(/@\/components\/providers\/confirm-provider/g, '@/components/providers/ux-provider')
        changed = true
      }

      if (changed) {
        fs.writeFileSync(fullPath, content)
        console.log('Migrated:', fullPath)
      }
    }
  }
}

console.log('Migrating EduTrack...')
processDir('c:/Users/jxilf/OneDrive/Desktop/EduTrack/apps/web')
console.log('Migrating EstateTrack...')
processDir('c:/Users/jxilf/OneDrive/Desktop/EstateTrack/apps/web')
console.log('Done.')
