// Imports breakdown:
// - useLocation: this is how the page reads the search term from the URL. The search term
//   lives in the query string (?query=chicken), not in the URL path itself, so useParams
//   won't work here — useParams only reads path segments like /recipe/:id. useLocation
//   gives us the whole URL including the ?query= part.
// - Link: needed for the "Browse Categories" button in the empty state. It's just a
//   navigation link back to the home page when no results come back.
// - useMemo: used to avoid recreating the URLSearchParams object on every render.
// - useFetch: our custom hook that handles useState, useEffect, and fetch cleanup.
//   Without it I'd have to write all that boilerplate here manually.
// - RecipeCard: the reusable card component that already handles the thumbnail, title,
//   and heart button. This page just passes the meal data down and lets RecipeCard do its thing.
// - Spinner and ErrorMessage: same pattern as every other page — Spinner while loading,
//   ErrorMessage if the fetch fails.
import { useLocation, Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useFetch } from '../hooks/useFetch'
import RecipeCard from '../components/RecipeCard'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

// These are the only three fields the search endpoint returns per meal.
// The /search.php endpoint gives back summary objects — not full meal details.
// There are no ingredients, instructions, or YouTube links here. Just enough
// to render a card and link to the detail page.
interface MealSummary {
    idMeal: string
    strMeal: string
    strMealThumb: string
}

// The meals field is MealSummary[] | null and not just MealSummary[] because
// TheMealDB actually returns null (not an empty array) when nothing matches.
// If I typed it as just MealSummary[], TypeScript would be wrong about what
// could come back from the API and I'd get a runtime crash trying to .map() over null.
interface SearchResponse {
    meals: MealSummary[] | null
}

export default function SearchResults() {
    // useLocation gives us the current URL object. We need it here because the search
    // term lives in location.search — the ?query=chicken part of the URL. This page
    // never gets the query as a prop, it reads it straight from the URL itself.
    const location = useLocation()

    // Breaking this down piece by piece:
    // - location.search is the raw query string, e.g. "?query=chicken"
    // - new URLSearchParams(location.search) parses that string into key-value pairs
    //   so we can look up individual params by name instead of slicing strings manually.
    // - .get('query') pulls out the value for the key named "query"
    // - ?? '' means if there's no query param in the URL at all it falls back to an
    //   empty string instead of null, which keeps the rest of the logic cleaner.
    //
    // useMemo wraps all of this because URLSearchParams would otherwise get recreated
    // on every single render, even when the URL hasn't changed at all. Memoizing it
    // means it only recalculates when location.search actually changes.
    const query = useMemo(
        () => new URLSearchParams(location.search).get('query') ?? '',
        [location.search]
    )

    // If query is an empty string we pass '' to useFetch. The useFetch hook checks
    // for an empty string and skips the fetch entirely — this prevents a pointless
    // API call when the page loads without a search term in the URL.
    //
    // encodeURIComponent converts spaces and special characters into URL-safe codes
    // (e.g. "pasta bake" → "pasta%20bake"). Without it a space in the search term
    // would break the request URL.
    const { data, loading, error } = useFetch<SearchResponse>(
        query ? `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}` : ''
    )

    // data?.meals: the ?. means if data is still null while loading, it won't crash.
    // ?? []: catches both null (no results from API) and undefined (data not arrived yet)
    // and replaces either with an empty array so .map() always has something to work with.
    const meals = data?.meals ?? []

    return (
        <div className="container">
            <div className="page-header">
                {/* The <span> wraps the query word so CSS can give it the accent color
                    and make it visually distinct from the "Results for" label text. */}
                <h1 className="search-title">
                    Results for <span>"{query}"</span>
                </h1>

                {/* Only render the count after data has fully arrived — no loading, no error.
                    Showing "0 recipes found" while the fetch is still in flight would be
                    misleading. We only want this text to appear once we actually know the answer. */}
                {!loading && !error && (
                    <p className="search-count">
                        {meals.length} {meals.length === 1 ? 'recipe' : 'recipes'} found
                    </p>
                )}
            </div>

            {/* Only visible while the API call is in progress. Disappears the moment
                data or an error comes back and loading flips to false. */}
            {loading && <Spinner label="Searching..." />}

            {/* Only visible if the fetch actually failed. The error string from useFetch
                gets passed straight down as a prop so ErrorMessage handles the display. */}
            {error && <ErrorMessage message={error} />}

            {/* This is a separate condition from the error check above because "no results"
                and "fetch failed" are two completely different situations that need different
                messages. An error means something went wrong. Zero meals means the API
                worked fine but just didn't find anything matching the search term. */}
            {!loading && !error && meals.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-title">No results for "{query}"</div>
                    <p className="empty-text">
                        Try a different search term or browse by category instead.
                    </p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
                        Browse Categories
                    </Link>
                </div>
            )}

            {/* RecipeCard already handles the heart button and all the favorites logic
                internally via useFavorites. This page just passes the meal data down
                and doesn't need to know anything about how favorites work. */}
            {!loading && !error && meals.length > 0 && (
                <div className="grid-3" style={{ paddingBottom: '60px' }}>
                    {meals.map((meal) => (
                        <RecipeCard key={meal.idMeal} meal={meal} />
                    ))}
                </div>
            )}
        </div>
    )
}