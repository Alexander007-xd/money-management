import React, { useRef, useState } from 'react'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { exportAll, importAll } from '../../data/repo'
import { useLanguage } from '../../i18n'
import type { ImportState } from '../../app/routes'
import type { BackupData } from '../../data/types'

/**
 * Backup screen: export all data as JSON and restore from a JSON backup.
 * Uses ImportState from AppFlow.md state machine.
 */
export default function BackupScreen() {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<ImportState>('idle')
  const [pending, setPending] = useState<BackupData | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // ---------- Export ----------
  async function handleExport(): Promise<void> {
    const data = await exportAll()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `taka-khata-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---------- Import: file picked ----------
  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset the input so the same file can be re-picked after a cancel
    if (fileInputRef.current) fileInputRef.current.value = ''

    setPhase('parsing')
    setParseError(null)

    let parsed: unknown
    try {
      const text = await file.text()
      parsed = JSON.parse(text) as unknown
    } catch {
      setParseError(t('backup.invalid'))
      setPhase('error')
      return
    }

    // Quick validity check: must be a taka-khata backup envelope
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as Record<string, unknown>)['app'] !== 'taka-khata' ||
      !Array.isArray((parsed as Record<string, unknown>)['transactions'])
    ) {
      setParseError(t('backup.invalid'))
      setPhase('error')
      return
    }

    setPending(parsed as BackupData)
    setPhase('confirmReplace')
  }

  // ---------- Import: confirmed ----------
  async function handleConfirm(): Promise<void> {
    if (pending === null) return
    setPhase('importing')
    try {
      await importAll(pending)
      setPending(null)
      setPhase('done')
    } catch {
      setPending(null)
      setPhase('error')
    }
  }

  // ---------- Cancel confirm dialog ----------
  function handleCancel(): void {
    setPending(null)
    setParseError(null)
    setPhase('idle')
  }

  const transactionCount = pending?.transactions.length ?? 0

  const confirmMessage = t('backup.confirmMessage').replace(
    '{count}',
    String(transactionCount),
  )

  return (
    <section className="backup-screen">
      <h1 className="screen__title">{t('backup.title')}</h1>

      {/* Export */}
      <div className="backup-action">
        <Button fullWidth onClick={() => void handleExport()}>
          {t('backup.saveFile')}
        </Button>
        <p className="backup-action__hint">{t('backup.saveHint')}</p>
      </div>

      {/* Restore */}
      <div className="backup-action">
        <Button
          variant="secondary"
          fullWidth
          onClick={() => fileInputRef.current?.click()}
        >
          {t('backup.restore')}
        </Button>
        <p className="backup-action__hint">{t('backup.restoreHint')}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          aria-label={t('backup.restore')}
          className="backup-file-input"
          onChange={(e) => void handleFilePick(e)}
        />
      </div>

      {/* State feedback */}
      {phase === 'error' && parseError !== null ? (
        <p className="form-error" role="alert">
          {parseError}
        </p>
      ) : null}

      {phase === 'error' && parseError === null ? (
        <p className="form-error" role="alert">
          {t('backup.error')}
        </p>
      ) : null}

      {phase === 'importing' ? (
        <p className="backup-status" role="status">
          {t('backup.importing')}
        </p>
      ) : null}

      {phase === 'done' ? (
        <p className="backup-status backup-status--done" role="status">
          {t('backup.done')}
        </p>
      ) : null}

      {/* Reminder */}
      <p className="backup-reminder">{t('backup.reminder')}</p>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={phase === 'confirmReplace'}
        title={t('backup.confirmTitle')}
        message={confirmMessage}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => void handleConfirm()}
        onCancel={handleCancel}
        destructive
      />
    </section>
  )
}
