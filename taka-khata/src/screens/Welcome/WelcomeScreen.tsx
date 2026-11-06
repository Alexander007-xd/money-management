import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../app/routes'
import { useLanguage, type Language } from '../../i18n'

interface WelcomeScreenProps {
  onStart: (lang: Language) => Promise<void>
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { lang, setLang, t } = useLanguage()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleStart(): Promise<void> {
    if (saving) {
      return
    }

    setSaving(true)
    setFailed(false)

    try {
      await onStart(lang)
      navigate(ROUTES.home, { replace: true })
    } catch {
      setSaving(false)
      setFailed(true)
    }
  }

  return (
    <section className="welcome">
      <h1 className="welcome__title">{t('app.name')}</h1>
      <p className="welcome__tagline">{t('welcome.tagline')}</p>
      <div className="welcome__languages">
        <button
          type="button"
          className="welcome__language"
          aria-pressed={lang === 'bn'}
          onClick={() => setLang('bn')}
        >
          {t('language.bangla')}
        </button>
        <button
          type="button"
          className="welcome__language"
          aria-pressed={lang === 'en'}
          onClick={() => setLang('en')}
        >
          {t('language.english')}
        </button>
      </div>
      {failed ? (
        <p className="form-error" role="alert">
          {t('error.saveFailed')}
        </p>
      ) : null}
      <button
        type="button"
        className="welcome__start"
        disabled={saving}
        onClick={handleStart}
      >
        {saving ? t('common.loading') : t('welcome.start')}
      </button>
    </section>
  )
}
