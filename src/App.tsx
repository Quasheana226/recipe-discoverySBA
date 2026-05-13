// lazy + Suspense: lazy() splits each page into its own chunk that only downloads
// when the user visits that route. Suspense is required by React any time you use lazy() —
// it shows the fallback while the chunk is loading.
//
// BrowserRouter, Routes, Route: the three things you need to set up client-side routing.
// BrowserRouter reads the URL and powers Link, NavLink, useNavigate, and useParams.
//
// FavoritesProvider wraps the whole app so every component can access the favorites context.
// Navbar and Spinner are needed at this level — Navbar renders on every page,
// Spinner is the Suspense fallback while lazy pages load.
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { FavoritesProvider } from './context/FavoritesContext'
import Navbar from './components/Navbar'
import Spinner from './components/Spinner'

// Each page only downloads when the user navigates to it.
// Without lazy() everything would be one big bundle downloaded on first load.
const Home = lazy(() => import('./pages/Home'))
const Category = lazy(() => import('./pages/Category'))
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'))
const Favorites = lazy(() => import('./pages/Favorites'))
const SearchResults = lazy(() => import('./pages/SearchResults'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
    return (
        // FavoritesProvider has to be outermost — Context only reaches components
        // that are children of the Provider. Wrapping here means every page has access.
        <FavoritesProvider>

            {/* BrowserRouter enables all routing features. Without it, Link, NavLink,
                useNavigate, and useParams all break. */}
            <BrowserRouter>

                {/* Navbar sits outside Routes so it stays visible on every page.
                    It needs to be inside BrowserRouter because it uses NavLink and useNavigate. */}
                <Navbar />

                {/* main is semantic HTML that tells screen readers where page content starts.
                    CSS also uses it to add padding-top so content clears the fixed Navbar. */}
                <main>

                    {/* Suspense is required with lazy(). The fallback div.page-loader
                        gives the Spinner a container with height — without it the layout collapses. */}
                    <Suspense fallback={<div className="page-loader"><Spinner /></div>}>
                        <Routes>

                            {/* Root path — landing page with the hero and category grid. */}
                            <Route path="/" element={<Home />} />

                            {/* :name is replaced by the actual category, e.g. /category/Seafood.
                                Category reads it back with useParams(). */}
                            <Route path="/category/:name" element={<Category />} />

                            {/* :id is the MealDB meal ID, e.g. /recipe/52772.
                                RecipeDetail fetches the full recipe using this ID. */}
                            <Route path="/recipe/:id" element={<RecipeDetail />} />

                            {/* Static route — Favorites reads saved IDs from FavoritesContext. */}
                            <Route path="/favorites" element={<Favorites />} />

                            {/* No URL param — search term lives in the query string (?query=chicken).
                                SearchResults reads it with useLocation + URLSearchParams. */}
                            <Route path="/search" element={<SearchResults />} />

                            {/* * matches any URL that didn't match the routes above.
                                Must be last — Router checks top to bottom and stops at the first match. */}
                            <Route path="*" element={<NotFound />} />

                        </Routes>
                    </Suspense>
                </main>
            </BrowserRouter>
        </FavoritesProvider>
    )
}
