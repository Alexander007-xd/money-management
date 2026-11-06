import type { CategoryIcon, TransactionType } from '../data/types'
import CategoryIconView from './CategoryIconView'

interface LedgerRowProps {
  title: string
  subtitle?: string
  amountText: string
  type: TransactionType
  icon?: CategoryIcon
  onOpen?: () => void
}

export default function LedgerRow({
  title,
  subtitle,
  amountText,
  type,
  icon = 'tag',
  onOpen,
}: LedgerRowProps) {
  const content = (
    <>
      <span className={`ledger-row__icon ledger-row__icon--${type}`}>
        <CategoryIconView icon={icon} size={20} />
      </span>
      <span className="ledger-row__text">
        <span className="ledger-row__title">{title}</span>
        {subtitle ? <span className="ledger-row__subtitle">{subtitle}</span> : null}
      </span>
      <span className="ledger-row__leader" aria-hidden="true" />
      <span className={`ledger-row__amount ledger-row__amount--${type}`}>
        {amountText}
      </span>
    </>
  )

  if (onOpen) {
    return (
      <button type="button" className="ledger-row" onClick={onOpen}>
        {content}
      </button>
    )
  }

  return <div className="ledger-row">{content}</div>
}
