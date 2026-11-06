import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DB_VERSION, DEFAULT_CATEGORIES, TakaKhataDatabase } from './db'
import {
  StorageError,
  ValidationError,
  addCashCheck,
  addCategory,
  addTransaction,
  exportAll,
  importAll,
  setSetting,
} from './repo'
import type {
  BackupData,
  CashCheck,
  CategoryIcon,
  Setting,
  Transaction,
} from './types'

const SOURCE_DB_NAME = 'takakhata-repo-backup-source'
const TARGET_DB_NAME = 'takakhata-repo-backup-target'

let database: TakaKhataDatabase
const openedDatabases: TakaKhataDatabase[] = []

function openDatabase(name: string): TakaKhataDatabase {
  const opened = new TakaKhataDatabase(name)
  openedDatabases.push(opened)

  return opened
}

beforeEach(async () => {
  database = openDatabase(SOURCE_DB_NAME)
  await database.open()
})

afterEach(async () => {
  vi.restoreAllMocks()

  for (const opened of openedDatabases) {
    opened.close()
  }

  openedDatabases.length = 0
  await Dexie.delete(SOURCE_DB_NAME)
  await Dexie.delete(TARGET_DB_NAME)
})

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

function validTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'entry-1',
    type: 'expense',
    amountMinor: 25_050,
    categoryId: 'food',
    source: null,
    note: 'Lunch',
    date: '2026-01-15',
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    ...overrides,
  }
}

function validCashCheck(overrides: Partial<CashCheck> = {}): CashCheck {
  return {
    id: 'check-1',
    date: '2026-01-15',
    countedMinor: 50_000,
    expectedMinor: 45_000,
    diffMinor: 5_000,
    createdAt: 1_700_000_000_000,
    ...overrides,
  }
}

function validSetting(overrides: Partial<Setting> = {}): Setting {
  return {
    key: 'language',
    value: 'bn',
    ...overrides,
  }
}

function validBackup(overrides: Partial<BackupData> = {}): BackupData {
  return {
    app: 'taka-khata',
    schemaVersion: DB_VERSION,
    exportedAt: 1_700_000_000_000,
    transactions: [validTransaction()],
    categories: [...DEFAULT_CATEGORIES],
    cashChecks: [validCashCheck()],
    settings: [validSetting()],
    ...overrides,
  }
}

describe('exportAll', () => {
  it('exports the envelope and every table', async () => {
    const transaction = await addTransaction(
      {
        type: 'expense',
        amountMinor: 25_050,
        categoryId: 'food',
        note: 'Lunch',
        date: '2026-01-15',
      },
      database,
    )
    const category = await addCategory(
      { nameEn: 'Medicine', nameBn: 'ঔষধ', icon: 'heart' },
      database,
    )
    const cashCheck = await addCashCheck(
      { date: '2026-01-15', countedMinor: 50_000, expectedMinor: 45_000 },
      database,
    )
    await setSetting('language', 'bn', database)

    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    const backup = await exportAll(database)

    expect(backup.app).toBe('taka-khata')
    expect(backup.schemaVersion).toBe(DB_VERSION)
    expect(backup.exportedAt).toBe(1_700_000_000_000)
    expect(backup.transactions).toEqual([transaction])
    expect(backup.categories).toHaveLength(10)
    expect(backup.categories).toContainEqual(category)
    expect(backup.cashChecks).toEqual([cashCheck])
    expect(backup.settings).toEqual([{ key: 'language', value: 'bn' }])
  })

  it('exports empty arrays when there is no data', async () => {
    const backup = await exportAll(database)

    expect(backup.transactions).toEqual([])
    expect(backup.cashChecks).toEqual([])
    expect(backup.settings).toEqual([])
    expect(backup.categories).toHaveLength(9)
  })
})

