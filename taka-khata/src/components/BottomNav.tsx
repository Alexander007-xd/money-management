import { ChartPie, Clock, Ellipsis, House, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ROUTES } from '../app/routes'
import { useLanguage, type TranslationKey } from '../i18n'

interface NavItem {
  to: string
  labelKey: TranslationKey
  Icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.home, labelKey: 'nav.home', Icon: House, end: true },
  { to: ROUTES.history, labelKey: 'nav.history', Icon: Clock },
  { to: ROUTES.report, labelKey: 'nav.report', Icon: ChartPie },
  { to: ROUTES.more, labelKey: 'nav.more', Icon: Ellipsis },
]

export default function BottomNav() {
  const { t } = useLanguage()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, labelKey, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            isActive ? 'bottom-nav__item is-active' : 'bottom-nav__item'
          }
        >
          <Icon aria-hidden="true" size={24} strokeWidth={2} />
          <span>{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
