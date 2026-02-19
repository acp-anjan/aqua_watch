import { useState, useEffect } from 'react'

interface MockDataResult<T> {
  data:    T | null
  loading: boolean
  error:   string | null
}

/**
 * Simulates an async API call by loading static mock JSON.
 * filterFn is applied client-side after load.
 * delay is the fake "network" latency in ms (default 500ms).
 */
export function useMockData<T>(
  loader: () => Promise<{ default: T }>,
  filterFn?: (data: T) => T,
  delay = 500
): MockDataResult<T> {
  const [data,    setData]    = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const [mod] = await Promise.all([
          loader(),
          new Promise(r => setTimeout(r, delay)),
        ])
        if (cancelled) return
        const raw = mod.default
        setData(filterFn ? filterFn(raw) : raw)
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, loading, error }
}
