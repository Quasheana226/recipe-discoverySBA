import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

import { useLocalStorage } from '../hooks/useLocalStorage'

// Everything the context need to provide to the rest of the app 
interface FavoritesConextType {
    favorites: string[] // An array of maeal ids 
    addFavorite: (id: string) => void
    removeFavorite: (id: string) => void
    isFavorite: (id: string) => boolean
    toggleFavorite: (id: string) => void
}

//null default so Typescript yells at me if i forget  the provider 
const FavoritesContext = createContext<FavoritesConextType | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useLocalStorage<string[]>('pizza-app-favorites', [])

    const addFavorite = (id: string) => {
        // console.log('Adding favorite', id)
        setFavorites((prev) => (prev.includes(id) ? prev : [...prev, id]))
    }

    const removeFavorite = (id: string) => {
        //console.log('Removing favorite', id)
        setFavorites((prev) => prev.filter((favId) => favId !== id))
    }

    const isFavorite = (id: string) => {
        return favorites.includes(id)
    }

    const toggleFavorite = (id: string) => {
        if (isFavorite(id)) {
            removeFavorite(id)
        } else {
            addFavorite(id)
        }
    }

    return (
        <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }}>
            {children}
        </FavoritesContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFavorites() {
    const ctx = useContext(FavoritesContext)
    if (!ctx) {
        throw new Error('useFavorites must be used within a FavoritesProvider')
    }
    return ctx
}