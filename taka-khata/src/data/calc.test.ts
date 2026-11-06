import { describe, expect, it } from 'vitest'
import type { Transaction } from './types'
import { balance, diffForCheck, expenseByCategory, monthTotals } from './calc'

let nextId = 0

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  nextId += 1

  return {
    id: `entry-${nextId}`,
    type: 'expense',
    amountMinor: 100,
    categoryId: 'food',
    source: null,
    note: '',
    date: '2026-01-15',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function income(amountMinor: number, date = '2026-01-15'): Transaction {
  return transaction({
    type: 'income',
    amountMinor,
    categoryId: null,
    source: 'Baba',
    date,
  })
}

function expense(amountMinor: number, categoryId = 'food', date = '2026-01-15'): Transaction {
  return transaction({ type: 'expense', amountMinor, categoryId, date })
}

describe('balance', () => {
  it('is zero for no entries', () => {
    expect(balance([])).toBe(0)
  })

  it('adds income', () => {
    expect(balance([income(50000), income(25000)])).toBe(75000)
  })

  it('subtracts expenses', () => {
    expect(balance([expense(25050)])).toBe(-25050)
  })

  it('mixes income and expenses across all dates', () => {
    const entries = [
      income(100000, '2026-01-01'),
      expense(25050, 'food', '2026-01-15'),
      expense(10000, 'transport', '2025-12-31'),
    ]

    expect(balance(entries)).toBe(64950)
  })

  it('can be negative', () => {
    expect(balance([income(100), expense(500)])).toBe(-400)
  })

  it('handles large amounts without float errors', () => {
    expect(balance([income(999999999), expense(999999999)])).toBe(0)
  })
})

describe('monthTotals', () => {
  it('is all zero for no entries', () => {
    expect(monthTotals([], '2026-01')).toEqual({
      incomeMinor: 0,
      expenseMinor: 0,
      leftMinor: 0,
    })
  })

  it('totals only the requested month', () => {
    const entries = [
      income(100000, '2026-01-01'),
      expense(25050, 'food', '2026-01-15'),
      income(900000, '2026-02-01'),
      expense(7000, 'food', '2025-12-31'),
    ]

    expect(monthTotals(entries, '2026-01')).toEqual({
      incomeMinor: 100000,
      expenseMinor: 25050,
      leftMinor: 74950,
    })
  })

  it('sums several entries in the month', () => {
    const entries = [income(50000), income(25000), expense(10000), expense(5000)]

    expect(monthTotals(entries, '2026-01')).toEqual({
      incomeMinor: 75000,
      expenseMinor: 15000,
      leftMinor: 60000,
    })
  })

  it('returns a negative left amount when spending is higher', () => {
    const entries = [income(1000), expense(5000)]

    expect(monthTotals(entries, '2026-01').leftMinor).toBe(-4000)
  })

  it('handles a month with only one type', () => {
    expect(monthTotals([income(12345)], '2026-01')).toEqual({
      incomeMinor: 12345,
      expenseMinor: 0,
      leftMinor: 12345,
    })
    expect(monthTotals([expense(12345)], '2026-01')).toEqual({
      incomeMinor: 0,
      expenseMinor: 12345,
      leftMinor: -12345,
    })
  })
})

describe('expenseByCategory', () => {
  it('is empty for no entries', () => {
    expect(expenseByCategory([], '2026-01')).toEqual([])
  })

  it('is empty when the month has only income', () => {
    expect(expenseByCategory([income(50000)], '2026-01')).toEqual([])
  })

  it('gives a single category 100 percent', () => {
    expect(expenseByCategory([expense(25050)], '2026-01')).toEqual([
      { categoryId: 'food', totalMinor: 25050, percent: 100 },
    ])
  })

  it('combines entries of the same category', () => {
    expect(expenseByCategory([expense(100), expense(200)], '2026-01')).toEqual([
      { categoryId: 'food', totalMinor: 300, percent: 100 },
    ])
  })

  it('sorts by total spending, highest first', () => {
    const entries = [expense(100, 'food'), expense(300, 'wifi'), expense(200, 'transport')]

    expect(expenseByCategory(entries, '2026-01')).toEqual([
      { categoryId: 'wifi', totalMinor: 300, percent: 50 },
      { categoryId: 'transport', totalMinor: 200, percent: 33 },
      { categoryId: 'food', totalMinor: 100, percent: 17 },
    ])
  })

  it('ignores other months and income', () => {
    const entries = [
      expense(300, 'wifi', '2026-01-10'),
      expense(900, 'wifi', '2026-02-10'),
      income(500, '2026-01-10'),
    ]

    expect(expenseByCategory(entries, '2026-01')).toEqual([
      { categoryId: 'wifi', totalMinor: 300, percent: 100 },
    ])
  })

  it('rounds percentages to whole numbers', () => {
    const entries = [expense(100, 'food'), expense(200, 'wifi')]

    expect(expenseByCategory(entries, '2026-01')).toEqual([
      { categoryId: 'wifi', totalMinor: 200, percent: 67 },
      { categoryId: 'food', totalMinor: 100, percent: 33 },
    ])
  })

  it('rounds a half percent up', () => {
    const entries = [expense(100, 'food'), expense(19900, 'wifi')]

    expect(expenseByCategory(entries, '2026-01')).toEqual([
      { categoryId: 'wifi', totalMinor: 19900, percent: 100 },
      { categoryId: 'food', totalMinor: 100, percent: 1 },
    ])
  })

  it('does not force percentages to add up to 100', () => {
    const entries = [expense(100, 'food'), expense(100, 'wifi'), expense(100, 'transport')]
    const result = expenseByCategory(entries, '2026-01')

    expect(result.map((row) => row.percent)).toEqual([33, 33, 33])
  })
})

describe('diffForCheck', () => {
  it('is zero when counted equals expected', () => {
    expect(diffForCheck(50000, 50000)).toBe(0)
  })

  it('is negative when money is missing', () => {
    expect(diffForCheck(45000, 50000)).toBe(-5000)
  })

  it('is positive when there is extra money', () => {
    expect(diffForCheck(55000, 50000)).toBe(5000)
  })

  it('works with a negative expected balance', () => {
    expect(diffForCheck(0, -5000)).toBe(5000)
  })
})
