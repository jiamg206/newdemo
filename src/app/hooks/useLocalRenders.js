import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clearRenders, listRenders, removeRender, saveRenderBlob } from '../utils/renderStore'

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl)
  return res.blob()
}

export function useLocalRenders() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const objectUrlsRef = useRef([])

  const releaseObjectUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current = []
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const rows = await listRenders()
      releaseObjectUrls()
      const next = rows.map((row) => {
        const previewUrl = URL.createObjectURL(row.blob)
        objectUrlsRef.current.push(previewUrl)
        return {
          id: row.id,
          previewUrl,
          createdAt: row.createdAt,
          meta: row.meta || {},
        }
      })
      setItems(next)
    } catch {
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [releaseObjectUrls])

  const saveFromDataUrl = useCallback(
    async (dataUrl, meta = {}) => {
      const blob = await dataUrlToBlob(dataUrl)
      await saveRenderBlob(blob, meta)
      await refresh()
    },
    [refresh],
  )

  const remove = useCallback(
    async (id) => {
      await removeRender(id)
      await refresh()
    },
    [refresh],
  )

  const clearAll = useCallback(async () => {
    await clearRenders()
    await refresh()
  }, [refresh])

  useEffect(() => {
    refresh()
    return releaseObjectUrls
  }, [refresh, releaseObjectUrls])

  const hasItems = useMemo(() => items.length > 0, [items.length])

  return {
    items,
    isLoading,
    hasItems,
    refresh,
    saveFromDataUrl,
    remove,
    clearAll,
  }
}
