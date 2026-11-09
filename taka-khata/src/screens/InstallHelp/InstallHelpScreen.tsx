import { Download, Smartphone } from 'lucide-react'
import Button from '../../components/Button'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { useLanguage } from '../../i18n'

export default function InstallHelpScreen() {
  const { t } = useLanguage()
  const { canInstall, installing, installed, install } = useInstallPrompt()

  const steps = ['install.step1', 'install.step2', 'install.step3'] as const

  return (
    <section className="install-screen">
      <h1 className="screen__title">{t('install.title')}</h1>

      <ol className="install-steps">
        {steps.map((key, index) => (
          <li className="install-step" key={key}>
            <span className="install-step__number" aria-hidden="true">
              {index + 1}
            </span>
            <span className="install-step__text">{t(key)}</span>
          </li>
        ))}
      </ol>

      {canInstall ? (
        <div className="install-action">
          <Button
            variant="primary-income"
            loading={installing}
            onClick={() => void install()}
          >
            {t('install.button')}
          </Button>
        </div>
      ) : null}

      {installed ? (
        <p className="install-done" role="status">
          {t('install.done')}
        </p>
      ) : null}

      <p className="install-note">
        <Smartphone aria-hidden="true" size={20} strokeWidth={2} />
        {t('install.note')}
      </p>

      <p className="install-note">
        <Download aria-hidden="true" size={20} strokeWidth={2} />
        {t('install.offlineNote')}
      </p>
    </section>
  )
}
