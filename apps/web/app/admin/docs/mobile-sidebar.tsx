'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronRight, Terminal } from 'lucide-react'
import { devGuides, type DevGuideGroup } from './docs-config'

export function MobileDocsSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="sm:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-72 max-w-[calc(100vw-3rem)] h-full bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col overflow-y-auto">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <nav className="mt-8 space-y-8">
              <div>
                <h3 className="font-bold text-white mb-3 text-xs tracking-widest uppercase">[Global]</h3>
                <ul className="space-y-1.5">
                  <li>
                    <Link 
                      href="/admin/docs/codebase" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm rounded border border-transparent hover:bg-zinc-900 hover:border-zinc-800 hover:text-white transition-all text-zinc-400 group"
                    >
                      <Terminal className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                      <span className="truncate">Code Explorer</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {devGuides.map((group) => (
                <div key={group.category}>
                  <h3 className="font-bold text-white mb-3 text-xs tracking-widest uppercase">[{group.category}]</h3>
                  <ul className="space-y-1.5">
                    {group.items.map((guide) => {
                      const Icon = guide.icon || ChevronRight
                      return (
                        <li key={guide.slug}>
                          <Link 
                            href={`/admin/docs/${guide.slug}`} 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm rounded border border-transparent hover:bg-zinc-900 hover:border-zinc-800 hover:text-blue-400 transition-all text-zinc-400 group"
                          >
                            <Icon className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                            <span className="truncate">{guide.title}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
