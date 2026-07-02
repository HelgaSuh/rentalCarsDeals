interface FieldErrorProps {
    message: string
    id?: string
    className?: string
}

export function FieldError({ message, id, className }: FieldErrorProps) {
    return (
        <div
            id={id}
            role="alert"
            className={`absolute top-full left-0 z-20 mt-2 max-w-[200px] rounded-md bg-white px-3 py-2 text-sm shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity${className ? ` ${className}` : ''}`}
            style={{ color: 'var(--error)' }}
        >
            {message}
            <span
                aria-hidden="true"
                className="absolute left-4 bottom-full block"
                style={{
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '6px solid white',
                }}
            />
        </div>
    )
}
