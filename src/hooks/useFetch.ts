import { useState, useEffect, useRef } from 'react'

interface FetchState<T> {
    data: T | null
    loading: boolean
    error: string | null
}

// Custom hook
//Handles every API call in the app passing a different url is all takes to fetch something new 
export function useFetch<T>(url: string): FetchState<T> {
    const [data, setData] = useState<T | null>(null)
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
        urlRef.current = url
        setLoading(true)
        setError(null)

        // console.log('useFetch fetching:', url )


        const controller = new AbortController()

        async function fetchData() {
            try {
                const res = await fetch(url, { signal: controller.signal })

                if (!res.ok) throw new Error(`HTTP error: ${res.status}`)

                const json: T = await res.json()

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
