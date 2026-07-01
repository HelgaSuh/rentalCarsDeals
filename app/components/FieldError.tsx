interface FieldErrorProps {
  message: string
  id?: string
}

export function FieldError({ message, id }: FieldErrorProps) {
  return (
    <div
      id={id}
      role="alert"
      className="absolute top-full left-0 z-20 mt-2 max-w-[200px] rounded-md bg-red-600 px-3 py-2 text-sm text-white shadow-lg"
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
          borderBottom: '6px solid var(--error)',
        }}
      />
    </div>
  )
}
