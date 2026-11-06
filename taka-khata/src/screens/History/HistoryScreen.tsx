import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/EmptyState'
import LedgerRow from '../../components/LedgerRow'
import { getCategories, listTransactions } from '../../data/repo'
import type { Category, Transaction, TransactionType } from '../../data/types'
import { useLanguage, type TranslationKey } from '../../i18n'
import { formatNumber } from '../../i18n/format'
import { formatDay, monthKey, shiftMonth, today } from '../../lib/dates'
import { formatMoney } from '../../lib/money'

type TypeFilter = 'all' | TransactionType

const MONTH_KEYS: readonly TranslationKey[] = [
  'month.1',
  'month.2',
  'month.3',
  'month.4',
  'month.5',
  'month.6',
  'month.7',
  'month.8',
  'month.9',
  'month.10',
  'month.11',
  'month.12',
]

const TYPE_OPTIONS: readonly { value: TypeFilter; key: TranslationKey }[] = [
  { value: 'all', key: 'history.all' },
  { value: 'income', key: 'history.received' },
  { value: 'expense', key: 'history.spent' },
]

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

function parseType(raw: string | null): TypeFilter {
  return raw === 'income' || raw === 'expense' ? raw : 'all'
}

interface DayGroup {
  date: string
  totalMinor: number
  rows: Transaction[]
}

export default function HistoryScreen() {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [month, setMonth] = useState(() => {
    const raw = searchParams.get('month')

    return raw !== null && MONTH_PATTERN.test(raw) ? raw : monthKey(today())
  })
  const [type, setType] = useState<TypeFilter>(() =>
    parseType(searchParams.get('type')),
  )
  const [categoryId, setCategoryId] = useState<string | null>(() => {
    const rawCategory = searchParams.get('category')

    return parseType(searchParams.get('type')) === 'expense' && rawCategory
      ? rawCategory
      : null
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true

    setLoaded(false)

    listTransactions({ month })
      .then((rows) => {
        if (!active) {
          return
        }

        setTransactions(rows)
        setLoaded(true)
      })
      .catch(() => {
        if (active) {
          setLoaded(true)
        }
      })

    return () => {
      active = false
    }
  }, [month])

  useEffect(() => {
    let active = true

    getCategories()
      .then((rows) => {
        if (active) {
          setCategories(rows)
        }
      })
      .catch(() => {
        if (active) {
          setCategories([])
        }
      })

    return () => {
      active = false
    }
  }, [])

  const visible = transactions
    .filter((transaction) => type === 'all' || transaction.type === type)
    .filter(
      (transaction) =>
        categoryId === null || transaction.categoryId === categoryId,
    )

  const groups: DayGroup[] = []

  for (const transaction of visible) {
    const current = groups[groups.length - 1]

    if (current && current.date === transaction.date) {
      current.rows.push(transaction)
      current.totalMinor +=
        transaction.type === 'income'
          ? transaction.amountMinor
          : -transaction.amountMinor
      continue
    }

    groups.push({
      date: transaction.date,
      totalMinor:
        transaction.type === 'income'
          ? transaction.amountMinor
          : -transaction.amountMinor,
      rows: [transaction],
    })
  }

  function monthName(key: string): string {
    const [year, monthPart] = key.split('-')
    const name = t(MONTH_KEYS[Number(monthPart) - 1])

    return `${name} ${formatNumber(year, lang)}`
  }

  function categoryName(category: Category): string {
    return lang === 'bn' ? category.nameBn : category.nameEn
  }

  function titleFor(transaction: Transaction): string {
    if (transaction.type === 'income') {
      return transaction.source?.trim() || t('from.other')
    }

    const category = categories.find((row) => row.id === transaction.categoryId)

    return category ? categoryName(category) : t('from.other')
  }

  function iconFor(transaction: Transaction) {
    if (transaction.type === 'income') {
      return 'user' as const
    }

    const category = categories.find((row) => row.id === transaction.categoryId)

    return category?.icon ?? 'tag'
  }

  function amountTextFor(transaction: Transaction): string {
    const amount = formatMoney(transaction.amountMinor, lang)

    return transaction.type === 'income' ? `+${amount}` : `-${amount}`
  }

  function totalTextFor(totalMinor: number): string {
    if (totalMinor === 0) {
      return formatMoney(0, lang)
    }

    return totalMinor > 0
      ? `+${formatMoney(totalMinor, lang)}`
      : formatMoney(totalMinor, lang)
  }

  function handleTypeChange(next: TypeFilter): void {
    setType(next)

    if (next !== 'expense') {
      setCategoryId(null)
    }
  }

  const visibleCategories = categories.filter((category) => !category.archived)

  return (
    <section className="history-screen">
      <h1 className="screen__title">{t('history.title')}</h1>

      <div className="month-switcher">
        <button
          type="button"
          className="icon-button"
          aria-label={t('history.previousMonth')}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <ChevronLeft aria-hidden="true" size={24} strokeWidth={2} />
        </button>
        <span className="month-switcher__label">{monthName(month)}</span>
        <button
          type="button"
          className="icon-button"
          aria-label={t('history.nextMonth')}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          <ChevronRight aria-hidden="true" size={24} strokeWidth={2} />
        </button>
      </div>

      <div className="chip-row">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={type === option.value ? 'chip is-selected' : 'chip'}
            aria-pressed={type === option.value}
            onClick={() => handleTypeChange(option.value)}
          >
            {t(option.key)}
          </button>
        ))}
      </div>

      {type === 'expense' ? (
        <div className="chip-row">
          <button
            type="button"
            className={categoryId === null ? 'chip is-selected' : 'chip'}
            aria-pressed={categoryId === null}
            onClick={() => setCategoryId(null)}
          >
            {t('history.allCategories')}
          </button>
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={categoryId === category.id ? 'chip is-selected' : 'chip'}
              aria-pressed={categoryId === category.id}
              onClick={() => setCategoryId(category.id)}
            >
              {categoryName(category)}
            </button>
          ))}
        </div>
      ) : null}

      {loaded && groups.length === 0 ? (
        <EmptyState message={t('history.empty')} />
      ) : null}

      {groups.map((group) => (
        <section key={group.date} className="day-group">
          <header className="day-group__header">
            <span>{formatDay(group.date, lang)}</span>
            <span
              className={
                group.totalMinor < 0
                  ? 'day-group__total is-negative'
                  : 'day-group__total'
              }
            >
              {totalTextFor(group.totalMinor)}
            </span>
          </header>
          <div className="ledger-list">
            {group.rows.map((transaction) => (
              <LedgerRow
                key={transaction.id}
                title={titleFor(transaction)}
                subtitle={transaction.note || undefined}
                amountText={amountTextFor(transaction)}
                type={transaction.type}
                icon={iconFor(transaction)}
                onOpen={() => navigate(`/edit/${transaction.id}`)}
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  )
}
