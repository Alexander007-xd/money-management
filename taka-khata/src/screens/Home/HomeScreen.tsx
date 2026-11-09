import { Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../app/routes'
import BalanceCard from '../../components/BalanceCard'
import BigActionButton from '../../components/BigActionButton'
import EmptyState from '../../components/EmptyState'
import LedgerRow from '../../components/LedgerRow'
import { balance, monthTotals } from '../../data/calc'
import { getCategories, listTransactions } from '../../data/repo'
import type { Category, Transaction } from '../../data/types'
import { useLanguage } from '../../i18n'
import { formatDay, monthKey, today } from '../../lib/dates'
import { formatMoney } from '../../lib/money'

export default function HomeScreen() {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([listTransactions(), getCategories()])
      .then(([rows, categoryRows]) => {
        if (!active) {
          return
        }

        setTransactions(rows)
        setCategories(categoryRows)
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
  }, [])

  const totalMinor = balance(transactions)
  const month = monthTotals(transactions, monthKey(today()))
  const latest = transactions.slice(0, 5)
  const isEmpty = transactions.length === 0

  function categoryName(categoryId: string | null): string {
    const category = categories.find((row) => row.id === categoryId)

    if (!category) {
      return t('from.other')
    }

    return lang === 'bn' ? category.nameBn : category.nameEn
  }

  function titleFor(transaction: Transaction): string {
    if (transaction.type === 'income') {
      return transaction.source?.trim() || t('from.other')
    }

    return categoryName(transaction.categoryId)
  }

  function iconFor(transaction: Transaction) {
    if (transaction.type === 'income') {
      return 'user' as const
    }

    const category = categories.find((row) => row.id === transaction.categoryId)

    return category?.icon ?? 'tag'
  }

  function subtitleFor(transaction: Transaction): string {
    const day = formatDay(transaction.date, lang)

    return transaction.note ? `${day} · ${transaction.note}` : day
  }

  function amountTextFor(transaction: Transaction): string {
    const amount = formatMoney(transaction.amountMinor, lang)

    return transaction.type === 'income' ? `+${amount}` : `-${amount}`
  }

  return (
    <section className="home-screen">
      <header className="home-header">
        <h1 className="home-header__app">{t('app.name')}</h1>
        <span className="home-header__date">{formatDay(today(), lang)}</span>
      </header>

      <BalanceCard
        label={t('home.balanceLabel')}
        amountText={formatMoney(totalMinor, lang)}
        negative={totalMinor < 0}
        hint={t('home.negativeHint')}
      />

      <div className="big-actions">
        <BigActionButton
          to={ROUTES.addIncome}
          variant="income"
          label={t('home.received')}
        />
        <BigActionButton
          to={ROUTES.addExpense}
          variant="expense"
          label={t('home.spent')}
        />
      </div>

      {loaded && isEmpty ? <EmptyState message={t('home.empty')} /> : null}

      {!isEmpty ? (
        <section className="month-strip" aria-label={t('home.thisMonth')}>
          <h2 className="section-label">{t('home.thisMonth')}</h2>
          <div className="month-strip__row">
            <span className="month-strip__name">{t('home.received')}</span>
            <span className="month-strip__amount month-strip__amount--income">
              +{formatMoney(month.incomeMinor, lang)}
            </span>
          </div>
          <div className="month-strip__row">
            <span className="month-strip__name">{t('home.spent')}</span>
            <span className="month-strip__amount month-strip__amount--expense">
              -{formatMoney(month.expenseMinor, lang)}
            </span>
          </div>
        </section>
      ) : null}

      <Link className="check-card" to={ROUTES.check}>
        <Wallet aria-hidden="true" size={28} strokeWidth={2} />
        <span className="check-card__text">
          <span className="check-card__title">{t('home.checkMoney')}</span>
          <span className="check-card__hint">{t('home.checkMoneyHint')}</span>
        </span>
      </Link>

      {!isEmpty ? (
        <section className="latest">
          <div className="latest__header">
            <h2 className="section-label">{t('home.latest')}</h2>
            <Link className="link-button" to={ROUTES.history}>
              {t('home.seeAll')}
            </Link>
          </div>
          <div className="ledger-list">
            {latest.map((transaction) => (
              <LedgerRow
                key={transaction.id}
                title={titleFor(transaction)}
                subtitle={subtitleFor(transaction)}
                amountText={amountTextFor(transaction)}
                type={transaction.type}
                icon={iconFor(transaction)}
                onOpen={() => navigate(`/edit/${transaction.id}`)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  )
}
