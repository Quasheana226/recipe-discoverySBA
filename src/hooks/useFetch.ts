import { useState, useEffect, useRef } from 'react'

interface FetchState<T> {
    data: T | null
    loading: boolean
    error: string | null
}

// Lives outside the hook so it persists for the entire session — one Map shared across
// every useFetch call in the app. The key is the URL string, the value is whatever JSON
// came back. Gets cleared on page refresh, which is fine for our use case.
const cache = new Map<string, unknown>()

// Custom hook
//Handles every API call in the app passing a different url is all takes to fetch something new
export function useFetch<T>(url: string): FetchState<T> {
    // Initialize data from cache immediately if we've already fetched this URL before.
    // This means revisiting a category page shows the cards instantly instead of
    // re-fetching from the API every single time.
    const [data, setData] = useState<T | null>(() => (cache.get(url) as T) ?? null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    //Used a ref here to track the curretn url and ignore the old respone with out addin url as a dep that could cause extra renders \
    const urlRef = useRef(url)

    useEffect(() => {

        //No url means to skip the fetch all together
        if (!url) {
            setLoading(false)
            return
        }

        // Already have this data — skip the network request entirely.
        if (cache.has(url)) {
            setData(cache.get(url) as T)
            setLoading(false)
            return
        }

        urlRef.current = url
        setLoading(true)
        setError(null)

        const controller = new AbortController()

        async function fetchData() {
            try {
                const res = await fetch(url, { signal: controller.signal })

                if (!res.ok) throw new Error(`HTTP error: ${res.status}`)

                const json: T = await res.json()

                // Store in cache before setting state so any other hook instance
                // waiting on the same URL also gets the result immediately.
                cache.set(url, json)

                if (urlRef.current === url) {
                    setData(json)
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') {
                    return
                }
                if (err instanceof Error) setError(err.message)
            } finally {
                if (urlRef.current === url) setLoading(false)
            }
        }

        fetchData()
        return () => controller.abort()

    }, [url])

    return { data, loading, error }
}