describe('importAll', () => {
  it('restores an exported backup into an empty database', async () => {
    await addTransaction(
      {
        type: 'income',
        amountMinor: 500_000,
        source: 'Baba',
        date: '2026-01-15',
      },
      database,
    )
    await addCategory({ nameEn: 'Medicine', nameBn: 'ঔষধ', icon: 'heart' }, database)
    await addCashCheck(
      { date: '2026-01-15', countedMinor: 50_000, expectedMinor: 45_000 },
      database,
    )
    await setSetting('language', 'en', database)

    const backup = await exportAll(database)
    const target = openDatabase(TARGET_DB_NAME)
    await target.open()

    await importAll(backup, target)

    const restored = await exportAll(target)

    expect(restored.transactions).toEqual(backup.transactions)
    expect(restored.categories).toEqual(backup.categories)
    expect(restored.cashChecks).toEqual(backup.cashChecks)
    expect(restored.settings).toEqual(backup.settings)
  })

  it('replaces existing data instead of merging it', async () => {
    const oldTransaction = await addTransaction(
      {
        type: 'income',
        amountMinor: 500_000,
        source: 'Baba',
        date: '2026-01-15',
      },
      database,
    )
    await setSetting('language', 'bn', database)

    const backup = validBackup({
      transactions: [
        validTransaction({ id: 'new-entry', categoryId: 'hostel', note: 'New' }),
      ],
      categories: [{ ...DEFAULT_CATEGORIES[0] }],
      cashChecks: [],
      settings: [{ key: 'language', value: 'en' }],
    })

    await importAll(backup, database)

    expect(await database.transactions.toArray()).toEqual(backup.transactions)
    expect(await database.categories.toArray()).toEqual(backup.categories)
    expect(await database.cashChecks.toArray()).toEqual([])
    expect(await database.settings.toArray()).toEqual(backup.settings)
    expect(await database.transactions.get(oldTransaction.id)).toBeUndefined()
  })

  it('rejects a file that is not a Taka Khata backup and changes nothing', async () => {
    const original = await addTransaction(
      {
        type: 'income',
        amountMinor: 500_000,
        source: 'Baba',
        date: '2026-01-15',
      },
      database,
    )

    const error = await expectValidationError(
      importAll({ ...validBackup(), app: 'other-app' }, database),
    )

    expect(error.errors).toContainEqual({ field: 'app', code: 'invalidValue' })
    expect(await database.transactions.get(original.id)).toEqual(original)
  })

  it('rejects a backup from a newer schema version', async () => {
    const error = await expectValidationError(
      importAll(validBackup({ schemaVersion: DB_VERSION + 1 }), database),
    )

    expect(error.errors).toContainEqual({ field: 'schemaVersion', code: 'outOfRange' })
  })

  it('rejects an invalid transaction record', async () => {
    const original = await addTransaction(
      {
        type: 'income',
        amountMinor: 500_000,
        source: 'Baba',
        date: '2026-01-15',
      },
      database,
    )

    const error = await expectValidationError(
      importAll(validBackup({ transactions: [validTransaction({ amountMinor: 0 })] }), database),
    )

    expect(error.errors).toContainEqual({
      field: 'transactions[0].amountMinor',
      code: 'amountNotPositive',
    })
    expect(await database.transactions.get(original.id)).toEqual(original)
  })

  it('rejects an invalid category record', async () => {
    const error = await expectValidationError(
      importAll(
        validBackup({
          categories: [
            { ...DEFAULT_CATEGORIES[0], icon: 'rocket' as CategoryIcon },
          ],
        }),
        database,
      ),
    )

    expect(error.errors).toContainEqual({
      field: 'categories[0].icon',
      code: 'invalidValue',
    })
  })

  it('rejects an invalid cash check record', async () => {
    const error = await expectValidationError(
      importAll(validBackup({ cashChecks: [validCashCheck({ countedMinor: 1.5 })] }), database),
    )

    expect(error.errors).toContainEqual({
      field: 'cashChecks[0].countedMinor',
      code: 'invalidValue',
    })
  })

  it('rejects an invalid setting record', async () => {
    const error = await expectValidationError(
      importAll(validBackup({ settings: [validSetting({ value: 'fr' })] }), database),
    )

    expect(error.errors).toContainEqual({
      field: 'settings[0].value',
      code: 'invalidValue',
    })
  })

  it('rejects a file with missing tables', async () => {
    const error = await expectValidationError(
      importAll(
        {
          app: 'taka-khata',
          schemaVersion: DB_VERSION,
          exportedAt: 1_700_000_000_000,
          transactions: [],
          categories: [],
          cashChecks: [],
        },
        database,
      ),
    )

    expect(error.errors).toContainEqual({ field: 'settings', code: 'required' })
  })

  it('rolls back every table when a write fails', async () => {
    const original = await addTransaction(
      {
        type: 'income',
        amountMinor: 500_000,
        source: 'Baba',
        date: '2026-01-15',
      },
      database,
    )
    await setSetting('language', 'bn', database)

    const duplicate = validTransaction({ id: 'duplicate-entry' })
    const backup = validBackup({
      transactions: [duplicate, { ...duplicate, note: 'Second copy' }],
      categories: [...DEFAULT_CATEGORIES],
      cashChecks: [],
      settings: [{ key: 'language', value: 'en' }],
    })

    await expectStorageError(importAll(backup, database))

    expect(await database.transactions.get(original.id)).toEqual(original)
    expect(await database.settings.get('language')).toEqual({
      key: 'language',
      value: 'bn',
    })
    expect(await database.categories.count()).toBe(9)
  })
})
