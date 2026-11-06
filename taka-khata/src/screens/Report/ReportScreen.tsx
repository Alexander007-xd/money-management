import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../app/routes'
import BarRow from '../../components/BarRow'
import EmptyState from '../../components/EmptyState'
import { expenseByCategory, monthTotals } from '../../data/calc'
import { getCategories, listTransactions } from '../../data/repo'
import type { Category, Transaction } from '../../data/types'
import { useLanguage, type TranslationKey } from '../../i18n'
import { formatNumber } from '../../i18n/format'
import { monthKey, shiftMonth, today } from '../../lib/dates'
import { formatMoney } from '../../lib/money'

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

export default function ReportScreen() {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [month, setMonth] = useState(monthKey(today()))
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

  const totals = monthTotals(transactions, month)
  const bars = expenseByCategory(transactions, month)

  function monthName(key: string): string {
    const [year, monthPart] = key.split('-')
    const name = t(MONTH_KEYS[Number(monthPart) - 1])

    return `${name} ${formatNumber(year, lang)}`
  }

  function nameFor(categoryId: string): string {
    const category = categories.find((row) => row.id === categoryId)

    if (!category) {
      return t('from.other')
    }

    return lang === 'bn' ? category.nameBn : category.nameEn
  }

  function openCategory(categoryId: string): void {
    const params = new URLSearchParams({
      month,
      type: 'expense',
      category: categoryId,
    })

    navigate(`${ROUTES.history}?${params.toString()}`)
  }

  return (
    <section className="report-screen">
      <h1 className="screen__title">{t('report.title')}</h1>

      <div className="month-switcher">
        <button
          type="button"
          className="icon-button"
          aria-label={t('report.previousMonth')}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <ChevronLeft aria-hidden="true" size={24} strokeWidth={2} />
        </button>
        <span className="month-switcher__label">{monthName(month)}</span>
        <button
          type="button"
          className="icon-button"
          aria-label={t('report.nextMonth')}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          <ChevronRight aria-hidden="true" size={24} strokeWidth={2} />
        </button>
      </div>

      <section className="report-summary">
        <div className="report-summary__row">
          <span>{t('report.received')}</span>
          <span className="report-summary__amount report-summary__amount--income">
            {formatMoney(totals.incomeMinor, lang)}
          </span>
        </div>
        <div className="report-summary__row">
          <span>{t('report.spent')}</span>
          <span className="report-summary__amount report-summary__amount--expense">
            {formatMoney(totals.expenseMinor, lang)}
          </span>
        </div>
        <div className="report-summary__row">
          <span>{t('report.left')}</span>
          <span
            className={
              totals.leftMinor < 0
                ? 'report-summary__amount report-summary__amount--expense'
                : 'report-summary__amount'
            }
          >
            {formatMoney(totals.leftMinor, lang)}
          </span>
        </div>
      </section>

      <h2 className="section-label report-bars__title">
        {t('report.whereMoneyWent')}
      </h2>

      {loaded && bars.length === 0 ? (
        <EmptyState message={t('report.empty')} />
      ) : (
        <div className="report-bars">
          {bars.map((bar) => (
            <BarRow
              key={bar.categoryId}
              label={nameFor(bar.categoryId)}
              amountText={formatMoney(bar.totalMinor, lang)}
              percentText={formatNumber(`${bar.percent}%`, lang)}
              percent={bar.percent}
              onSelect={() => openCategory(bar.categoryId)}
            />
          ))}
        </div>
      )}

      <Link className="report-check" to={ROUTES.check}>
        {t('report.checkMoney')}
      </Link>
    </section>
  )
}
