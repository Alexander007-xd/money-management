interface BalanceCardProps {
  label: string
  amountText: string
  negative: boolean
  hint: string
}

/**
 * Amounts longer than this are shown in a smaller font so they still fit on a
 * 360px wide phone. The threshold counts characters, not pixels, because the
 * digits are the same width in both languages.
 */
const COMPACT_LENGTH = 10

export default function BalanceCard({
  label,
  amountText,
  negative,
  hint,
}: BalanceCardProps) {
  const compact = amountText.length > COMPACT_LENGTH
  const classes = [
    'balance-card__amount',
    negative ? 'is-negative' : '',
    compact ? 'is-compact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className="balance-card">
      <span className="balance-card__label">{label}</span>
      <span className={classes}>{amountText}</span>
      {negative ? <p className="balance-card__hint">{hint}</p> : null}
    </section>
  )
}
