import type { CategoryIcon } from '../data/types'
import CategoryIconView from './CategoryIconView'

interface CategoryTileProps {
  name: string
  icon: CategoryIcon
  selected: boolean
  onSelect: () => void
}

export default function CategoryTile({
  name,
  icon,
  selected,
  onSelect,
}: CategoryTileProps) {
  return (
    <button
      type="button"
      className={selected ? 'category-tile is-selected' : 'category-tile'}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <CategoryIconView icon={icon} />
      <span className="category-tile__name">{name}</span>
    </button>
  )
}
