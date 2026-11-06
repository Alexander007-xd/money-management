import { useId } from 'react'

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'date'
  error?: string
  max?: string
  placeholder?: string
  autoFocus?: boolean
}

export default function Field({
  label,
  value,
  onChange,
  type = 'text',
  error,
  max,
  placeholder,
  autoFocus = false,
}: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="field__input"
        type={type}
        value={value}
        max={max}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
