// Imports breakdown:
// - useParams: this is THE key import on this page. The whole point of Category is that
//   it renders different content depending on which category is in the URL. useParams is
//   how it reads that — it pulls the :name segment out of /category/Seafood and gives it
//   to the component as a plain string.
// - Link: needed for the back button at the top of the page. Even though this isn't the
//   home page, users need a way to get back to the category list without using the browser
//   back button — especially on mobile where that's less obvious.
// - useFetch: our custom hook that handles all the useState + useEffect + cleanup logic.
//   Without it I'd have to write all that boilerplate manually here just to make one fetch.
// - RecipeCard: instead of building a card layout directly in this file I'm importing the
//   shared component. RecipeCard already handles the image, title, heart button, and
//   navigation to the detail page — there's no reason to rewrite all of that here.
// - Spinner and ErrorMessage: same pattern as every other page — show Spinner while loading,
//   show ErrorMessage if the fetch fails.
import { useParams, Link } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import RecipeCard from '../components/RecipeCard'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

// This interface only has three fields even though a full meal object from TheMealDB has
// dozens. That's because the filter endpoint (/filter.php?c=) is a summary endpoint —
// it only sends back enough data to render a card. If you want the full recipe with
// instructions, ingredients, and a YouTube link, you have to make a separate lookup
// call on the detail page. Keeping this interface small is correct — TypeScript would
// complain if I added fields that the API doesn't actually send back from this endpoint.
interface MealSummary {
    idMeal: string
    strMeal: string
    strMealThumb: string
}

// meals is typed as MealSummary[] | null and not just MealSummary[] because TheMealDB
// specifically sends back null when a category has no results — not an empty array,
// literally null. If I typed it as just MealSummary[] TypeScript would think null is
// impossible and then the null check below would give me a lint warning, and worse,
// the runtime would crash if null actually came back.
interface FilterResponse {
    meals: MealSummary[] | null
}

export default function Category() {
    // When the user clicks Seafood on the home page, React Router sets the URL to
    // /category/Seafood. useParams reads the :name segment out of that URL and gives
    // us the string "Seafood". This is what makes this one component dynamic — the same
    // file renders completely different content depending on what is in the URL at the time.
    const { name } = useParams<{ name: string }>()

    // Two things worth explaining in this URL:
    // - encodeURIComponent: makes the category name URL-safe. Without it a category
    //   like "Pasta & Rice" would put a raw & in the URL and break the request. This
    //   converts it to "Pasta%20%26%20Rice" which the API handles fine.
    // - name ?? '': useParams could theoretically return undefined if someone visits
    //   /category/ with nothing after it. The ?? gives us an empty string fallback so
    //   the URL never has the literal text "undefined" in it, which would be a weird API call.
    const { data, loading, error } = useFetch<FilterResponse>(
        `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(name ?? '')}`
    )

    // Two operators doing two different jobs here:
    // - data?.: data is null while the fetch hasn't resolved yet. Without ?. trying to
    //   read .meals off null would throw a runtime error. The ?. makes it return undefined
    //   instead, which the ?? then catches.
    // - ?? []: replaces both undefined (data not arrived) and null (API returned no results)
    //   with an empty array so the .map() below always has something to work with.
    const meals = data?.meals ?? []

    return (
        <div className="container">
            <div className="page-header">

                {/* Quick escape hatch back to the categories grid without needing the browser
                    back button. This is especially useful on mobile where the back gesture
                    isn't always obvious or easy to hit. */}
                <Link to="/" className="back-btn">← All Categories</Link>

                {/* The span wraps just the category name so CSS can color it with --accent
                    (the pizza red). Without the span every word in the heading would be the
                    same color — the span is what makes the category name visually pop so the
                    user knows at a glance which category they are browsing. */}
                <div className="section-title">
                    <span style={{ color: 'var(--accent)' }}>{name}</span> Recipes
                </div>

                {/* Only render the count once the fetch has fully settled — no loading, no error.
                    Showing "0 recipes found" while the data is still downloading would look like
                    a bug. We only want this line to appear when we actually know the real answer. */}
                {!loading && !error && (
                    <p className="section-subtitle">
                        {meals.length} {meals.length === 1 ? 'recipe' : 'recipes'} found
                    </p>
                )}
            </div>

            {/* Shows while the API call is in flight. The moment the response comes back —
                success or failure — loading flips to false and this disappears automatically. */}
            {loading && <Spinner label="Loading recipes..." />}

            {/* Shows if the fetch itself failed — network error, server down, bad status code.
                The error string from useFetch gets passed straight down so ErrorMessage can
                display whatever actually went wrong without this component caring about formatting. */}
            {error && <ErrorMessage message={error} />}

            {/* This is a third separate condition and not combined with the error check above
                because "no results" and "fetch failed" are completely different situations.
                No results means the API worked perfectly, the category just happens to be empty.
                An error means the request itself broke. They need different messages. */}
            {!loading && !error && meals.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">🍽️</div>
                    <div className="empty-title">No recipes found</div>
                    <p className="empty-text">Try a different category.</p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
                        Browse Categories
                    </Link>
                </div>
            )}

            {/* Only renders when we have actual results to show. */}
            {!loading && !error && meals.length > 0 && (
                // paddingBottom gives the last row of cards breathing room so they're not
                // flush against the bottom edge of the browser window.
                <div className="grid-3" style={{ paddingBottom: '60px' }}>
                    {meals.map((meal) => (
                        // key={meal.idMeal} lets React efficiently track which card is which
                        // when the list updates. Using the actual meal ID is better than the
                        // array index because IDs are stable and unique — index-based keys
                        // break if the list ever gets reordered or filtered.
                        //
                        // RecipeCard handles everything internally — the image, title, heart
                        // button, favorites toggle, and the Link to the detail page. This page
                        // just passes the meal data down and RecipeCard takes care of the rest.
                        <RecipeCard key={meal.idMeal} meal={meal} />
                    ))}
                </div>
            )}
        </div>
    )
}
