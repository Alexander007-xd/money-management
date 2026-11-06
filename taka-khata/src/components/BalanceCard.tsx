interface BalanceCardProps {
  label: string
  amountText: string
  negative: boolean
  hint: string
}

export default function BalanceCard({
  label,
  amountText,
  negative,
  hint,
}: BalanceCardProps) {
  return (
    <section className="balance-card">
      <span className="balance-card__label">{label}</span>
      <span
        className={
          negative ? 'balance-card__amount is-negative' : 'balance-card__amount'
        }
      >
        {amountText}
      </span>
      {negative ? <p className="balance-card__hint">{hint}</p> : null}
    </section>
  )
}
