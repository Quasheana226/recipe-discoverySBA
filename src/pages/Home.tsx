// Imports breakdown:
// - Link is from react-router-dom. I need it for the hero buttons and the category cards
//   because they're all just navigation — no active-state highlighting needed, so NavLink
//   would be overkill here.
// - useFetch is our custom hook that handles useState + useEffect internally. Without it
//   I'd have to write all that boilerplate (declare state, run useEffect, handle cleanup)
//   separately on every single page. With it, one line does all of that.
// - Spinner shows a loading indicator while the API call is still in flight. I need it here
//   because the categories endpoint can take a second and I don't want to show a blank page.
// - ErrorMessage handles the case where the fetch fails. I pass the error string down to it
//   so it can display something friendly instead of just crashing.
import { Link } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import Spinner from "../components/Spinner";
import ErrorMessage from "../components/ErrorMessage";

// These are the only three fields from the categories endpoint that this page actually uses.
// The full API response has more fields like strCategoryDescription and strCategoryThumb
// but the card only shows a name, a thumbnail image, and needs the id as the React key.
// Keeping the interface small means TypeScript won't complain about fields I'm ignoring.
interface Category {
    idCategory: string;
    strCategory: string;
    strCategoryThumb: string;
}

// This matches the exact shape TheMealDB sends back from the categories endpoint.
// The data doesn't come back as a plain array — it comes wrapped inside an object
// like { categories: [...] }. If I typed this as Category[] directly it would break
// because useFetch would be trying to read .categories off an array, not an object.
interface CategoriesResponse {
    categories: Category[];
}

export default function Home() {
    // useFetch is doing all the heavy lifting here — it manages the loading state,
    // runs the fetch inside a useEffect, and returns the result. Without this hook
    // I'd have to write useState for data, loading, and error plus a whole useEffect
    // block with cleanup just to make one API call. This one line replaces all of that.
    const { data, loading, error } = useFetch<CategoriesResponse>(
        "https://www.themealdb.com/api/json/v1/1/categories.php",
    );

    // Two things happening here:
    // - data?.categories: the ?. (optional chaining) means if data is still null while
    //   the fetch is in flight, it won't throw "Cannot read properties of null". It just
    //   returns undefined instead.
    // - ?? []: the ?? (nullish coalescing) catches that undefined and replaces it with an
    //   empty array so the .map() below always has something to iterate over, even before
    //   the data arrives.
    const categories = data?.categories ?? [];

    return (
        <>
            {/* The parallax scrolling effect on this section comes entirely from CSS —
                specifically background-attachment: fixed on the .hero class. No JavaScript
                or scroll event listeners needed. The background image just stays fixed
                while the content scrolls over it. */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-eyebrow">Recipe Discovery App</div>

                    {/* The <span> around "Perfect" is only here so CSS can target that
                        one word and give it the accent color. Without the span, every word
                        in the h1 would be the same color and there'd be no visual emphasis. */}
                    <h1>
                        Find Your <span>Perfect</span> Recipe
                    </h1>

                    <p>
                        Browse hundreds of dishes from every corner of the world. Pick a
                        category and start cooking.
                    </p>

                    <div className="hero-actions">
                        {/* The query param is pre-filled with "pizza" so clicking this
                            button immediately lands on pizza search results — the user
                            doesn't have to type anything. The SearchResults page reads
                            this value out of the URL using useSearchParams. */}
                        <Link to="/search?query=pizza" className="btn btn-primary">
                            Find Recipes
                        </Link>

                        <Link to="/favorites" className="btn btn-ghost">
                            ❤️ Saved Recipes
                        </Link>
                    </div>
                </div>
            </section>

            <div className="container">
                <section className="section">
                    <div className="section-title">What are you feeling?</div>
                    <p className="section-subtitle">
                        Pick a category to see all the recipes inside it
                    </p>

                    {/* This only renders while the fetch is still in flight.
                        The moment data or an error comes back, loading flips to false
                        and this disappears automatically. */}
                    {loading && <Spinner label="Loading categories..." />}

                    {/* This only shows up if the fetch actually failed.
                        The error string gets passed down as a prop so ErrorMessage
                        can display whatever went wrong without this component needing
                        to know how errors are formatted or styled. */}
                    {error && <ErrorMessage message={error} />}

                    {/* I check BOTH !loading AND !error before rendering the grid.
                        Just checking !loading isn't enough — if the fetch failed,
                        loading would also be false but data would be empty and we'd
                        show a blank grid. Both conditions together mean: data arrived
                        successfully, now show it. */}
                    {!loading && !error && (
                        <div className="grid-4">
                            {categories.map((cat) => (
                                // React needs a unique key on every list item so it can
                                // track which cards changed, moved, or were removed between
                                // renders. idCategory is the right choice here because it's
                                // guaranteed unique by the API — using the index would break
                                // if the list ever got reordered.
                                <Link
                                    key={cat.idCategory}
                                    to={"/category/" + cat.strCategory}
                                    className="cat-card"
                                >
                                    <div className="cat-card-img-wrap">
                                        {/* loading="lazy" tells the browser to skip downloading
                                            this image until it's about to scroll into view.
                                            Without it the browser would try to fetch all the
                                            category thumbnails at once on page load, which
                                            would be way more network requests than needed. */}
                                        <img
                                            src={cat.strCategoryThumb}
                                            alt={cat.strCategory}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="cat-card-body">
                                        <span className="cat-card-name">{cat.strCategory}</span>
                                        <span className="cat-card-arrow">→</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
