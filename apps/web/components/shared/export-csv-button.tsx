'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportCSVButtonProps<T> {
  data: T[]
  filename: string
  columns: { header: string; key: keyof T | ((row: T) => string | number) }[]
  className?: string
}

export function ExportCSVButton<T extends Record<string, unknown>>({ data, filename, columns, className }: ExportCSVButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    if (!data || data.length === 0) return

    setIsExporting(true)
    
    try {
      // Create CSV header
      const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',')
      
      // Create CSV rows
      const rows = data.map(row => {
        return columns.map(col => {
          let value = ''
          
          if (typeof col.key === 'function') {
            value = String(col.key(row))
          } else {
            // Handle dot notation for nested objects if needed, 
            // but for simplicity we assume flat or pre-formatted data keys
            const val = row[col.key]
            value = val !== null && val !== undefined ? String(val) : ''
          }
          
          // Escape quotes and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`
        }).join(',')
      })

      const csvContent = [headers, ...rows].join('\n')
      
      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={`text-slate-600 ${className || ''}`}
      onClick={handleExport}
      disabled={isExporting || !data || data.length === 0}
    >
      <Download className="w-4 h-4 mr-2" />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  )
}
