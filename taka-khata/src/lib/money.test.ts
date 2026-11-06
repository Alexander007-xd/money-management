import { describe, expect, it } from 'vitest'
import { formatMoney, fromMinor, toMinor } from './money'

describe('toMinor', () => {
  it('converts a whole taka amount', () => {
    expect(toMinor('250')).toBe(25000)
  })

  it('converts an amount with poisha', () => {
    expect(toMinor('250.50')).toBe(25050)
  })

  it('converts 0.1 and 0.2 without floating point errors', () => {
    const ten = toMinor('0.1')
    const twenty = toMinor('0.2')

    expect(ten).toBe(10)
    expect(twenty).toBe(20)
    expect((ten ?? 0) + (twenty ?? 0)).toBe(30)
  })

  it('accepts at most two decimals', () => {
    expect(toMinor('0.05')).toBe(5)
    expect(toMinor('0.10')).toBe(10)
    expect(toMinor('12.3')).toBe(1230)
  })

  it('rejects more than two decimals', () => {
    expect(toMinor('12.345')).toBeNull()
  })

  it('accepts a leading decimal point', () => {
    expect(toMinor('.5')).toBe(50)
  })

  it('accepts thousands separators and the taka symbol', () => {
    expect(toMinor('1,234.50')).toBe(123450)
    expect(toMinor('৳1,234.50')).toBe(123450)
    expect(toMinor('Tk 1,234.50')).toBe(123450)
  })

  it('ignores surrounding spaces', () => {
    expect(toMinor('  12.3  ')).toBe(1230)
  })

  it('accepts Bangla digits', () => {
    expect(toMinor('১২৩.৪৫')).toBe(12345)
  })

  it('parses zero as zero', () => {
    expect(toMinor('0')).toBe(0)
  })

  it('parses the maximum amount', () => {
    expect(toMinor('9,999,999.99')).toBe(999999999)
  })

  it.each(['', '   ', 'abc', '1.2.3', '12.', '-5', '1e3', 'Infinity'])(
    'returns null for invalid input %j',
    (input) => {
      expect(toMinor(input)).toBeNull()
    },
  )

  it('returns null instead of NaN for very large input', () => {
    expect(toMinor('99999999999999999999.99')).toBeNull()
  })
})

describe('fromMinor', () => {
  it('formats poisha as a plain decimal string', () => {
    expect(fromMinor(25050)).toBe('250.50')
  })

  it('does not pad whole amounts', () => {
    expect(fromMinor(25000)).toBe('250')
  })

  it('keeps two digits for poisha below one taka', () => {
    expect(fromMinor(5)).toBe('0.05')
  })

  it('formats zero', () => {
    expect(fromMinor(0)).toBe('0')
  })

  it('formats the maximum amount without separators', () => {
    expect(fromMinor(999999999)).toBe('9999999.99')
  })

  it('keeps a negative sign', () => {
    expect(fromMinor(-25050)).toBe('-250.50')
  })

  it('round-trips through toMinor', () => {
    for (const minor of [0, 5, 100, 25050, 999999999]) {
      expect(toMinor(fromMinor(minor))).toBe(minor)
    }
  })
})

describe('formatMoney', () => {
  it('adds the taka symbol and two decimals', () => {
    expect(formatMoney(25050, 'en')).toBe('৳250.50')
  })

  it('always shows two decimals', () => {
    expect(formatMoney(0, 'en')).toBe('৳0.00')
    expect(formatMoney(100, 'en')).toBe('৳1.00')
  })

  it('groups thousands', () => {
    expect(formatMoney(123456789, 'en')).toBe('৳1,234,567.89')
    expect(formatMoney(999999999, 'en')).toBe('৳9,999,999.99')
  })

  it('uses Bangla digits for bn', () => {
    expect(formatMoney(25050, 'bn')).toBe('৳২৫০.৫০')
    expect(formatMoney(123456789, 'bn')).toBe('৳১,২৩৪,৫৬৭.৮৯')
    expect(formatMoney(5, 'bn')).toBe('৳০.০৫')
  })

  it('shows negative amounts with the minus before the symbol', () => {
    expect(formatMoney(-25050, 'en')).toBe('-৳250.50')
    expect(formatMoney(-25050, 'bn')).toBe('-৳২৫০.৫০')
  })

  it('formats a sum of 0.1 and 0.2 without float drift', () => {
    const total = (toMinor('0.1') ?? 0) + (toMinor('0.2') ?? 0)

    expect(formatMoney(total, 'en')).toBe('৳0.30')
  })
})
