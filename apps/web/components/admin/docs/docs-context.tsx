'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

type Tab = 'docs' | 'repo'

interface DocsContextValue {
  activeTab: Tab
  activeRepoPath: string | null
  setTab: (tab: Tab) => void
  openRepo: (repoPath: string) => void
}

const DocsContext = createContext<DocsContextValue | null>(null)

export function DocsProvider({
  children,
  defaultRepoPath,
}: {
  children: React.ReactNode
  defaultRepoPath?: string | null
}) {
  const [activeTab, setActiveTab] = useState<Tab>('docs')
  const [activeRepoPath, setActiveRepoPath] = useState<string | null>(defaultRepoPath ?? null)

  const setTab = useCallback((tab: Tab) => setActiveTab(tab), [])

  const openRepo = useCallback((repoPath: string) => {
    setActiveRepoPath(repoPath)
    setActiveTab('repo')
  }, [])

  return (
    <DocsContext.Provider value={{ activeTab, activeRepoPath, setTab, openRepo }}>
      {children}
    </DocsContext.Provider>
  )
}

export function useDocsContext() {
  const ctx = useContext(DocsContext)
  if (!ctx) throw new Error('useDocsContext must be used inside DocsProvider')
  return ctx
}
