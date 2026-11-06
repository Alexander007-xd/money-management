import { ArrowLeft } from 'lucide-react'
import { useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formReducer } from '../app/machines'
import type { Category, TransactionType } from '../data/types'
import {
  addTransaction,
  getCategories,
  listTransactions,
  updateTransaction,
  type TransactionInput,
} from '../data/repo'
import {
  NOTE_MAX_LENGTH,
  validateAmountInput,
  type ValidationErrorCode,
} from '../data/validate'
import { useLanguage, type TranslationKey } from '../i18n'
import { isFuture, today } from '../lib/dates'
import AmountInput from './AmountInput'
import Button from './Button'
import CategoryTile from './CategoryTile'
import ConfirmDialog from './ConfirmDialog'
import Field from './Field'

export interface EntryFormInitial {
  amount?: string
  categoryId?: string | null
  source?: string
  note?: string
  date?: string
}

interface EntryFormProps {
  mode: 'add' | 'edit'
  type: TransactionType
  transactionId?: string
  initial?: EntryFormInitial
  onSaved: () => void
  onDelete?: () => void
}

interface FieldErrors {
  amount?: TranslationKey
  category?: TranslationKey
  date?: TranslationKey
  note?: TranslationKey
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

export default function EntryForm({
  mode,
  type,
  transactionId,
  initial,
  onSaved,
  onDelete,
}: EntryFormProps) {
  const { lang, t } = useLanguage()
  const navigate = useNavigate()
  const initialAmount = initial?.amount ?? ''
  const initialCategoryId = initial?.categoryId ?? null
  const initialSource = initial?.source ?? ''
  const initialNote = initial?.note ?? ''
  const initialDate = initial?.date ?? today()

  const [amount, setAmount] = useState(initialAmount)
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId)
  const [source, setSource] = useState(initialSource)
  const [note, setNote] = useState(initialNote)
  const [date, setDate] = useState(initialDate)
  const [noteOpen, setNoteOpen] = useState(initialNote !== '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formState, dispatch] = useReducer(formReducer, 'idle')
  const [categories, setCategories] = useState<Category[]>([])
  const [recentSources, setRecentSources] = useState<string[]>([])
  const [saveFailed, setSaveFailed] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const pendingMinor = useRef<number | null>(null)

  const busy = formState === 'saving' || formState === 'validating'

  useEffect(() => {
    dispatch('OPEN')
  }, [])

  useEffect(() => {
    if (type !== 'expense') {
      return
    }

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
  }, [type])

  useEffect(() => {
    if (type !== 'income' || mode !== 'add') {
      return
    }

    let active = true

    listTransactions({ type: 'income' })
      .then((rows) => {
        if (!active) {
          return
        }

        const names: string[] = []

        for (const row of rows) {
          const name = row.source?.trim()

          if (name && !names.includes(name)) {
            names.push(name)
          }
        }

        setRecentSources(names.slice(0, 5))
      })
      .catch(() => {
        if (active) {
          setRecentSources([])
        }
      })

    return () => {
      active = false
    }
  }, [mode, type])

  const defaultSourceKeys: TranslationKey[] = [
    'from.baba',
    'from.mama',
    'from.other',
  ]
  const defaultSources = defaultSourceKeys.map((key) => t(key))
  const sourceChips = [
    ...defaultSources,
    ...recentSources.filter((name) => !defaultSources.includes(name)),
  ]
  const visibleCategories = categories.filter(
    (category) => !category.archived || category.id === categoryId,
  )

  const isDirty =
    amount !== initialAmount ||
    categoryId !== initialCategoryId ||
    source !== initialSource ||
    note !== initialNote ||
    date !== initialDate

  function clearError(field: keyof FieldErrors): void {
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSave(): void {
    if (busy) {
      return
    }

    dispatch('SAVE')
    setSaveFailed(false)

    const nextErrors: FieldErrors = {}
    const amountResult = validateAmountInput(amount)

    if (!amountResult.ok) {
      nextErrors.amount = amountErrorKey(
        amountResult.errors[0]?.code ?? 'amountInvalid',
      )
    }

    if (type === 'expense' && categoryId === null) {
      nextErrors.category = 'error.categoryRequired'
    }

    if (isFuture(date)) {
      nextErrors.date = 'error.dateFuture'
    }

    if ([...note].length > NOTE_MAX_LENGTH) {
      nextErrors.note = 'error.noteTooLong'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0 || !amountResult.ok) {
      dispatch('INVALID')
      return
    }

    dispatch('VALID')
    pendingMinor.current = amountResult.value
    void persist(amountResult.value)
  }

  async function persist(amountMinor: number): Promise<void> {
    const trimmedNote = note.trim()
    const input: TransactionInput = {
      type,
      amountMinor,
      categoryId: type === 'expense' ? categoryId : null,
      source: type === 'income' ? (source.trim() === '' ? null : source.trim()) : null,
      note: trimmedNote,
      date,
    }

    try {
      if (mode === 'edit' && transactionId !== undefined) {
        await updateTransaction(transactionId, input)
      } else {
        await addTransaction(input)
      }

      dispatch('SUCCESS')
      onSaved()
    } catch {
      dispatch('FAILURE')
      setSaveFailed(true)
    }
  }

  function handleRetry(): void {
    if (pendingMinor.current === null || busy) {
      return
    }

    setSaveFailed(false)
    dispatch('RETRY')
    void persist(pendingMinor.current)
  }

  function handleBack(): void {
    if (!isDirty) {
      navigate(-1)
      return
    }

    dispatch('BACK')
    setShowDiscard(true)
  }

  function handleDiscardYes(): void {
    setShowDiscard(false)
    dispatch('DISCARD_YES')
    navigate(-1)
  }

  function handleDiscardNo(): void {
    setShowDiscard(false)
    dispatch('DISCARD_NO')
  }

  return (
    <section className="entry-screen">
      <header className="form-header">
        <button
          type="button"
          className="icon-button"
          aria-label={t('common.back')}
          onClick={handleBack}
        >
          <ArrowLeft aria-hidden="true" size={24} strokeWidth={2} />
        </button>
        <h1 className="form-header__title">
          {t(type === 'income' ? 'add.incomeTitle' : 'add.expenseTitle')}
        </h1>
      </header>

      <AmountInput
        label={t('add.amountLabel')}
        value={amount}
        autoFocus
        error={errors.amount ? t(errors.amount) : undefined}
        onChange={(value) => {
          setAmount(value)
          clearError('amount')
        }}
      />

      {type === 'expense' ? (
        <div className="form-section">
          <h2 className="form-section__label">{t('add.categoryLabel')}</h2>
          <div
            className="category-grid"
            role="group"
            aria-label={t('add.categoryLabel')}
          >
            {visibleCategories.map((category) => (
              <CategoryTile
                key={category.id}
                name={lang === 'bn' ? category.nameBn : category.nameEn}
                icon={category.icon}
                selected={category.id === categoryId}
                onSelect={() => {
                  setCategoryId(category.id)
                  clearError('category')
                }}
              />
            ))}
          </div>
          {errors.category ? (
            <p className="field__error">{t(errors.category)}</p>
          ) : null}
        </div>
      ) : (
        <div className="form-section">
          <Field
            label={t('add.fromLabel')}
            value={source}
            placeholder={t('add.fromPlaceholder')}
            onChange={(value) => setSource(value)}
          />
          <div
            className="chips"
            role="group"
            aria-label={t('add.fromLabel')}
          >
            {sourceChips.map((name, index) => {
              const isDefault = defaultSources.includes(name)

              return (
                <button
                  key={isDefault ? `default-${index}` : `recent-${name}`}
                  type="button"
                  className={source === name ? 'chip is-selected' : 'chip'}
                  aria-pressed={source === name}
                  onClick={() => setSource(name)}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <Field
        label={t('add.dateLabel')}
        type="date"
        value={date}
        max={today()}
        error={errors.date ? t(errors.date) : undefined}
        onChange={(value) => {
          setDate(value)
          clearError('date')
        }}
      />

      {noteOpen ? (
        <Field
          label={t('add.noteLabel')}
          value={note}
          placeholder={t('add.notePlaceholder')}
          error={errors.note ? t(errors.note) : undefined}
          onChange={(value) => {
            setNote(value)
            clearError('note')
          }}
        />
      ) : (
        <button
          type="button"
          className="link-button"
          onClick={() => setNoteOpen(true)}
        >
          {t('add.addNote')}
        </button>
      )}

      {saveFailed ? (
        <div className="form-banner" role="alert">
          <p>{t('add.retryMessage')}</p>
          <Button variant="secondary" onClick={handleRetry}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}

      <div className="form-actions">
        <Button
          variant={type === 'income' ? 'primary-income' : 'primary-expense'}
          loading={busy}
          onClick={handleSave}
        >
          {t('add.save')}
        </Button>
        {onDelete ? (
          <Button variant="ghost" className="btn--danger" onClick={onDelete}>
            {t('common.delete')}
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={showDiscard}
        title={t('add.discardTitle')}
        message={t('add.discardMessage')}
        confirmLabel={t('common.yes')}
        cancelLabel={t('common.no')}
        destructive
        onConfirm={handleDiscardYes}
        onCancel={handleDiscardNo}
      />
    </section>
  )
}
