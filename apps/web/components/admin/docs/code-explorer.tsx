'use client'

import React, { useState, useEffect } from 'react'
import { Folder, FolderOpen, FileCode, ChevronRight, ChevronDown, Code2 } from 'lucide-react'
import { CodeViewer } from './code-viewer'

interface CodeExplorerProps {
  repo: string
  branch?: string
  accent?: 'violet' | 'blue'
}

type TreeNode = {
  path: string
  name: string
  type: 'blob' | 'tree'
  children?: TreeNode[]
}

export function CodeExplorer({ repo, branch = 'main', accent = 'blue' }: CodeExplorerProps) {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['apps', 'apps/web', 'apps/web/app']))

  const accentActive = accent === 'violet' ? 'bg-violet-600/10 text-violet-600 dark:text-violet-400' : 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
  const accentHover = accent === 'violet' ? 'hover:text-violet-600 dark:hover:text-violet-400' : 'hover:text-blue-600 dark:hover:text-blue-400'

  useEffect(() => {
    async function fetchTree() {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/github-tree?repo=${repo}&branch=${branch}`)
        if (!res.ok) throw new Error(`Error ${res.status}`)
        const data = await res.json()
        
        if (data.tree) {
          // Parse flat tree to nested
          const root: TreeNode[] = []
          const map = new Map<string, TreeNode>()
          
          data.tree.forEach((item: any) => {
            const node: TreeNode = {
              path: item.path,
              name: item.path.split('/').pop() || '',
              type: item.type,
              children: item.type === 'tree' ? [] : undefined
            }
            map.set(item.path, node)
            
            const parentPath = item.path.substring(0, item.path.lastIndexOf('/'))
            if (parentPath === '') {
              root.push(node)
            } else {
              const parent = map.get(parentPath)
              if (parent && parent.children) {
                parent.children.push(node)
              }
            }
          })
          
          // Sort root and all children (folders first, then alphabetically)
          const sortNodes = (nodes: TreeNode[]) => {
            nodes.sort((a, b) => {
              if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
              return a.name.localeCompare(b.name)
            })
            nodes.forEach(n => {
              if (n.children) sortNodes(n.children)
            })
          }
          sortNodes(root)
          setTree(root)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTree()
  }, [repo, branch])

  const toggleFolder = (path: string) => {
    const newSet = new Set(expandedFolders)
    if (newSet.has(path)) newSet.delete(path)
    else newSet.add(path)
    setExpandedFolders(newSet)
  }

  const renderTree = (nodes: TreeNode[], level = 0) => {
    return (
      <ul className="space-y-0.5">
        {nodes.map(node => {
          const isExpanded = expandedFolders.has(node.path)
          const isSelected = selectedFile === node.path
          
          if (node.type === 'tree') {
            return (
              <li key={node.path}>
                <button
                  onClick={() => toggleFolder(node.path)}
                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-left rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 ${accentHover}`}
                  style={{ paddingLeft: `${level * 12 + 8}px` }}
                >
                  {isExpanded ? <ChevronDown className="w-3 h-3 opacity-70" /> : <ChevronRight className="w-3 h-3 opacity-70" />}
                  {isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-slate-400" /> : <Folder className="w-3.5 h-3.5 text-slate-400" />}
                  <span className="truncate select-none">{node.name}</span>
                </button>
                {isExpanded && node.children && renderTree(node.children, level + 1)}
              </li>
            )
          } else {
            return (
              <li key={node.path}>
                <button
                  onClick={() => setSelectedFile(node.path)}
                  className={`w-full flex items-center gap-2 py-1.5 text-xs text-left rounded-md transition-colors ${
                    isSelected
                      ? accentActive
                      : `text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 ${accentHover}`
                  }`}
                  style={{ paddingLeft: `${level * 12 + 24}px`, paddingRight: '8px' }}
                >
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? '' : 'text-slate-400'}`} />
                  <span className="truncate select-none">{node.name}</span>
                </button>
              </li>
            )
          }
        })}
      </ul>
    )
  }

  return (
    <div className="flex h-full min-h-[600px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#0A0A0F]">
      {/* Sidebar Tree */}
      <div className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-[#050508]">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
          <h2 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
            <Code2 className="w-4 h-4" /> Explorer
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 font-mono scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {loading ? (
            <div className="p-4 text-xs text-slate-500 animate-pulse">Loading tree...</div>
          ) : error ? (
            <div className="p-4 text-xs text-red-500">Failed to load repository tree.</div>
          ) : (
            renderTree(tree)
          )}
        </div>
      </div>
      
      {/* Code Viewer */}
      <div className="flex-1 bg-slate-50 dark:bg-[#0A0A0F] overflow-y-auto p-4 flex flex-col min-w-0">
        {selectedFile ? (
          <CodeViewer 
            key={selectedFile} 
            repoPath={`${repo}/${branch}/${selectedFile}`} 
            standalone 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 font-mono text-sm">
            <Code2 className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a file to view its source code</p>
          </div>
        )}
      </div>
    </div>
  )
}
