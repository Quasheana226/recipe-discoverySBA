// Imports breakdown:
// - useParams: this page needs the meal ID from the URL (/recipe/52772) to know which
//   recipe to fetch. Home doesn't need useParams because it always fetches the same
//   categories endpoint — there's nothing in the URL to read. This page is different
//   because every recipe has a different ID in the path.
// - Link: needed for the back button to the category page and the not-found empty state.
// - useFetch: handles all the useState + useEffect fetch logic. Without it I'd have to
//   write that boilerplate manually every time I need to hit an API.
// - useFavorites: needed alongside useFetch because this page does two separate things —
//   fetch the recipe data AND let the user save/unsave it. useFetch handles the data,
//   useFavorites handles the heart button. Both are required here at the same time.
// - Spinner and ErrorMessage: same pattern as every other page.
import { useParams, Link } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { useFavorites } from '../context/FavoritesContext'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'

// The index signature [key: string]: string | null is the important part here.
// TheMealDB stores ingredients as strIngredient1 through strIngredient20 and measures
// as strMeasure1 through strMeasure20. To read those dynamically I need bracket notation
// like meal['strIngredient' + i]. Without the index signature TypeScript would throw
// an error saying you can't access a Meal with an arbitrary string key — it only knows
// about the fields explicitly defined below.
//
// strTags is string | null specifically because the API sends actual null for that field
// when a recipe has no tags — not an empty string, not undefined, literally null.
// If I typed it as just string TypeScript would be wrong about what could come back.
interface Meal {
    idMeal: string
    strMeal: string
    strCategory: string
    strArea: string
    strInstructions: string
    strMealThumb: string
    strTags: string | null
    strYoutube: string
    [key: string]: string | null
}

// The API always wraps the result in an array even when you look up a single recipe by ID.
// You never get back just { idMeal: ..., strMeal: ... } — you always get
// { meals: [{ idMeal: ..., strMeal: ... }] }. So the type is Meal[] | null, not just Meal.
// null happens when the ID doesn't exist in the database at all.
interface MealResponse {
    meals: Meal[] | null
}

// The API gives back a full YouTube URL like https://www.youtube.com/watch?v=ABC123
// but the iframe embed needs just the video ID (ABC123) in the src URL.
// This function pulls the ID out of whatever format the URL is in.
//
// The regex handles two formats:
// - Standard watch URL: youtube.com/watch?v=ABC123 (matches after v=)
// - Short URL: youtu.be/ABC123 (matches after youtu.be/)
// The [^&\s]+ part matches everything after the ID marker up until an & or a space.
function getYouTubeId(url: string): string | null {
    if (!url) return null
    const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)
    return match ? match[1] : null
}

// The API has exactly 20 ingredient slots (strIngredient1–strIngredient20) on every
// meal object, but most recipes only use some of them. The rest come back as empty
// strings or null. This function loops through all 20 and filters out the empty ones
// so I get a clean array of only the actual ingredients.
//
// Without the null/empty check, blank ingredient slots would show up as empty rows
// in the ingredient list which would look broken.
function getIngredients(meal: Meal): { name: string; measure: string }[] {
    const result: { name: string; measure: string }[] = []
    for (let i = 1; i <= 20; i++) {
        const name = meal['strIngredient' + i]
        const measure = meal['strMeasure' + i]
        if (name && name.trim() !== '') {
            result.push({
                name: name.trim(),
                measure: measure?.trim() ?? '',
            })
        }
    }
    return result
}

