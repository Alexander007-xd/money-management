import { Minus, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface BigActionButtonProps {
  to: string
  variant: 'income' | 'expense'
  label: string
}

export default function BigActionButton({
  to,
  variant,
  label,
}: BigActionButtonProps) {
  const Icon = variant === 'income' ? Plus : Minus

  return (
    <Link className={`big-action big-action--${variant}`} to={to}>
      <Icon aria-hidden="true" size={32} strokeWidth={2} />
      <span className="big-action__label">{label}</span>
    </Link>
  )
}
