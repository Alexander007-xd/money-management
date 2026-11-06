import { useId } from 'react'

interface AmountInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  autoFocus?: boolean
}

export default function AmountInput({
  label,
  value,
  onChange,
  error,
  autoFocus = false,
}: AmountInputProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="amount-input-wrapper">
      <div className="amount-input">
        <span className="amount-input__symbol" aria-hidden="true">
          ৳
        </span>
        <input
          id={id}
          className="amount-input__field"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={label}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {error ? (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