export default function RecipeDetail() {
    // id comes directly from the URL path. If the user visits /recipe/52772 then
    // id is the string "52772". This is what gets passed to the API to fetch the
    // specific recipe — without it we'd have no idea which one to look up.
    const { id } = useParams<{ id: string }>()

    // This endpoint returns the full recipe object — instructions, all 20 ingredient
    // slots, tags, YouTube link, everything. It's different from the search or filter
    // endpoints which only return summary fields like idMeal, strMeal, and strMealThumb.
    const { data, loading, error } = useFetch<MealResponse>(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
    )

    // I only need these two from the context. isFavorite tells me right now whether
    // this recipe is already saved, toggleFavorite handles both add and remove with
    // one function so I don't need separate addFavorite and removeFavorite here.
    const { isFavorite, toggleFavorite } = useFavorites()

    // Early return while loading — nothing else renders at all until the fetch finishes.
    // This prevents the rest of the component from trying to read properties off a null
    // meal object, which would throw a runtime error.
    if (loading) {
        return (
            <div className="page-loader">
                <Spinner label="Loading recipe..." />
            </div>
        )
    }

    // Early return for fetch failures — network error, bad HTTP status, etc.
    // This is a different situation from "recipe not found" — here the request itself broke.
    if (error) {
        return (
            <div className="container" style={{ paddingTop: 48 }}>
                <ErrorMessage message={error} />
            </div>
        )
    }

    // Early return when the fetch succeeded but the ID wasn't in the database.
    // A 200 response with { meals: null } is not an error in the fetch sense — the
    // request worked fine, the API just has no record for that ID. That's why this
    // is a separate check from the error block above.
    const meal = data?.meals?.[0]
    if (!meal) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🍽️</div>
                <div className="empty-title">Recipe not found</div>
                <Link to="/" className="btn btn-primary">
                    Browse Categories
                </Link>
            </div>
        )
    }

    // Calls the helper above to turn the 20 strIngredient/strMeasure fields into a
    // clean array — empty slots already filtered out before this line.
    const ingredients = getIngredients(meal)

    // Checks FavoritesContext at render time to see if this recipe is currently saved.
    // This boolean controls which label and class the favorites button gets.
    const isFav = isFavorite(meal.idMeal)

    // Will be null if the recipe has no YouTube link or the URL is empty.
    // The video section only renders when this is not null.
    const videoId = getYouTubeId(meal.strYoutube)

    // strTags comes as a comma-separated string like "Pasta,Italian,Dinner" so I have
    // to split it manually. Many recipes have null tags so the null check before split
    // is required — calling .split() on null would throw a runtime error.
    const tags = meal.strTags
        ? meal.strTags.split(',').map((t) => t.trim()).filter(Boolean)
        : []

    return (
        <>
            {/* Hero section — full-width image with text overlaid on top.
                The CSS applies filter: brightness(0.32) to the img so the white
                text overlay is readable even on bright food photos. */}
            <div className="recipe-hero">
                <img src={meal.strMealThumb} alt={meal.strMeal} />

                <div className="recipe-hero-overlay">
                    <div className="recipe-hero-content">

                        {/* Goes back to the category this recipe belongs to, not just
                            the home page. So if you got here from /category/Seafood,
                            clicking this takes you back to /category/Seafood specifically. */}
                        <Link to={`/category/${meal.strCategory}`} className="back-btn">
                            ← {meal.strCategory}
                        </Link>

                        {/* clamp(1.8rem, 5vw, 3rem) makes the title scale with the screen —
                            on small screens it won't go below 1.8rem, on big screens it
                            won't go above 3rem. No media queries needed. */}
                        <h1 style={{
                            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                            fontWeight: 900,
                            letterSpacing: '-0.02em',
                            marginBottom: '0.75rem',
                        }}>
                            {meal.strMeal}
                        </h1>

                        {/* Just visual labels — not links. They tell the user the origin
                            and category of the dish at a glance without needing to click anything. */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <span className="badge">{meal.strArea}</span>
                            <span className="badge">{meal.strCategory}</span>
                        </div>

                        {/* This is a core SBA requirement — the favorites button on the detail
                            page must be wired up to FavoritesContext so it stays in sync with
                            the heart buttons on the cards. toggleFavorite handles both save
                            and unsave so I don't need separate handlers. */}
                        <button
                            className={`fav-detail-btn ${isFav ? 'remove' : 'add'}`}
                            onClick={() => toggleFavorite(meal.idMeal)}
                        >
                            {isFav ? '💔 Remove from Favorites' : '❤️ Add to Favorites'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Two-column layout — instructions on the left, ingredients on the right. */}
            <div className="recipe-detail">

                {/* Left column */}
                <div>
                    {/* Only render the tag container when there are actual tags.
                        If tags is empty this block is skipped entirely so there's
                        no empty div sitting there taking up space. */}
                    {tags.length > 0 && (
                        <div className="recipe-tags">
                            {tags.map((tag) => (
                                <span key={tag} className="badge">{tag}</span>
                            ))}
                        </div>
                    )}

                    <div className="recipe-section-title">Instructions</div>

                    {/* The CSS on this class has white-space: pre-line which preserves
                        the line breaks that are already baked into the instructions string
                        from the API. Without that the whole block would collapse into
                        one giant wall of text. */}
                    <p className="recipe-instructions">{meal.strInstructions}</p>

                    {/* Only render the video section when the API actually provided a
                        YouTube link. videoId is null if the URL was missing or couldn't
                        be parsed, so this block is safely skipped in that case. */}
                    {videoId && (
                        <>
                            <div className="recipe-section-title">📹 Video Tutorial</div>
                            <div className="video-wrap">
                                {/* allowFullScreen has to be written as a prop in React JSX
                                    even though in plain HTML it's just a bare attribute with
                                    no value. React treats it as a boolean prop. */}
                                <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={`${meal.strMeal} video tutorial`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Right column — ingredient list */}
                <div className="recipe-ingredients">

                    {/* Showing the count upfront so the user knows how many items they
                        need before they start reading the list. */}
                    <h3>🛒 Ingredients ({ingredients.length})</h3>

                    {/* key={ing.name} works here because ingredient names within a single
                        recipe are always unique — you'd never have two "Salt" entries
                        on the same recipe. So the name is a safe key. */}
                    {ingredients.map((ing) => (
                        <div key={ing.name} className="ingredient-item">
                            <span className="ingredient-name">{ing.name}</span>
                            <span className="ingredient-measure">{ing.measure}</span>
                        </div>
                    ))}

                    {/* Second favorites button inside the ingredients panel so the user
                        can save the recipe without scrolling back up to the hero. */}
                    <button
                        className={`fav-detail-btn ${isFav ? 'remove' : 'add'}`}
                        onClick={() => toggleFavorite(meal.idMeal)}
                        style={{ width: '100%', marginTop: 20 }}
                    >
                        {isFav ? '💔 Remove from Favorites' : '❤️ Add to Favorites'}
                    </button>
                </div>
            </div>
        </>
    )
}
