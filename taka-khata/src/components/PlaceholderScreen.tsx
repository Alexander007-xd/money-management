import { useLanguage, type TranslationKey } from '../i18n'

interface PlaceholderScreenProps {
  titleKey: TranslationKey
  textKey?: TranslationKey
}

export default function PlaceholderScreen({ titleKey, textKey }: PlaceholderScreenProps) {
  const { t } = useLanguage()

  return (
    <section className="screen">
      <h1 className="screen__title">{t(titleKey)}</h1>
      {textKey ? <p className="screen__text">{t(textKey)}</p> : null}
    </section>
  )
}
