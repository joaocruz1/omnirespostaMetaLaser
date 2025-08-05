"use client"

import { useState, useCallback } from "react"

interface MediaCache {
  [key: string]: string
}

export function useMediaCache() {
  const [cache, setCache] = useState<MediaCache>({})
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set())

  const getCachedMedia = useCallback(
    (key: string) => {
      return cache[key] || null
    },
    [cache],
  )

  const setCachedMedia = useCallback((key: string, url: string) => {
    setCache((prev) => ({ ...prev, [key]: url }))
  }, [])

  const isLoading = useCallback(
    (key: string) => {
      return loadingSet.has(key)
    },
    [loadingSet],
  )

  const updateLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingSet((prev) => {
      const newSet = new Set(prev)
      if (isLoading) {
        newSet.add(key)
      } else {
        newSet.delete(key)
      }
      return newSet
    })
  }, [])

  const clearCache = useCallback(() => {
    setCache({})
    setLoadingSet(new Set())
  }, [])

  return {
    getCachedMedia,
    setCachedMedia,
    isLoading,
    updateLoading,
    clearCache,
  }
}
