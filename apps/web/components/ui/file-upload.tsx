'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { UploadCloud, X, Loader2 } from 'lucide-react'

interface FileUploadProps {
  bucket: string
  folder?: string
  onUploadSuccess: (urls: string[]) => void
  onUploadError?: (error: Error) => void
  maxFiles?: number
  accept?: string
}

export function FileUpload({
  bucket,
  folder = 'uploads',
  onUploadSuccess,
  onUploadError,
  maxFiles = 5,
  accept = 'image/*,application/pdf'
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, url: string}[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true)
    else if (e.type === 'dragleave') setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files))
    }
  }

  const processFiles = async (files: File[]) => {
    if (files.length + uploadedFiles.length > maxFiles) {
      if (onUploadError) onUploadError(new Error(`Maximum ${maxFiles} files allowed`))
      return
    }

    setIsUploading(true)
    const newUploads: {name: string, url: string}[] = []

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const filePath = `${folder}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { cacheControl: '3600', upsert: false })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)
        
        newUploads.push({ name: file.name, url: publicUrl })
      } catch (err: unknown) {
        console.error('Upload error:', err)
        if (onUploadError) onUploadError(err as Error)
      }
    }

    setIsUploading(false)
    const combined = [...uploadedFiles, ...newUploads]
    setUploadedFiles(combined)
    onUploadSuccess(combined.map(f => f.url))
    
    // Reset input
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles]
    newFiles.splice(index, 1)
    setUploadedFiles(newFiles)
    onUploadSuccess(newFiles.map(f => f.url))
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${
          isDragging 
            ? 'border-violet-500 bg-violet-500/10' 
            : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          disabled={isUploading || uploadedFiles.length >= maxFiles}
        />
        
        <div className="flex flex-col items-center justify-center text-center space-y-2 pointer-events-none">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8 text-slate-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-white">
              {isUploading ? 'Uploading...' : 'Click or drag files here'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports images and PDFs up to 5MB
            </p>
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {uploadedFiles.map((file, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-800 aspect-square flex items-center justify-center">
              {file.url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                <Image src={file.url} alt={file.name} fill className="object-cover" />
              ) : (
                <div className="p-2 text-xs font-mono text-slate-300 break-all text-center">
                  {file.name}
                </div>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
