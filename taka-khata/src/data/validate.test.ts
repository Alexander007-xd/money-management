import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ValidationErrorCode, ValidationResult } from './validate'
import {
  MAX_AMOUNT_MINOR,
  NOTE_MAX_LENGTH,
  validateAmountInput,
  validateCashCheck,
  validateCategory,
  validateTransaction,
} from './validate'

function expectOk<T>(result: ValidationResult<T>): T {
  if (!result.ok) {
    throw new Error(`Expected a valid result, got ${JSON.stringify(result.errors)}`)
  }

  return result.value
}

function expectError<T>(result: ValidationResult<T>, field: string, code: ValidationErrorCode): void {
  expect(result.ok).toBe(false)

  if (!result.ok) {
    expect(result.errors).toContainEqual({ field, code })
  }
}

const validExpense = {
  id: 'entry-1',
  type: 'expense',
  amountMinor: 25050,
  categoryId: 'food',
  source: null,
  note: 'Lunch',
  date: '2026-01-15',
  createdAt: 1768464000000,
  updatedAt: 1768464000000,
}

const validIncome = {
  id: 'entry-2',
  type: 'income',
  amountMinor: 500000,
  categoryId: null,
  source: 'Baba',
  note: '',
  date: '2026-01-15',
  createdAt: 1768464000000,
  updatedAt: 1768464000000,
}

const validCategory = {
  id: 'food',
  nameEn: 'Food',
  nameBn: 'খাবার',
  icon: 'utensils',
  isDefault: true,
  archived: false,
  sortOrder: 3,
}

