// This component is reused on three different pages: Category, Favorites, and Search.
// Keeping it as one single component means the card styling and favorites logic only
// need to be written once — if I need to change the heart button or the card layout,
// I only change it here instead of hunting it down in three separate files.

import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'

// I'm only defining the three fields that RecipeCard actually needs to render.
// The full meal object from the MealDB API has over 20 fields (ingredients, instructions,
// YouTube links, etc.) but this card just shows a thumbnail, a title, and needs the id
// to build the route URL and track favorites. Keeping the interface small means I can
// pass a "lite" version of the meal from search results or category lists without
// having to fetch every single field just to render a card.
interface Props {
    meal: {
        idMeal: string
        strMeal: string
        strMealThumb: string
    }
}

export default function RecipeCard({ meal }: Props) {
    // useFavorites gives us two things from the shared context:
    // - isFavorite: a function that checks if a meal id is in the saved favorites list
    // - toggleFavorite: a function that adds the meal if it isn't saved, or removes it if it is
    const { isFavorite, toggleFavorite } = useFavorites()

    // This boolean tells me right now, at render time, whether this specific meal
    // is already in the user's favorites. I use it to decide which emoji to show
    // and whether to add the "active" class to the heart button.
    const fav: boolean = isFavorite(meal.idMeal)

    // I need both preventDefault AND stopPropagation here.
    // preventDefault stops the browser from doing anything unexpected with the button click.
    // stopPropagation is the important one — without it, clicking the heart button would
    // bubble up through the DOM, hit the parent <Link>, and navigate the user to the
    // recipe detail page. I don't want that. I just want to toggle the favorite.
    // Calling stopPropagation keeps the click event from reaching the Link.
    function handleFav(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(meal.idMeal)
    }

    return (
        <div className="card">
            {/* The entire card area is wrapped in a Link so clicking anywhere on the
                card (image or title) takes you to the recipe detail page.
                The heart button lives outside this Link so it doesn't trigger navigation. */}
            <Link to={`/recipe/${meal.idMeal}`}>
                <div className="card-img-wrap">
                    <img
                        className="card-img"
                        src={meal.strMealThumb}
                        alt={meal.strMeal}
                        loading="lazy"
                    />
                </div>
                <div className="card-body">
                    <div className="card-title">{meal.strMeal}</div>
                </div>
            </Link>

            {/* The aria-label changes based on whether the meal is already saved.
                This is for accessibility — screen readers will read the label out loud
                so a user who can't see the emoji still knows what the button does.
                The "active" class is what makes the button look visually different
                (filled vs outline style) and is controlled purely through CSS. */}
            <button
                className={`card-fav-btn${fav ? ' active' : ''}`}
                onClick={handleFav}
                aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
            >
                {fav ? '❤️' : '🤍'}
            </button>
        </div>
    )
}
