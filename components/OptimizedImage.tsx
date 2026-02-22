'use client'

import React from "react"

import { useState } from 'react'
import Image from 'next/image'

interface OptimizedImageProps {
  src?: string | null
  alt: string
  fallback?: React.ReactNode
  className?: string
  width?: number
  height?: number
  priority?: boolean
}

export function OptimizedImage({
  src,
  alt,
  fallback,
  className = '',
  width = 40,
  height = 40,
  priority = false,
}: OptimizedImageProps) {
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Validate URL format
  const isValidUrl = (url: string) => {
    try {
      new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
      return true
    } catch {
      return false
    }
  }

  const hasValidSrc = src && isValidUrl(src) && !isError

  if (!hasValidSrc) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className={`${className} bg-gradient-to-br from-primary to-accent flex items-center justify-center`}>
        <span className="text-white font-bold text-xs">{alt.charAt(0).toUpperCase()}</span>
      </div>
    )
  }

  return (
    <>
      {isLoading && (
        <div className={`${className} bg-muted animate-pulse`} />
      )}
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : 'block'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsError(true)
          setIsLoading(false)
        }}
      />
    </>
  )
}
