import { useState, useEffect, useRef } from 'react'

interface FetchState<T> {
    data: T | null
    loading: boolean
    error: string | null
}

export function useFetch<T>(url: string): FetchState<T> {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const urlRef = useRef(url)

    useEffect(() => {
        urlRef.current = url

        if (!url) return

        const controller = new AbortController()

        async function fetchData() {
            setLoading(true)
            try {
                const res = await fetch(url, { signal: controller.signal })
                if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
                const json: T = await res.json()

                if (urlRef.current === url) {
                    setData(json)
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return
                setError('something went wrong. Please try again.')
            } finally {
                if (urlRef.current === url) {
                    setLoading(false)
                }
            }
        }

        fetchData()

        return () => controller.abort()
    }, [url])

    return { data, loading, error }
}
