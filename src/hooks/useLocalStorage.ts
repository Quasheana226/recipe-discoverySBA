import { useState, useEffect } from "react";

export function useLocalStorage<T>(
    key: string, // the local storage key to save 
    initialValue: T // value to use if nothing is saved 

): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            //First render from local storage 
            const item = window.localStorage.getItem(key)
            return item ? (JSON.parse(item) as T) : initialValue
        } catch {
            // if parsing fails fall to inital value 
            return initialValue
        }

    })

    //When storevalue changes the new value to local storage 
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue))
        } catch {
            // ignore localStorage write errors (e.g. private mode quota exceeded)
        }
    }, [key, storedValue])

    const setValue = (value: T | ((prev: T) => T)) => {
        setStoredValue((prev) =>
            typeof value === 'function' ? (value as (prev: T) => T)(prev) : value)
    }

    return [storedValue, setValue]
}