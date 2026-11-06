import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatDay, isFuture, monthKey, shiftMonth, today } from './dates'

function setLocalNow(year: number, month: number, day: number, hours = 12): void {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(year, month - 1, day, hours, 30, 0))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('today', () => {
  it('returns the local date as YYYY-MM-DD', () => {
    setLocalNow(2026, 1, 15)

    expect(today()).toBe('2026-01-15')
  })

  it('pads month and day', () => {
    setLocalNow(2026, 1, 5)

    expect(today()).toBe('2026-01-05')
  })

  it('uses the local day at both ends of the day', () => {
    setLocalNow(2026, 3, 1, 0)
    expect(today()).toBe('2026-03-01')

    setLocalNow(2026, 3, 1, 23)
    expect(today()).toBe('2026-03-01')
  })

  it('handles the last day of the year', () => {
    setLocalNow(2026, 12, 31, 23)

    expect(today()).toBe('2026-12-31')
  })
})

describe('monthKey', () => {
  it('returns YYYY-MM from a local date string', () => {
    expect(monthKey('2026-01-31')).toBe('2026-01')
    expect(monthKey('2025-12-01')).toBe('2025-12')
  })
})

describe('shiftMonth', () => {
  it('moves to the previous month across a year boundary', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
  })

  it('moves to the next month across a year boundary', () => {
    expect(shiftMonth('2025-12', 1)).toBe('2026-01')
  })

  it('moves within a year', () => {
    expect(shiftMonth('2026-01', 1)).toBe('2026-02')
    expect(shiftMonth('2026-06', -3)).toBe('2026-03')
  })

  it('returns the same month for zero', () => {
    expect(shiftMonth('2026-07', 0)).toBe('2026-07')
  })

  it('handles more than twelve months', () => {
    expect(shiftMonth('2026-12', 12)).toBe('2027-12')
    expect(shiftMonth('2026-01', -25)).toBe('2023-12')
  })
})

describe('isFuture', () => {
  it('treats today as not future', () => {
    setLocalNow(2026, 1, 15)

    expect(isFuture('2026-01-15')).toBe(false)
  })

  it('treats past dates as not future', () => {
    setLocalNow(2026, 1, 15)

    expect(isFuture('2026-01-14')).toBe(false)
    expect(isFuture('2025-12-31')).toBe(false)
  })

  it('detects future dates', () => {
    setLocalNow(2026, 1, 15)

    expect(isFuture('2026-01-16')).toBe(true)
    expect(isFuture('2026-02-01')).toBe(true)
  })

  it('is correct on the first day of a month', () => {
    setLocalNow(2026, 1, 1)

    expect(isFuture('2025-12-31')).toBe(false)
    expect(isFuture('2026-01-02')).toBe(true)
  })
})

describe('formatDay', () => {
  it('shows Today in English and Bangla', () => {
    setLocalNow(2026, 1, 15)

    expect(formatDay('2026-01-15', 'en')).toBe('Today')
    expect(formatDay('2026-01-15', 'bn')).toBe('আজ')
  })

  it('shows Yesterday in English and Bangla', () => {
    setLocalNow(2026, 1, 15)

    expect(formatDay('2026-01-14', 'en')).toBe('Yesterday')
    expect(formatDay('2026-01-14', 'bn')).toBe('গতকাল')
  })

  it('finds yesterday across a month boundary', () => {
    setLocalNow(2026, 3, 1)

    expect(formatDay('2026-02-28', 'en')).toBe('Yesterday')
  })

  it('finds yesterday across a year boundary', () => {
    setLocalNow(2026, 1, 1)

    expect(formatDay('2025-12-31', 'en')).toBe('Yesterday')
  })

  it('formats older English dates as day, short month, year', () => {
    setLocalNow(2026, 1, 15)

    expect(formatDay('2025-12-25', 'en')).toBe('25 Dec 2025')
    expect(formatDay('2026-01-05', 'en')).toBe('5 Jan 2026')
  })

  it('uses Bangla digits and short month names for bn', () => {
    setLocalNow(2026, 1, 15)

    expect(formatDay('2025-12-25', 'bn')).toBe('২৫ ডিসে ২০২৫')
    expect(formatDay('2026-01-05', 'bn')).toBe('৫ জানু ২০২৬')
  })

  it('does not treat tomorrow as Today', () => {
    setLocalNow(2026, 1, 15)

    expect(formatDay('2026-01-16', 'en')).toBe('16 Jan 2026')
  })
})
