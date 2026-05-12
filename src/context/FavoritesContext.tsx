import { createContect, useContext, ReactNode } from 'react'

import { useLocalStorage } from '../hooks/useLocalStorage'

// Everything the context need to provide to the rest of the app 
interface FavoritesConextType {
    favorites: string[] // An array of maeal ids 
    addFavorite: (id: string) => void
    removeFavorite: (id: string) => void
    isFavorite: (id: string) => void
    toggelFavorite: (id: string) => void
}

