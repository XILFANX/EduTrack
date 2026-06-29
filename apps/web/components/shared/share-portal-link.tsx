'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Check, Share2, MessageCircle } from 'lucide-react'

interface Props {
  link: string
  label?: string
  className?: string
  message?: string
}

export function SharePortalLink({ link, label = "Share Portal", className = "", message = "" }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setIsOpen(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy link', err)
    }
  }

  const defaultMessage = message || `Here is your portal link:\n\n${link}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(defaultMessage)}`

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-xs font-medium transition-colors text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 ${className}`}
      >
        <Share2 className="w-3.5 h-3.5" />
        {label}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 rounded-xl bg-card border border-border shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-1 flex flex-col">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              Share via WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
