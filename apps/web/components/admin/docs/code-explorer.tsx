'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Folder, FolderOpen, ChevronRight, ChevronDown, Code2,
  FileCode, FileText, FileJson, FileCog, FileType, X,
  Copy, Check, Loader2, AlertCircle, PanelLeftClose, PanelLeftOpen,
  ExternalLink, RefreshCw,
} from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CodeExplorerProps {
  repo: string
  branch?: string
  accent?: 'violet' | 'blue'
}

type GitTreeItem = {
  path: string
  type: 'blob' | 'tree'
  sha?: string
}

type TreeNode = {
  path: string
  name: string
  type: 'blob' | 'tree'
  children?: TreeNode[]
  lazy?: boolean
}

type OpenTab = {
  path: string
  name: string
}

// ─── File icon helper ─────────────────────────────────────────────────────────

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, { icon: React.ElementType; color: string }> = {
    ts:   { icon: FileCode,  color: 'text-blue-500' },
    tsx:  { icon: FileCode,  color: 'text-blue-500' },
    js:   { icon: FileCode,  color: 'text-red-400' },
    jsx:  { icon: FileCode,  color: 'text-red-400' },
    json: { icon: FileJson,  color: 'text-red-400' },
    md:   { icon: FileText,  color: 'text-slate-400' },
    mdx:  { icon: FileText,  color: 'text-slate-400' },
    css:  { icon: FileType,  color: 'text-blue-500' },
    env:  { icon: FileCog,   color: 'text-blue-500' },
    sql:  { icon: FileCog,   color: 'text-blue-500' },
  }
  return map[ext] ?? { icon: FileCode, color: 'text-slate-400' }
}

// ─── Flat tree → nested ────────────────────────────────────────────────────────

