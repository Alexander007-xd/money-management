import type { Language } from './types'

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯'

export function toBanglaDigits(input: string): string {
  let result = ''

  for (const character of input) {
    const digit = character.charCodeAt(0) - 48
    result += digit >= 0 && digit <= 9 ? BANGLA_DIGITS[digit] : character
  }

  return result
}

export function toLatinDigits(input: string): string {
  let result = ''

  for (const character of input) {
    const index = BANGLA_DIGITS.indexOf(character)
    result += index === -1 ? character : String(index)
  }

  return result
}

export function formatNumber(value: number | string, lang: Language): string {
  const text = String(value)

  return lang === 'bn' ? toBanglaDigits(text) : toLatinDigits(text)
}
