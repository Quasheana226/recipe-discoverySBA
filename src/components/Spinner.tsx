// shown any time a page or component is waiting on API data
// the label can be customized per page — "Searching..." vs "Loading recipe..."
export default function Spinner({ label = 'Loading...' }: { label?: string }) {
    return (
        <div className="spinner-wrap" role="status" aria-label={label}>
            <div className="spinner" />
            <span>{label}</span>
        </div>
    )
}