function buildTree(items: GitTreeItem[]): TreeNode[] {
  const root: TreeNode[] = []
  const map = new Map<string, TreeNode>()

  for (const item of items) {
    const name = item.path.split('/').pop() || ''
    const node: TreeNode = {
      path: item.path,
      name,
      type: item.type,
      children: item.type === 'tree' ? [] : undefined,
    }
    map.set(item.path, node)
    const parentPath = item.path.includes('/')
      ? item.path.substring(0, item.path.lastIndexOf('/'))
      : ''

    if (parentPath === '') {
      root.push(node)
    } else {
      const parent = map.get(parentPath)
      if (parent?.children) parent.children.push(node)
    }
  }

  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach(n => { if (n.children) sort(n.children) })
  }
  sort(root)
  return root
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CodeExplorer({ repo, branch = 'main', accent = 'blue' }: CodeExplorerProps) {
  const [tree, setTree]               = useState<TreeNode[]>([])
  const [treeLoading, setTreeLoading] = useState(true)
  const [treeError, setTreeError]     = useState<string | null>(null)
  const [expanded, setExpanded]       = useState<Set<string>>(new Set())
  const [tabs, setTabs]               = useState<OpenTab[]>([])
  const [activeTab, setActiveTab]     = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [code, setCode]               = useState<Record<string, string>>({})
  const [fileLoading, setFileLoading] = useState<string | null>(null)
  const [fileError, setFileError]     = useState<Record<string, string>>({})
  const [copied, setCopied]           = useState(false)

  const accentColor = accent === 'violet' ? '#7c3aed' : '#2563eb'
  const accentText  = accent === 'violet' ? 'text-blue-500' : 'text-blue-500'

  // ── Load tree ──────────────────────────────────────────────────────────────
  const loadTree = useCallback(async () => {
    try {
      setTreeLoading(true)
      setTreeError(null)
      const res = await fetch(`/api/admin/github-tree?repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      if (!data.tree || !Array.isArray(data.tree)) throw new Error('Invalid tree response from API')
      setTree(buildTree(data.tree))
    } catch (e: any) {
      setTreeError(e.message)
    } finally {
      setTreeLoading(false)
    }
  }, [repo, branch])

  useEffect(() => { loadTree() }, [loadTree])

  // ── Load file ──────────────────────────────────────────────────────────────
  const loadFile = useCallback(async (path: string) => {
    if (code[path] || fileError[path]) return
    setFileLoading(path)
    try {
      const fullPath = `${repo}/${branch}/${path}`
      const res = await fetch(`/api/admin/github-source?path=${encodeURIComponent(fullPath)}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const text = await res.text()
      setCode(prev => ({ ...prev, [path]: text }))
    } catch (e: any) {
      setFileError(prev => ({ ...prev, [path]: e.message }))
    } finally {
      setFileLoading(null)
    }
  }, [repo, branch, code, fileError])

  // ── Open file ──────────────────────────────────────────────────────────────
  const openFile = useCallback((path: string, name: string) => {
    setActiveTab(path)
    if (!tabs.find(t => t.path === path)) {
      setTabs(prev => [...prev, { path, name }])
    }
    loadFile(path)
  }, [tabs, loadFile])

  // ── Close tab ──────────────────────────────────────────────────────────────
  const closeTab = useCallback((path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setTabs(prev => {
      const next = prev.filter(t => t.path !== path)
      if (activeTab === path) setActiveTab(next.length ? next[next.length - 1].path : null)
      return next
    })
  }, [activeTab])

  // ── Toggle folder ──────────────────────────────────────────────────────────
  const toggleFolder = (path: string) => {
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(path) ? s.delete(path) : s.add(path)
      return s
    })
  }

  // ── Copy ──────────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    if (!activeTab || !code[activeTab]) return
    await navigator.clipboard.writeText(code[activeTab])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Render tree ────────────────────────────────────────────────────────────
  const renderNodes = (nodes: TreeNode[], depth = 0): React.ReactNode => nodes.map(node => {
    const isOpen   = expanded.has(node.path)
    const isActive = activeTab === node.path
    const indent   = depth * 12 + 12

    if (node.type === 'tree') {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            className="w-full flex items-center gap-1 py-[3px] pr-2 text-left hover:bg-white/5 transition-colors group"
            style={{ paddingLeft: `${indent}px` }}
          >
            <span className="text-slate-500 group-hover:text-slate-300 shrink-0 transition-colors">
              {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </span>
            <span className="text-slate-500 shrink-0 transition-colors group-hover:text-blue-600">
              {isOpen ? <FolderOpen className="w-3.5 h-3.5" /> : <Folder className="w-3.5 h-3.5" />}
            </span>
            <span className="text-[12px] text-slate-300 group-hover:text-white truncate select-none">
              {node.name}
            </span>
          </button>
          {isOpen && node.children && renderNodes(node.children, depth + 1)}
        </div>
      )
    }

    const { icon: Icon, color } = fileIcon(node.name)
    return (
      <button
        key={node.path}
        onClick={() => openFile(node.path, node.name)}
        className={`w-full flex items-center gap-1.5 py-[3px] pr-2 text-left transition-colors group ${
          isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
        }`}
        style={{ paddingLeft: `${indent + 16}px` }}
      >
        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? color : 'text-slate-500 group-hover:' + color}`} />
        <span className="text-[12px] truncate select-none">{node.name}</span>
      </button>
    )
  })

  // ── Derived state ──────────────────────────────────────────────────────────
  const activeCode    = activeTab ? code[activeTab]      ?? null : null
  const activeErr     = activeTab ? fileError[activeTab] ?? null : null
  const activeLoading = activeTab ? fileLoading === activeTab : false
  const activeTabInfo = tabs.find(t => t.path === activeTab)
  const githubUrl     = activeTab ? `https://github.com/${repo}/blob/${branch}/${activeTab}` : '#'
  const lineCount     = activeCode ? activeCode.split('\n').length : 0

  return (
    <div className="flex flex-col h-full min-h-[600px] rounded-xl overflow-hidden border border-[#1a2744] bg-[#0A0A0F] shadow-2xl font-mono">
      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <div className="flex flex-col w-60 shrink-0 border-r border-[#1a2744] bg-[#050508]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a2744]">
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Explorer</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-slate-600 hover:text-slate-300 transition-colors rounded"
                title="Close sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-3 py-2 border-b border-[#1a2744]/50">
              <span className={`text-[10px] font-bold tracking-widest uppercase ${accentText}`}>
                {repo.split('/')[1]}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-1 text-[12px]">
              {treeLoading ? (
                <div className="flex items-center gap-2 px-4 py-4 text-slate-500 text-xs animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading repository…
                </div>
              ) : treeError ? (
                <div className="px-4 py-4 space-y-3">
                  <div className="flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-snug">{treeError}</span>
                  </div>
                  <button onClick={loadTree} className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white transition-colors">
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                </div>
              ) : tree.length === 0 ? (
                <div className="px-4 py-4 text-slate-600 text-xs">Empty repository.</div>
              ) : (
                renderNodes(tree)
              )}
            </div>
          </div>
        )}

        {/* ── Editor pane ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="flex items-center bg-[#050508] border-b border-[#1a2744] overflow-x-auto scrollbar-none shrink-0 min-h-[36px]">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="shrink-0 px-3 py-2 text-slate-500 hover:text-slate-300 transition-colors border-r border-[#1a2744]"
                title="Open sidebar"
              >
                <PanelLeftOpen className="w-3.5 h-3.5" />
              </button>
            )}
            {tabs.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-2">
                <span className="text-[11px] text-slate-600">Select a file from the explorer</span>
              </div>
            )}
            {tabs.map(tab => {
              const { icon: TabIcon, color: tabColor } = fileIcon(tab.name)
              const isActive = activeTab === tab.path
              return (
                <button
                  key={tab.path}
                  onClick={() => setActiveTab(tab.path)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[11px] border-r border-[#1a2744] transition-colors shrink-0 group/tab max-w-[160px] ${
                    isActive
                      ? 'bg-[#0A0A0F] text-white border-t-2 border-t-[var(--accent)]'
                      : 'text-slate-500 hover:bg-[#0A0A0F]/50 hover:text-slate-300 border-t-2 border-t-transparent'
                  }`}
                  style={{ '--accent': accentColor } as any}
                >
                  <TabIcon className={`w-3 h-3 shrink-0 ${isActive ? tabColor : 'text-slate-600'}`} />
                  <span className="truncate">{tab.name}</span>
                  <span
                    onClick={(e) => closeTab(tab.path, e)}
                    className="ml-1 p-0.5 rounded hover:bg-white/10 text-slate-600 hover:text-slate-300 transition-colors"
                    role="button"
                    aria-label="Close tab"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                </button>
              )
            })}
          </div>

          {/* Breadcrumb / toolbar */}
          {activeTab && activeTabInfo && (
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#0A0A0F] border-b border-[#1a2744]/50 text-[11px] text-slate-500 shrink-0">
              <div className="flex items-center gap-1 overflow-hidden">
                {activeTab.split('/').map((seg, i, arr) => (
                  <React.Fragment key={i}>
                    <span className={i === arr.length - 1 ? 'text-slate-300 truncate' : 'truncate'}>{seg}</span>
                    {i < arr.length - 1 && <ChevronRight className="w-3 h-3 shrink-0 text-slate-600" />}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                {activeCode && <span className="text-slate-600">{lineCount} lines</span>}
                <a href={githubUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors" title="Open in GitHub">
                  <ExternalLink className="w-3 h-3" /><span>GitHub</span>
                </a>
                {activeCode && !activeErr && (
                  <button onClick={handleCopy} className="flex items-center gap-1 hover:text-slate-200 transition-colors">
                    {copied ? <Check className="w-3 h-3 text-blue-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Code area */}
          <div className="flex-1 overflow-auto relative bg-[#0A0A0F]">
            {!activeTab && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 gap-3">
                <Code2 className="w-14 h-14 opacity-20" />
                <p className="text-sm">Open a file to view its source</p>
                {!sidebarOpen && (
                  <button onClick={() => setSidebarOpen(true)} className={`text-xs flex items-center gap-1.5 mt-2 ${accentText} hover:opacity-80 transition-opacity`}>
                    <PanelLeftOpen className="w-3.5 h-3.5" /> Show Explorer
                  </button>
                )}
              </div>
            )}
            {activeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm bg-[#0A0A0F]">
                <Loader2 className={`w-6 h-6 animate-spin ${accentText}`} />
                <span>Fetching from GitHub…</span>
              </div>
            )}
            {activeErr && !activeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-red-400 text-sm px-8 text-center bg-[#0A0A0F]">
                <AlertCircle className="w-8 h-8 opacity-50" />
                <p className="font-semibold">Could not load file</p>
                <p className="text-xs text-red-500/70 bg-orange-900/20 px-3 py-1.5 rounded-md">{activeErr}</p>
              </div>
            )}
            {activeCode && !activeLoading && !activeErr && (
              <div className="text-[13px] leading-relaxed [&>pre]:!m-0 [&>pre]:!bg-transparent [&>pre]:!p-4">
                <SyntaxHighlighter
                  language={activeTabInfo?.name.split('.').pop()?.toLowerCase() || 'typescript'}
                  style={vscDarkPlus}
                  showLineNumbers
                  customStyle={{ margin: 0, background: 'transparent' }}
                  lineNumberStyle={{ minWidth: '3rem', paddingRight: '1rem', color: '#475569', textAlign: 'right' }}
                >
                  {activeCode}
                </SyntaxHighlighter>
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-1 text-[10px] text-white shrink-0" style={{ backgroundColor: accentColor }}>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 opacity-80"><Code2 className="w-3 h-3" />{repo}</span>
              {activeTabInfo && <span className="opacity-80">{activeTabInfo.name.split('.').pop()?.toUpperCase()}</span>}
            </div>
            <div className="flex items-center gap-3 opacity-80">
              {activeCode && <span>{lineCount} lines</span>}
              <span>{branch}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
