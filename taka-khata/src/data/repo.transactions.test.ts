import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TakaKhataDatabase } from './db'
import {
  StorageError,
  ValidationError,
  addTransaction,
  deleteTransaction,
  listTransactions,
  restoreTransaction,
  updateTransaction,
  type TransactionFilter,
  type TransactionInput,
} from './repo'
import type { TransactionType } from './types'

const TEST_DB_NAME = 'takakhata-repo-transactions-test'

let database: TakaKhataDatabase

beforeEach(async () => {
  database = new TakaKhataDatabase(TEST_DB_NAME)
  await database.open()
})

afterEach(async () => {
  vi.restoreAllMocks()
  database.close()
  await Dexie.delete(TEST_DB_NAME)
})

function incomeInput(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    type: 'income',
    amountMinor: 500_000,
    categoryId: null,
    source: 'Baba',
    note: '',
    date: '2026-01-15',
    ...overrides,
  }
}

function expenseInput(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    type: 'expense',
    amountMinor: 25_050,
    categoryId: 'food',
    source: null,
    note: 'Lunch',
    date: '2026-01-15',
    ...overrides,
  }
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
  } catch (error) {
    return error
  }

  throw new Error('Expected the promise to reject')
}

async function expectValidationError(promise: Promise<unknown>): Promise<ValidationError> {
  const error = await rejectionOf(promise)

  expect(error).toBeInstanceOf(ValidationError)

  if (!(error instanceof ValidationError)) {
    throw error
  }

  return error
}

async function expectStorageError(promise: Promise<unknown>): Promise<StorageError> {
  const error = await rejectionOf(promise)

  expect(error).toBeInstanceOf(StorageError)

  if (!(error instanceof StorageError)) {
    throw error
  }

  return error
}

describe('addTransaction', () => {
  it('stores an income with a generated id and timestamps', async () => {
    const created = await addTransaction(incomeInput(), database)

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
    expect(created).toMatchObject({
      type: 'income',
      amountMinor: 500_000,
      categoryId: null,
      source: 'Baba',
      note: '',
      date: '2026-01-15',
    })
    expect(created.createdAt).toEqual(expect.any(Number))
    expect(created.updatedAt).toBe(created.createdAt)
    expect(await database.transactions.get(created.id)).toEqual(created)
  })

  it('generates a different id for each entry', async () => {
    const first = await addTransaction(incomeInput(), database)
    const second = await addTransaction(incomeInput(), database)

    expect(second.id).not.toBe(first.id)
  })

  it('defaults omitted optional fields', async () => {
    const created = await addTransaction(
      {
        type: 'expense',
        amountMinor: 1_000,
        categoryId: 'food',
        date: '2026-01-15',
      },
      database,
    )

    expect(created.source).toBeNull()
    expect(created.note).toBe('')
  })

  it('rejects an expense without a category and stores nothing', async () => {
    const error = await expectValidationError(
      addTransaction(expenseInput({ categoryId: null }), database),
    )

    expect(error.errors).toContainEqual({ field: 'categoryId', code: 'categoryRequired' })
    expect(await database.transactions.count()).toBe(0)
  })

  it('rejects a future date', async () => {
    const error = await expectValidationError(
      addTransaction(incomeInput({ date: '2999-01-01' }), database),
    )

    expect(error.errors).toContainEqual({ field: 'date', code: 'futureDate' })
    expect(await database.transactions.count()).toBe(0)
  })

  it('rejects a non-positive amount', async () => {
    const error = await expectValidationError(
      addTransaction(expenseInput({ amountMinor: 0 }), database),
    )

    expect(error.errors).toContainEqual({ field: 'amountMinor', code: 'amountNotPositive' })
    expect(await database.transactions.count()).toBe(0)
  })
})

describe('updateTransaction', () => {
  it('updates the fields, keeps createdAt and bumps updatedAt', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const created = await addTransaction(incomeInput(), database)

    now.mockReturnValue(1_700_000_060_000)
    const updated = await updateTransaction(
      created.id,
      incomeInput({ amountMinor: 600_000, source: 'Ammu', note: 'Eid' }),
      database,
    )

    expect(updated.id).toBe(created.id)
    expect(updated.createdAt).toBe(created.createdAt)
    expect(updated.updatedAt).toBe(1_700_000_060_000)
    expect(updated.amountMinor).toBe(600_000)
    expect(updated.source).toBe('Ammu')
    expect(updated.note).toBe('Eid')
    expect(await database.transactions.get(created.id)).toEqual(updated)
  })

  it('rejects invalid changes and leaves the stored entry unchanged', async () => {
    const created = await addTransaction(expenseInput(), database)

    const error = await expectValidationError(
      updateTransaction(created.id, expenseInput({ categoryId: null }), database),
    )

    expect(error.errors).toContainEqual({ field: 'categoryId', code: 'categoryRequired' })
    expect(await database.transactions.get(created.id)).toEqual(created)
  })

  it('throws a StorageError when the entry does not exist', async () => {
    await expectStorageError(updateTransaction('missing-entry', incomeInput(), database))
  })
})

