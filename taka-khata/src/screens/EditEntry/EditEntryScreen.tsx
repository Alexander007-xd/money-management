import { useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteReducer, routeAfterSave } from '../../app/machines'
import { ROUTES } from '../../app/routes'
import ConfirmDialog from '../../components/ConfirmDialog'
import EntryForm from '../../components/EntryForm'
import Toast from '../../components/Toast'
import {
  deleteTransaction,
  listTransactions,
  restoreTransaction,
} from '../../data/repo'
import type { Transaction } from '../../data/types'
import { useLanguage } from '../../i18n'
import { fromMinor } from '../../lib/money'

export default function EditEntryScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [transaction, setTransaction] = useState<Transaction | null | undefined>(
    undefined,
  )
  const [deleteState, dispatch] = useReducer(deleteReducer, 'idle')
  const [deleteFailed, setDeleteFailed] = useState(false)
  const snapshot = useRef<Transaction | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    let active = true

    listTransactions()
      .then((rows) => {
        if (!active) {
          return
        }

        const found = rows.find((row) => row.id === id) ?? null

        if (found === null) {
          navigate(ROUTES.history, { replace: true })
          return
        }

        setTransaction(found)
      })
      .catch(() => {
        if (active) {
          navigate(ROUTES.history, { replace: true })
        }
      })

    return () => {
      active = false
    }
  }, [id, navigate])

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current)
      }
    }
  }, [])

  async function handleDeleteConfirm(): Promise<void> {
    if (transaction === null || transaction === undefined) {
      return
    }

    snapshot.current = transaction
    setDeleteFailed(false)

    try {
      await deleteTransaction(transaction.id)
      dispatch('CONFIRM')
      timer.current = window.setTimeout(() => {
        dispatch('TIMEOUT')
        navigate(ROUTES.history, { replace: true })
      }, 5_000)
    } catch {
      dispatch('CANCEL')
      setDeleteFailed(true)
    }
  }

  async function handleUndo(): Promise<void> {
    const saved = snapshot.current

    if (saved === null) {
      return
    }

    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }

    try {
      await restoreTransaction(saved)
      snapshot.current = null
      dispatch('UNDO')
    } catch {
      dispatch('TIMEOUT')
      navigate(ROUTES.history, { replace: true })
    }
  }

  if (transaction === undefined) {
    return <section className="edit-screen" aria-busy="true" />
  }

  if (transaction === null) {
    return null
  }

  return (
    <section className="edit-screen">
      {deleteState !== 'deleted' ? (
        <EntryForm
          mode="edit"
          type={transaction.type}
          transactionId={transaction.id}
          initial={{
            amount: fromMinor(transaction.amountMinor),
            categoryId: transaction.categoryId,
            source: transaction.source ?? '',
            note: transaction.note,
            date: transaction.date,
          }}
          onSaved={() => navigate(routeAfterSave('edit'))}
          onDelete={() => dispatch('DELETE')}
        />
      ) : null}

      {deleteFailed ? (
        <p className="field__error" role="alert">
          {t('error.saveFailed')}
        </p>
      ) : null}

      <ConfirmDialog
        open={deleteState === 'confirmDelete'}
        title={t('edit.deleteTitle')}
        message={t('edit.deleteMessage')}
        confirmLabel={t('common.yes')}
        cancelLabel={t('common.no')}
        destructive
        onConfirm={() => {
          void handleDeleteConfirm()
        }}
        onCancel={() => dispatch('CANCEL')}
      />

      <Toast
        visible={deleteState === 'deleted'}
        message={t('edit.deleted')}
        actionLabel={t('common.undo')}
        onAction={() => {
          void handleUndo()
        }}
      />
    </section>
  )
}
