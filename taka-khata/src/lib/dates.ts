import { formatNumber } from '../i18n/format'
import { t, type Language, type TranslationKey } from '../i18n/translate'

const MONTH_KEYS: readonly TranslationKey[] = [
  'month.1',
  'month.2',
  'month.3',
  'month.4',
  'month.5',
  'month.6',
  'month.7',
  'month.8',
  'month.9',
  'month.10',
  'month.11',
  'month.12',
]

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function addDays(date: string, days: number): string {
  const [yearPart, monthPart, dayPart] = date.split('-')
  const shifted = new Date(Number(yearPart), Number(monthPart) - 1, Number(dayPart) + days)

  return `${shifted.getFullYear()}-${pad2(shifted.getMonth() + 1)}-${pad2(shifted.getDate())}`
}

export function today(): string {
  const now = new Date()

  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

export function monthKey(date: string): string {
  return date.slice(0, 7)
}

export function shiftMonth(key: string, delta: number): string {
  const [yearPart, monthPart] = key.split('-')
  const totalMonths = Number(yearPart) * 12 + (Number(monthPart) - 1) + delta
  const year = Math.floor(totalMonths / 12)
  const month = totalMonths - year * 12 + 1

  return `${String(year).padStart(4, '0')}-${pad2(month)}`
}

export function isFuture(date: string): boolean {
  return date > today()
}

export function formatDay(date: string, lang: Language): string {
  const current = today()

  if (date === current) {
    return t(lang, 'day.today')
  }

  if (date === addDays(current, -1)) {
    return t(lang, 'day.yesterday')
  }

  const [, monthPart, dayPart] = date.split('-')
  const monthName = t(lang, MONTH_KEYS[Number(monthPart) - 1])
  const formatted = `${Number(dayPart)} ${monthName} ${date.slice(0, 4)}`

  return formatNumber(formatted, lang)
}
