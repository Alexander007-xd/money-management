import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { bn, type TranslationKey } from './bn'
import { en } from './en'
import { formatNumber } from './format'
import { t } from './translate'
import type { Language, TranslationParams } from './types'

export { bn, en, formatNumber, t }
export type { Language, TranslationKey, TranslationParams }

export interface LanguageContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey, params?: TranslationParams) => string
  formatNumber: (value: number | string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

interface LanguageProviderProps {
  children: ReactNode
  initialLang?: Language
}

export function LanguageProvider({
  children,
  initialLang = 'bn',
}: LanguageProviderProps) {
  const [lang, setLang] = useState<Language>(initialLang)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [lang])

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, params) => t(lang, key, params),
      formatNumber: (value) => formatNumber(value, lang),
    }),
    [lang],
  )

  return createElement(LanguageContext.Provider, { value }, children)
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext)

  if (value === null) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }

  return value
}
