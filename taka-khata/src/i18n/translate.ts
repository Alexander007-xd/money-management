import { bn, type TranslationKey } from './bn'
import { en } from './en'
import { formatNumber } from './format'
import type { Language, TranslationParams } from './types'

const PLACEHOLDER = /\{(\w+)\}/g

export type { Language, TranslationKey, TranslationParams }

export function t(
  lang: Language,
  key: TranslationKey,
  params: TranslationParams = {},
): string {
  const template = lang === 'bn' ? bn[key] : en[key]

  return template.replace(PLACEHOLDER, (match: string, name: string) => {
    if (!Object.prototype.hasOwnProperty.call(params, name)) {
      return match
    }

    const value = params[name]

    return typeof value === 'number' ? formatNumber(value, lang) : value
  })
}
