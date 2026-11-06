import {
  Book,
  Bus,
  Flame,
  Heart,
  House,
  Phone,
  ShoppingBag,
  Tag,
  User,
  Utensils,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { CategoryIcon } from '../data/types'

const ICON_COMPONENTS: Record<CategoryIcon, LucideIcon> = {
  home: House,
  user: User,
  utensils: Utensils,
  wifi: Wifi,
  zap: Zap,
  flame: Flame,
  bus: Bus,
  book: Book,
  tag: Tag,
  'shopping-bag': ShoppingBag,
  heart: Heart,
  phone: Phone,
}

interface CategoryIconViewProps {
  icon: CategoryIcon
  size?: number
}

export default function CategoryIconView({
  icon,
  size = 24,
}: CategoryIconViewProps) {
  const Icon = ICON_COMPONENTS[icon]

  return <Icon aria-hidden="true" size={size} strokeWidth={2} />
}
