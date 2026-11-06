import { formatNumber, toLatinDigits } from '../i18n/format'

const POISHA_PER_TAKA = 100
const DECIMAL_PATTERN = /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/

function groupThousands(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function toMinor(input: string): number | null {
  const normalized = toLatinDigits(input)
    .trim()
    .replace(/^tk\s*/i, '')
    .replace(/\s*tk$/i, '')
    .replace(/[৳,\s]/g, '')

  if (!DECIMAL_PATTERN.test(normalized)) {
    return null
  }

  const [wholePart, fractionPart = ''] = normalized.split('.')
  const whole = wholePart === '' ? '0' : wholePart
  const poisha = fractionPart.padEnd(2, '0')
  const minor = Number(whole) * POISHA_PER_TAKA + Number(poisha)

  return Number.isSafeInteger(minor) ? minor : null
}

export function fromMinor(minor: number): string {
  const sign = minor < 0 ? '-' : ''
  const absolute = Math.abs(minor)
  const whole = Math.trunc(absolute / POISHA_PER_TAKA)
  const poisha = absolute % POISHA_PER_TAKA

  if (poisha === 0) {
    return `${sign}${whole}`
  }

  return `${sign}${whole}.${String(poisha).padStart(2, '0')}`
}

export function formatMoney(minor: number, lang: 'bn' | 'en'): string {
  const sign = minor < 0 ? '-' : ''
  const absolute = Math.abs(minor)
  const whole = Math.trunc(absolute / POISHA_PER_TAKA)
  const poisha = String(absolute % POISHA_PER_TAKA).padStart(2, '0')
  const formatted = `${sign}৳${groupThousands(String(whole))}.${poisha}`

  return formatNumber(formatted, lang)
}
