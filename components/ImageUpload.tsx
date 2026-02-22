'use client'

import React from "react"

import { useState, useRef } from 'react'
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react'

interface ImageUploadProps {
  onUploadComplete: (url: string, filename?: string) => void
  onError?: (error: string) => void
  endpoint?: string
  maxSize?: number
  preview?: string
  onRemove?: () => void
  label?: string
  acceptedFormats?: string
}

export function ImageUpload({
  onUploadComplete,
  onError,
  endpoint = '/api/upload',
  maxSize = 5 * 1024 * 1024,
  preview,
  onRemove,
  label = 'Upload Image',
  acceptedFormats = 'image/jpeg,image/png,image/gif,image/webp'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setError(null)
    setSuccess(false)

    // Validate file size
    if (file.size > maxSize) {
      const sizeMB = (maxSize / (1024 * 1024)).toFixed(0)
      const errorMsg = `File too large (max ${sizeMB}MB)`
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      const errorMsg = 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: `Upload failed with status ${response.status}` }
        }
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      if (!data.url) {
        throw new Error('No URL returned from server')
      }

      setSuccess(true)
      onUploadComplete(data.url, data.filename)
      
      // Reset success message after 2 seconds
      setTimeout(() => setSuccess(false), 2000)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMsg)
      onError?.(errorMsg)
      console.error('[v0] Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div className="space-y-3 w-full">
      {preview ? (
        <div className="space-y-3">
          <div className="relative inline-block">
            <img
              src={preview || "/placeholder.svg"}
              alt="Preview"
              className="w-32 h-32 rounded-lg object-cover border border-border"
            />
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full hover:bg-destructive/90 transition z-10"
              >
                <X size={16} className="text-white" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition"
          >
            Change Image
          </button>
        </div>
      ) : (
        <div className="w-full">
          <label
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition group"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
              <Upload size={24} className="text-muted-foreground group-hover:text-primary mb-2 transition" />
              <p className="text-sm text-foreground font-medium">Click or drag image here</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF, WebP up to 5MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={acceptedFormats}
              onChange={handleInputChange}
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle size={16} className="text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <CheckCircle size={16} className="text-primary flex-shrink-0" />
          <p className="text-sm text-primary">Image uploaded successfully!</p>
        </div>
      )}

      {/* Loading State */}
      {isUploading && (
        <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-accent">Uploading...</p>
        </div>
      )}
    </div>
  )
}
