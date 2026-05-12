// Imports breakdown:
// - useState and FormEvent come from React. useState manages the search input value,
//   FormEvent types the submit handler so TypeScript knows it's a form event.
// - Link is for the logo because it's just a plain nav link with no active styling needed.
// - NavLink is for the nav links because it gives us the isActive flag so we can
//   highlight whichever page the user is currently on.
// - useNavigate is for the search form because we need to redirect programmatically
//   from inside a function — you can't do that with Link or NavLink, those only work
//   as clickable elements in the JSX.
// - useFavorites gives us access to the favorites list so we can show a count badge.
import { useState } from 'react'
import type { SubmitEvent as ReactSubmitEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'

export default function Navbar() {
    // This holds whatever the user is currently typing in the search box.
    // Every keystroke updates it via the onChange on the input below.
    const [query, setQuery] = useState('')

    // useNavigate gives us a function we can call inside handleSearch to send
    // the user to a different route. A regular <Link> only works as a clickable
    // element — it can't be called from inside a function like this can.
    const navigate = useNavigate()

    // We only need favorites here, not addFavorite or removeFavorite or toggleFavorite,
    // because the Navbar just needs to know how many items are saved to show the badge.
    // No point pulling in the whole context API when we only need one value.
    const { favorites } = useFavorites()

    function handleSearch(e: ReactSubmitEvent<HTMLFormElement>) {
        // Without preventDefault the browser would try to submit the form the old-school
        // way — reload the page and append ?query=... to the URL itself. We don't want that.
        e.preventDefault()

        const q = query.trim()

        if (q) {
            // encodeURIComponent turns spaces and special characters into URL-safe codes
            // (e.g. "pasta bake" becomes "pasta%20bake"). Without it a space would break
            // the URL. The SearchResults page reads this value back out of the URL using
            // useSearchParams, so the format has to match what it expects.
            navigate(`/search?query=${encodeURIComponent(q)}`)

            // Clear the input after navigating so the search box doesn't sit there
            // showing the old term after you've already landed on the results page.
            setQuery('')
        }
    }

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                {/* Plain Link for the logo — no active state needed here, it's just
                    a home button. The span wraps "Slice" so CSS can give it a different
                    color from "Finder" without needing two separate elements. */}
                <Link to="/" className="navbar-logo">
                    🍕 <span>Slice</span>Finder
                </Link>

                {/* NavLink gives us isActive so we can add the "active" class to
                    whichever page the user is currently on. */}
                <div className="navbar-links">
                    {/* The "end" prop is important here. Without it, the Home link would
                        match every single route because every path starts with "/".
                        "end" tells React Router to only consider it active when the
                        path is exactly "/" and nothing after it. */}
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to="/favorites"
                        className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
                    >
                        Saved
                        {/* Only render the badge when there's actually something saved.
                            Showing a "0" badge when the list is empty would look weird
                            and doesn't give the user any useful information. */}
                        {favorites.length > 0 && (
                            <span className="fav-count">{favorites.length}</span>
                        )}
                    </NavLink>
                </div>

                {/* This form never sends data to a server. Submitting it just calls
                    handleSearch, which builds the search URL and navigates there.
                    The whole server-style form setup (onSubmit, e.preventDefault) is
                    just so pressing Enter in the input works naturally. */}
                <form className="navbar-search" onSubmit={handleSearch}>
                    <input
                        type="search"
                        placeholder="Search any recipe..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search recipes"
                    />
                    <button type="submit" aria-label="Search">
                        🔍
                    </button>
                </form>
            </div>
        </nav>
    )
}
