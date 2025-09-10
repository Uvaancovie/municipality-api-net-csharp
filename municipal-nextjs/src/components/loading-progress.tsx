'use client'

import { useEffect, useState } from 'react'

interface LoadingProgressProps {
  isLoading: boolean
  className?: string
}

export function LoadingProgress({ isLoading, className = '' }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setProgress(100)
      return
    }

    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 200)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading && progress === 100) {
    return null
  }

  return (
    <div className={`w-full bg-gray-200 rounded-full h-1 overflow-hidden ${className}`}>
      <div
        className="bg-blue-600 h-1 rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          transition: isLoading ? 'width 0.3s ease-out' : 'width 0.1s ease-out',
        }}
      />
    </div>
  )
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded h-4 w-full mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
      <div className="bg-gray-200 rounded h-4 w-1/2"></div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="flex items-center mt-4 space-x-4">
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}
