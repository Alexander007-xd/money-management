import { ChevronRight, Database, Info, Smartphone, Tag } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../app/routes'
import { APP_VERSION } from '../../app/version'
import { setSetting } from '../../data/repo'
import { useLanguage, type Language } from '../../i18n'

export default function MoreScreen() {
  const { lang, setLang, t } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  async function choose(next: Language): Promise<void> {
    if (next === lang || saving) {
      return
    }

    setLang(next)
    setSaving(true)
    setFailed(false)

    try {
      await setSetting('language', next)
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="more-screen">
      <h1 className="screen__title">{t('more.title')}</h1>

      <section className="more-language">
        <h2 className="section-label">{t('more.language')}</h2>
        <div className="more-language__options">
          <button
            type="button"
            className="more-language__option"
            aria-pressed={lang === 'bn'}
            onClick={() => void choose('bn')}
          >
            {t('language.bangla')}
          </button>
          <button
            type="button"
            className="more-language__option"
            aria-pressed={lang === 'en'}
            onClick={() => void choose('en')}
          >
            {t('language.english')}
          </button>
        </div>
        {failed ? (
          <p className="form-error" role="alert">
            {t('error.saveFailed')}
          </p>
        ) : null}
      </section>

      <nav className="more-links">
        <Link className="more-link" to={ROUTES.categories}>
          <span className="more-link__icon">
            <Tag aria-hidden="true" size={24} strokeWidth={2} />
          </span>
          <span className="more-link__label">{t('more.categories')}</span>
          <ChevronRight aria-hidden="true" size={22} strokeWidth={2} />
        </Link>
        <Link className="more-link" to={ROUTES.backup}>
          <span className="more-link__icon">
            <Database aria-hidden="true" size={24} strokeWidth={2} />
          </span>
          <span className="more-link__label">{t('more.backup')}</span>
          <ChevronRight aria-hidden="true" size={22} strokeWidth={2} />
        </Link>
        <Link className="more-link" to={ROUTES.install}>
          <span className="more-link__icon">
            <Smartphone aria-hidden="true" size={24} strokeWidth={2} />
          </span>
          <span className="more-link__label">{t('more.install')}</span>
          <ChevronRight aria-hidden="true" size={22} strokeWidth={2} />
        </Link>
      </nav>

      <section className="more-about">
        <h2 className="section-label">{t('more.about')}</h2>
        <p className="more-about__version">
          <Info aria-hidden="true" size={18} strokeWidth={2} />
          {t('more.version', { version: APP_VERSION })}
        </p>
      </section>
    </section>
  )
}
