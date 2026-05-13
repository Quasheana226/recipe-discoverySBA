// Imports breakdown:
// - Link: needed for the "Find Recipes" button in the empty state. It's just a
//   navigation link so the user can go browse if they haven't saved anything yet.
// - useFavorites: this is how the page reads the list of saved IDs from localStorage.
//   The favorites array is just strings like ["52772", "53110"] — no names, no thumbnails.
// - useFetch: this might seem weird at first because the Favorites page doesn't look like
//   it fetches anything. But favorites only stores the meal IDs, not the actual recipe data.
//   So to render each saved recipe's image and title, this page has to go fetch that data
//   separately for each ID. That's what useFetch is here for.
// - RecipeCard: the same reusable card component every other page uses. It handles the
//   thumbnail, title, and heart button so this page doesn't have to think about any of that.
import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import { useFetch } from '../hooks/useFetch'
import RecipeCard from '../components/RecipeCard'

// FavoriteItem is NOT exported — it's only used inside this file. It exists as its own
// separate component instead of being inline in the .map() because it calls useFetch,
// and hooks can only be called inside a component or another hook. You can't call a hook
// inside a .map() callback because that would be calling a hook inside a regular function,
// which React doesn't allow. So each saved ID gets its own FavoriteItem component that
// is allowed to call useFetch on its own.
function FavoriteItem({ id }: { id: string }) {
    // Only destructuring data here — I don't need loading or error because the card
    // is designed to just silently wait and render nothing while the fetch is in flight.
    // If I had 10 saved recipes and showed a spinner for each one, the page would look
    // like a mess of 10 loading indicators. Rendering nothing is cleaner — the cards just
    // pop in one by one as each fetch resolves.
    const { data } = useFetch<{ meals: { idMeal: string; strMeal: string; strMealThumb: string }[] | null }>(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
    )

    // Breaking down each piece of optional chaining here:
    // - data?. — data is null while the fetch hasn't resolved yet, so ?. prevents a crash
    // - meals?. — the API can return null for the meals field if the ID doesn't exist
    // - [0] — the lookup endpoint always wraps the result in an array even for a single recipe,
    //   so I have to grab index 0 to get the actual meal object
    const meal = data?.meals?.[0]

    // Returning null is intentional. While data is still loading, meal is undefined, so this
    // component renders nothing at all. That means no empty card-shaped holes appear in the
    // grid while fetches are in progress — the cards just appear as they arrive. No layout
    // jumps, no placeholder boxes, just a clean grid that fills in naturally.
    if (!meal) return null

    // RecipeCard already handles everything — the image, the title, the heart button, and
    // the favorites toggle. FavoriteItem's only job is to fetch the data and hand it down.
    return <RecipeCard meal={meal} />
}

export default function Favorites() {
    // Only destructuring favorites here — I don't need toggleFavorite, addFavorite, or
    // removeFavorite on this page because RecipeCard handles the heart button internally
    // through its own call to useFavorites. This page just needs to know the list of IDs
    // so it knows what to render.
    const { favorites } = useFavorites()

    return (
        <div className="container">

            {/* Section 1 — page header */}
            <div className="page-header">
                <div className="section-title">❤️ My Favorites</div>

                {/* The pluralization ternary works like this:
                    - favorites.length !== 1 adds an 's' for any count that isn't exactly 1
                    - So 0 saved recipes, 2 saved recipes, 10 saved recipes all get an 's'
                    - But 1 saved recipe doesn't, so it reads "1 recipe" not "1 recipes"
                    The outer ternary switches between the count sentence and the fallback
                    message depending on whether anything is saved yet. */}
                <p className="section-subtitle">
                    {favorites.length > 0
                        ? `${favorites.length} saved recipe${favorites.length !== 1 ? 's' : ''}`
                        : 'No favorites saved yet'}
                </p>
            </div>

            {/* Section 2 — empty state.
                This is a specific SBA requirement: the favorites page must show a helpful
                message when nothing is saved instead of just a blank page. A blank page with
                no feedback would feel broken and the user wouldn't know what to do. */}
            {favorites.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">🤍</div>
                    <div className="empty-title">Nothing saved yet</div>
                    <p className="empty-text">
                        Browse recipes and tap the heart button to save your favorites.{' '}
                        {/* This second sentence is intentional reassurance — it tells the user
                            that favorites are saved to localStorage, so closing the tab or
                            refreshing the page won't wipe them out. */}
                        They will still be here when you come back!
                    </p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
                        🍳 Find Recipes
                    </Link>
                </div>
            )}

            {/* Section 3 — favorites grid.
                This is a separate condition from the empty state check above instead of
                an if/else because in JSX it's cleaner to have two self-contained conditional
                blocks when each branch has a lot of markup. A ternary with two big JSX trees
                is hard to read and easy to break. Two separate && conditions are clearer. */}
            {favorites.length > 0 && (
                <div className="grid-3" style={{ paddingBottom: '60px' }}>
                    {/* Each FavoriteItem fires off its own independent fetch for that recipe's
                        data. They all kick off at the same time and run in parallel — the page
                        doesn't wait for one to finish before starting the next. */}
                    {favorites.map((id) => (
                        // Using the meal ID as the key is perfect here — IDs are unique and
                        // never change, so React can reliably track each card in the list.
                        // Using the array index as a key would break if favorites ever got
                        // reordered because React would match the wrong component to the wrong slot.
                        <FavoriteItem key={id} id={id} />
                    ))}
                </div>
            )}
        </div>
    )
}
