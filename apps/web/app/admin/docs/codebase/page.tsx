import React from 'react'
import { CodeExplorer } from '@/components/admin/docs/code-explorer'

export const metadata = {
  title: 'Code Explorer | EduTrack Admin',
}

export default function CodebasePage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-mono text-slate-900 dark:text-white mb-2">Code Explorer</h1>
        <p className="text-slate-500 dark:text-slate-400 font-mono text-sm">
          Browse the full EduTrack repository file tree.
        </p>
      </div>
      <div className="flex-1 min-h-[600px]">
        <CodeExplorer repo="XILFANX/EduTrack" branch="main" accent="blue" />
      </div>
    </div>
  )
}
