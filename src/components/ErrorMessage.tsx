// shown whenever a fetch fails — keeps the user informed instead of
// just leaving them with a blank screen
interface Props {
    message?: string
}

export default function ErrorMessage({ message = 'Something went wrong.' }: Props) {
    return (
        <div className="error-box" role="alert">
            <div className="error-icon">⚠️</div>
            <div className="error-title">Something went wrong</div>
            <p className="error-msg">{message}</p>
        </div>
    )
}