const validCashCheck = {
  id: 'check-1',
  date: '2026-01-15',
  countedMinor: 50000,
  expectedMinor: 45000,
  diffMinor: 5000,
  createdAt: 1768464000000,
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('validateAmountInput', () => {
  it('parses a valid amount to poisha', () => {
    expect(expectOk(validateAmountInput('250.50'))).toBe(25050)
  })

  it('accepts the maximum amount', () => {
    expect(expectOk(validateAmountInput('9,999,999.99'))).toBe(MAX_AMOUNT_MINOR)
  })

  it('accepts Bangla digits', () => {
    expect(expectOk(validateAmountInput('১,২৩৪.৫০'))).toBe(123450)
  })

  it('requires a value', () => {
    expectError(validateAmountInput(''), 'amount', 'amountRequired')
    expectError(validateAmountInput('   '), 'amount', 'amountRequired')
  })

  it('rejects text and malformed numbers', () => {
    expectError(validateAmountInput('abc'), 'amount', 'amountInvalid')
    expectError(validateAmountInput('1.2.3'), 'amount', 'amountInvalid')
    expectError(validateAmountInput('-5'), 'amount', 'amountInvalid')
  })

  it('rejects more than two decimals', () => {
    expectError(validateAmountInput('12.345'), 'amount', 'amountInvalid')
  })

  it('rejects zero', () => {
    expectError(validateAmountInput('0'), 'amount', 'amountNotPositive')
    expectError(validateAmountInput('0.00'), 'amount', 'amountNotPositive')
  })

  it('rejects an amount above the maximum', () => {
    expectError(validateAmountInput('10000000'), 'amount', 'amountTooLarge')
  })
})

describe('validateTransaction', () => {
  it('accepts a valid expense', () => {
    const value = expectOk(validateTransaction(validExpense))

    expect(value.amountMinor).toBe(25050)
    expect(value.categoryId).toBe('food')
  })

  it('accepts a valid income', () => {
    const value = expectOk(validateTransaction(validIncome))

    expect(value.source).toBe('Baba')
    expect(value.categoryId).toBeNull()
  })

  it('defaults note and source when they are missing', () => {
    const value = expectOk(
      validateTransaction({ ...validIncome, source: undefined, note: undefined }),
    )

    expect(value.note).toBe('')
    expect(value.source).toBeNull()
  })

  it('requires a non-empty string id', () => {
    expectError(validateTransaction({ ...validExpense, id: undefined }), 'id', 'required')
    expectError(validateTransaction({ ...validExpense, id: '' }), 'id', 'required')
    expectError(validateTransaction({ ...validExpense, id: 5 }), 'id', 'invalidType')
  })

  it('requires a known type', () => {
    expectError(validateTransaction({ ...validExpense, type: undefined }), 'type', 'required')
    expectError(validateTransaction({ ...validExpense, type: 'transfer' }), 'type', 'invalidValue')
  })

  it('requires a positive integer amount within the maximum', () => {
    expectError(validateTransaction({ ...validExpense, amountMinor: undefined }), 'amountMinor', 'required')
    expectError(validateTransaction({ ...validExpense, amountMinor: '250' }), 'amountMinor', 'invalidType')
    expectError(validateTransaction({ ...validExpense, amountMinor: 250.5 }), 'amountMinor', 'invalidValue')
    expectError(validateTransaction({ ...validExpense, amountMinor: 0 }), 'amountMinor', 'amountNotPositive')
    expectError(validateTransaction({ ...validExpense, amountMinor: -1 }), 'amountMinor', 'amountNotPositive')
    expectError(
      validateTransaction({ ...validExpense, amountMinor: MAX_AMOUNT_MINOR + 1 }),
      'amountMinor',
      'amountTooLarge',
    )
  })

  it('requires a category for expense', () => {
    expectError(
      validateTransaction({ ...validExpense, categoryId: null }),
      'categoryId',
      'categoryRequired',
    )
    expectError(
      validateTransaction({ ...validExpense, categoryId: '' }),
      'categoryId',
      'categoryRequired',
    )
  })

  it('does not allow a category for income', () => {
    expectError(
      validateTransaction({ ...validIncome, categoryId: 'food' }),
      'categoryId',
      'invalidValue',
    )
  })

  it('does not allow a source for expense', () => {
    expectError(
      validateTransaction({ ...validExpense, source: 'Baba' }),
      'source',
      'invalidValue',
    )
  })

  it('accepts a note of exactly the maximum length and rejects one longer', () => {
    expectOk(validateTransaction({ ...validExpense, note: 'a'.repeat(NOTE_MAX_LENGTH) }))
    expectError(
      validateTransaction({ ...validExpense, note: 'a'.repeat(NOTE_MAX_LENGTH + 1) }),
      'note',
      'noteTooLong',
    )
  })

  it('rejects a non-string note', () => {
    expectError(validateTransaction({ ...validExpense, note: 12 }), 'note', 'invalidType')
  })

  it('requires a real calendar date', () => {
    expectError(validateTransaction({ ...validExpense, date: undefined }), 'date', 'required')
    expectError(validateTransaction({ ...validExpense, date: '2026-02-30' }), 'date', 'invalidDate')
    expectError(validateTransaction({ ...validExpense, date: '15/01/2026' }), 'date', 'invalidDate')
  })

  it('rejects a future date but accepts today', () => {
    expectOk(validateTransaction({ ...validExpense, date: '2026-01-15' }))
    expectError(validateTransaction({ ...validExpense, date: '2026-01-16' }), 'date', 'futureDate')
  })

  it('requires valid timestamps', () => {
    expectError(validateTransaction({ ...validExpense, createdAt: undefined }), 'createdAt', 'required')
    expectError(validateTransaction({ ...validExpense, updatedAt: 'now' }), 'updatedAt', 'invalidType')
    expectError(validateTransaction({ ...validExpense, createdAt: 1.5 }), 'createdAt', 'invalidValue')
    expectError(validateTransaction({ ...validExpense, updatedAt: -1 }), 'updatedAt', 'outOfRange')
  })

  it('rejects a non-object record', () => {
    expectError(validateTransaction('not a transaction'), 'record', 'invalidType')
  })
})

describe('validateCategory', () => {
  it('accepts a valid category', () => {
    const value = expectOk(validateCategory(validCategory))

    expect(value.nameBn).toBe('খাবার')
    expect(value.icon).toBe('utensils')
  })

  it('requires non-empty names', () => {
    expectError(validateCategory({ ...validCategory, nameEn: '' }), 'nameEn', 'required')
    expectError(validateCategory({ ...validCategory, nameBn: 5 }), 'nameBn', 'invalidType')
  })

  it('requires a known icon', () => {
    expectError(validateCategory({ ...validCategory, icon: 'rocket' }), 'icon', 'invalidValue')
  })

  it('requires boolean flags', () => {
    expectError(validateCategory({ ...validCategory, isDefault: undefined }), 'isDefault', 'required')
    expectError(validateCategory({ ...validCategory, archived: 'no' }), 'archived', 'invalidType')
  })

  it('requires an integer sort order', () => {
    expectError(validateCategory({ ...validCategory, sortOrder: undefined }), 'sortOrder', 'required')
    expectError(validateCategory({ ...validCategory, sortOrder: 1.5 }), 'sortOrder', 'invalidValue')
  })

  it('accepts a non-UUID default id', () => {
    expectOk(validateCategory({ ...validCategory, id: 'hostel' }))
  })
})

describe('validateCashCheck', () => {
  it('accepts a valid check', () => {
    const value = expectOk(validateCashCheck(validCashCheck))

    expect(value.diffMinor).toBe(5000)
  })

  it('accepts a negative expected balance and a negative difference', () => {
    expectOk(validateCashCheck({ ...validCashCheck, expectedMinor: -45000, diffMinor: 95000 }))
  })

  it('requires a valid date', () => {
    expectError(validateCashCheck({ ...validCashCheck, date: '2026-13-01' }), 'date', 'invalidDate')
  })

  it('requires integer money fields', () => {
    expectError(validateCashCheck({ ...validCashCheck, countedMinor: 1.5 }), 'countedMinor', 'invalidValue')
    expectError(validateCashCheck({ ...validCashCheck, expectedMinor: '45000' }), 'expectedMinor', 'invalidType')
    expectError(validateCashCheck({ ...validCashCheck, diffMinor: undefined }), 'diffMinor', 'required')
  })

  it('requires a timestamp', () => {
    expectError(validateCashCheck({ ...validCashCheck, createdAt: undefined }), 'createdAt', 'required')
  })
})