describe('deleteTransaction and restoreTransaction', () => {
  it('deletes an entry permanently', async () => {
    const created = await addTransaction(incomeInput(), database)

    await deleteTransaction(created.id, database)

    expect(await database.transactions.get(created.id)).toBeUndefined()
  })

  it('rejects an empty id', async () => {
    const error = await expectValidationError(deleteTransaction('', database))

    expect(error.errors).toContainEqual({ field: 'id', code: 'required' })
  })

  it('restores a deleted entry with the same id and fields', async () => {
    const created = await addTransaction(incomeInput(), database)
    await deleteTransaction(created.id, database)

    const restored = await restoreTransaction(created, database)

    expect(restored).toEqual(created)
    expect(await database.transactions.get(created.id)).toEqual(created)
  })

  it('rejects an invalid snapshot and stores nothing', async () => {
    const created = await addTransaction(incomeInput(), database)
    await deleteTransaction(created.id, database)

    const error = await expectValidationError(
      restoreTransaction({ ...created, amountMinor: 0 }, database),
    )

    expect(error.errors).toContainEqual({ field: 'amountMinor', code: 'amountNotPositive' })
    expect(await database.transactions.count()).toBe(0)
  })

  it('throws a StorageError when the id already exists', async () => {
    const created = await addTransaction(incomeInput(), database)

    await expectStorageError(restoreTransaction(created, database))
  })
})

describe('listTransactions', () => {
  it('returns every entry, newest date first', async () => {
    const january = await addTransaction(incomeInput({ date: '2026-01-10' }), database)
    const february = await addTransaction(expenseInput({ date: '2026-02-01' }), database)
    const januaryLate = await addTransaction(expenseInput({ date: '2026-01-31' }), database)

    const all = await listTransactions({}, database)

    expect(all.map((transaction) => transaction.id)).toEqual([
      february.id,
      januaryLate.id,
      january.id,
    ])
  })

  it('uses createdAt to order entries on the same day', async () => {
    const now = vi.spyOn(Date, 'now')

    now.mockReturnValue(1_000)
    const first = await addTransaction(incomeInput({ date: '2026-01-10' }), database)

    now.mockReturnValue(2_000)
    const second = await addTransaction(incomeInput({ date: '2026-01-10' }), database)

    const all = await listTransactions({}, database)

    expect(all.map((transaction) => transaction.id)).toEqual([second.id, first.id])
  })

  it('defaults to every entry when no filter is given', async () => {
    const created = await addTransaction(incomeInput(), database)

    expect(await listTransactions(undefined, database)).toEqual([created])
  })

  it('filters by month at month boundaries', async () => {
    await addTransaction(incomeInput({ date: '2025-12-31' }), database)
    const firstJanuary = await addTransaction(incomeInput({ date: '2026-01-01' }), database)
    const lastJanuary = await addTransaction(incomeInput({ date: '2026-01-31' }), database)
    await addTransaction(incomeInput({ date: '2026-02-01' }), database)

    const january = await listTransactions({ month: '2026-01' }, database)

    expect(january.map((transaction) => transaction.id).sort()).toEqual(
      [firstJanuary.id, lastJanuary.id].sort(),
    )
  })

  it('filters by type', async () => {
    const income = await addTransaction(incomeInput(), database)
    await addTransaction(expenseInput(), database)

    const incomes = await listTransactions({ type: 'income' }, database)

    expect(incomes.map((transaction) => transaction.id)).toEqual([income.id])
  })

  it('filters by category', async () => {
    const food = await addTransaction(expenseInput(), database)
    await addTransaction(expenseInput({ categoryId: 'transport' }), database)
    await addTransaction(incomeInput(), database)

    const foodExpenses = await listTransactions({ categoryId: 'food' }, database)

    expect(foodExpenses.map((transaction) => transaction.id)).toEqual([food.id])
  })

  it('combines month, type and category filters', async () => {
    const januaryFood = await addTransaction(
      expenseInput({ date: '2026-01-05', categoryId: 'food' }),
      database,
    )
    const januaryTransport = await addTransaction(
      expenseInput({ date: '2026-01-06', categoryId: 'transport' }),
      database,
    )
    await addTransaction(incomeInput({ date: '2026-01-07' }), database)
    const februaryFood = await addTransaction(
      expenseInput({ date: '2026-02-05', categoryId: 'food' }),
      database,
    )
    await addTransaction(incomeInput({ date: '2026-02-06' }), database)

    const januaryFoodOnly = await listTransactions(
      { month: '2026-01', type: 'expense', categoryId: 'food' },
      database,
    )
    const januaryExpenses = await listTransactions(
      { month: '2026-01', type: 'expense' },
      database,
    )
    const allFood = await listTransactions({ type: 'expense', categoryId: 'food' }, database)
    const februaryFoodOnly = await listTransactions(
      { month: '2026-02', categoryId: 'food' },
      database,
    )

    expect(januaryFoodOnly.map((transaction) => transaction.id)).toEqual([januaryFood.id])
    expect(januaryExpenses.map((transaction) => transaction.id)).toEqual([
      januaryTransport.id,
      januaryFood.id,
    ])
    expect(allFood.map((transaction) => transaction.id)).toEqual([
      februaryFood.id,
      januaryFood.id,
    ])
    expect(februaryFoodOnly.map((transaction) => transaction.id)).toEqual([februaryFood.id])
  })

  it('returns an empty array when nothing matches', async () => {
    await addTransaction(incomeInput({ date: '2026-01-10' }), database)

    expect(await listTransactions({ month: '2026-03' }, database)).toEqual([])
  })

  it.each([
    ['month 2026-13', { month: '2026-13' }],
    ['month 2026-1', { month: '2026-1' }],
    ['type transfer', { type: 'transfer' as TransactionType }],
    ['empty category', { categoryId: '' }],
  ])('rejects the %s filter', async (_label, filter) => {
    await expectValidationError(listTransactions(filter as TransactionFilter, database))
  })
})
