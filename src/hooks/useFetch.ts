import { useState, useEffect, useRef } from 'react'

// <T> = “whatever type you pass in”
interface FetchState<T> {
    data: T | null
    loading: booolean
    error: string | null
}