interface BarRowProps {
  label: string
  amountText: string
  percentText: string
  percent: number
  onSelect: () => void
}

export default function BarRow({
  label,
  amountText,
  percentText,
  percent,
  onSelect,
}: BarRowProps) {
  const width = Math.min(100, Math.max(0, percent))

  return (
    <button type="button" className="bar-row" onClick={onSelect}>
      <span className="bar-row__top">
        <span className="bar-row__label">{label}</span>
        <span className="bar-row__amount">{amountText}</span>
      </span>
      <span className="bar-row__bottom">
        <span className="bar-row__track">
          <span className="bar-row__fill" style={{ width: `${width}%` }} />
        </span>
        <span className="bar-row__percent">{percentText}</span>
      </span>
    </button>
  )
}
