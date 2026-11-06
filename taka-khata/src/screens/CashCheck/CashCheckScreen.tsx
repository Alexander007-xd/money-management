import { useEffect, useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkOutcome, checkReducer } from '../../app/machines'
import { ROUTES } from '../../app/routes'
import AmountInput from '../../components/AmountInput'
import Button from '../../components/Button'
import LedgerRow from '../../components/LedgerRow'
import { balance, diffForCheck } from '../../data/calc'
import {
  addCashCheck,
  listCashChecks,
  listTransactions,
} from '../../data/repo'
import type { CashCheck, Transaction } from '../../data/types'
import {
  validateAmountInput,
  type ValidationErrorCode,
} from '../../data/validate'
import { useLanguage, type TranslationKey } from '../../i18n'
import { formatDay, today } from '../../lib/dates'
import { formatMoney, fromMinor } from '../../lib/money'

interface ResultState {
  countedMinor: number
  expectedMinor: number
  diffMinor: number
}

function amountErrorKey(code: ValidationErrorCode): TranslationKey {
  switch (code) {
    case 'amountRequired':
      return 'error.amountRequired'
    case 'amountNotPositive':
      return 'error.amountNotPositive'
    case 'amountTooLarge':
      return 'error.amountTooLarge'
    default:
      return 'error.amountInvalid'
  }
}

export default function CashCheckScreen() {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [recentChecks, setRecentChecks] = useState<CashCheck[]>([])
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<TranslationKey | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<ResultState | null>(null)
  const [checkState, dispatch] = useReducer(checkReducer, 'input')

  useEffect(() => {
    let active = true

    Promise.all([listTransactions(), listCashChecks()])
      .then(([rows, checks]) => {
        if (!active) {
          return
        }

        setTransactions(rows)
        setRecentChecks(checks)
      })
      .catch(() => {
        if (active) {
          setTransactions([])
        }
      })

    return () => {
      active = false
    }
  }, [])

  const expectedMinor = balance(transactions)

  async function handleCheck(): Promise<void> {
    const validation = validateAmountInput(raw)

    if (!validation.ok) {
      setError(amountErrorKey(validation.errors[0]?.code ?? 'amountInvalid'))
      return
    }

    const countedMinor = validation.value
    const expected = expectedMinor

    setError(null)
    setSaveFailed(false)
    setSaving(true)

    try {
      await addCashCheck({
        date: today(),
        countedMinor,
        expectedMinor: expected,
      })
      const checks = await listCashChecks()

      setRecentChecks(checks)
      setResult({
        countedMinor,
        expectedMinor: expected,
        diffMinor: diffForCheck(countedMinor, expected),
      })
      dispatch('CHECK')
    } catch {
      setSaveFailed(true)
    } finally {
      setSaving(false)
    }
  }

  function handleAgain(): void {
    setRaw('')
    setError(null)
    setSaveFailed(false)
    setResult(null)
    dispatch('CHECK_AGAIN')
  }

  function resultStatus(): { text: string; hint: string; outcome: string } {
    if (result === null) {
      return { text: '', hint: '', outcome: 'matches' }
    }

    const outcome = checkOutcome(result.diffMinor)
    const amount = formatMoney(Math.abs(result.diffMinor), lang)

    if (outcome === 'less') {
      return {
        text: t('check.less', { amount }),
        hint: t('check.lessHint'),
        outcome,
      }
    }

    if (outcome === 'more') {
      return {
        text: t('check.more', { amount }),
        hint: t('check.moreHint'),
        outcome,
      }
    }

    return {
      text: t('check.matches'),
      hint: t('check.matchesHint'),
      outcome,
    }
  }

  function openPrefilled(withResult: ResultState): void {
    const amount = fromMinor(Math.abs(withResult.diffMinor))

    if (withResult.diffMinor < 0) {
      navigate(`${ROUTES.addExpense}?amount=${amount}&category=other`)
      return
    }

    navigate(`${ROUTES.addIncome}?amount=${amount}`)
  }

  function checkText(check: CashCheck): string {
    const amount = formatMoney(Math.abs(check.diffMinor), lang)

    if (check.diffMinor < 0) {
      return t('check.less', { amount })
    }

    if (check.diffMinor > 0) {
      return t('check.more', { amount })
    }

    return t('check.matches')
  }

  const status = resultStatus()

  return (
    <section className="check-screen">
      <h1 className="screen__title">{t('check.title')}</h1>
      <p className="screen__text">{t('check.explanation')}</p>

      <p className="check-expected">
        {t('check.shouldBeLeft', { amount: formatMoney(expectedMinor, lang) })}
      </p>

      <AmountInput
        label={t('check.realLabel')}
        value={raw}
        error={error ? t(error) : undefined}
        onChange={(value) => {
          setRaw(value)
          setError(null)
        }}
      />

      {checkState === 'input' ? (
        <div className="form-actions">
          <Button loading={saving} onClick={() => void handleCheck()}>
            {t('check.button')}
          </Button>
        </div>
      ) : null}

      {checkState === 'result' && result !== null ? (
        <section className="check-result">
          <p
            className={`check-result__status check-result__status--${status.outcome}`}
          >
            {status.text}
          </p>
          <p className="check-result__hint">{status.hint}</p>
          <div className="check-result__actions">
            {status.outcome === 'less' ? (
              <Button
                variant="primary-expense"
                onClick={() => openPrefilled(result)}
              >
                {t('check.addExpense')}
              </Button>
            ) : null}
            {status.outcome === 'more' ? (
              <Button
                variant="primary-income"
                onClick={() => openPrefilled(result)}
              >
                {t('check.addIncome')}
              </Button>
            ) : null}
            <Button variant="secondary" onClick={handleAgain}>
              {t('check.again')}
            </Button>
          </div>
        </section>
      ) : null}

      {saveFailed ? (
        <p className="field__error" role="alert">
          {t('error.saveFailed')}
        </p>
      ) : null}

      <section className="check-recent">
        <h2 className="section-label">{t('check.recent')}</h2>
        <div className="ledger-list">
          {recentChecks.slice(0, 5).map((check) => (
            <LedgerRow
              key={check.id}
              title={formatDay(check.date, lang)}
              subtitle={checkText(check)}
              amountText={formatMoney(check.countedMinor, lang)}
              type={check.diffMinor < 0 ? 'expense' : 'income'}
            />
          ))}
        </div>
      </section>
    </section>
  )
}
