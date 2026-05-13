// Link is the only import this page needs. There's no API data to fetch, no context
// to read, and no state to manage. The only thing this page does is show a message
// and give the user a button to get back somewhere useful.
import { Link } from 'react-router-dom'

export default function NotFound() {
    // This component is intentionally dead simple. No hooks, no logic, no props.
    // Its only job is to tell the user something went wrong and give them a way out.
    return (
        <div className="empty-state">

            {/* Showing 404 as giant text instead of an emoji because the number itself
                communicates the error instantly — anyone who has used the internet knows
                what 404 means. The muted color using var(--border-hover) keeps it from
                being too visually harsh while still being readable.
                In plain terms, a 404 means the server or router looked at the URL the user
                visited and couldn't find anything that matches it. */}
            <div
                className="empty-icon"
                style={{ fontSize: '6rem', fontWeight: 900, color: 'var(--border-hover)' }}
            >
                404
            </div>

            {/* Keeping this short and plain on purpose. The giant 404 above already set
                the context — the title just confirms it in plain English without repeating
                everything. */}
            <div className="empty-title">Page not found</div>

            {/* "Got eaten" is a light pizza-theme joke to keep the tone friendly instead
                of cold and technical. Nobody likes hitting an error page so making it a
                little playful helps.
                The second sentence gives two possible reasons — broken link or deleted page —
                so the user understands it probably wasn't something they did wrong. */}
            <p className="empty-text">
                Looks like this page got eaten. The link might be broken or the page no longer exists.
            </p>

            {/* Using Link instead of a plain <a> tag because Link uses React Router's
                client-side navigation — clicking it swaps the page content without doing
                a full browser reload, which is faster and keeps the app state intact.
                Going to "/" specifically because the home page is the safest landing spot
                for someone who is lost — it shows the full category grid and gives them
                something to actually do. */}
            <Link to="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
                🍕 Back to Home
            </Link>
        </div>
    )
}

// HOW TO WIRE THIS UP IN App.tsx:
// Inside the <Routes> block in App.tsx, add this as the very last route:
//
//   <Route path="*" element={<NotFound />} />
//
// The * is a wildcard — it matches any URL that didn't match any of the routes
// listed above it. It has to be last because React Router checks routes from top
// to bottom and stops at the first match. If * were at the top it would match
// every single URL and no other page would ever load.
