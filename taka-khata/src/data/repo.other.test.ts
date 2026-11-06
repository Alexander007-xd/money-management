import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TakaKhataDatabase } from './db'
import {
  StorageError,
  ValidationError,
  addCashCheck,
  addCategory,
  getCategories,
  getSetting,
  listCashChecks,
  setSetting,
  updateCategory,
  type CategoryUpdate,
} from './repo'
import type { CategoryIcon } from './types'

const TEST_DB_NAME = 'takakhata-repo-other-test'

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

describe('categories', () => {
  it('returns the default categories in sort order', async () => {
    const categories = await getCategories(database)

    expect(categories.map((category) => category.id)).toEqual([
      'hostel',
      'cook',
      'food',
      'wifi',
      'electricity',
      'gas',
      'transport',
      'study',
      'other',
    ])
    expect(categories.map((category) => category.sortOrder)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ])
  })

  it('adds a custom category with the next sort order', async () => {
    const created = await addCategory(
      { nameEn: 'Medicine', nameBn: 'ঔষধ', icon: 'heart' },
      database,
    )

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
    expect(created).toMatchObject({
      nameEn: 'Medicine',
      nameBn: 'ঔষধ',
      icon: 'heart',
      isDefault: false,
      archived: false,
      sortOrder: 9,
    })
    expect(await database.categories.get(created.id)).toEqual(created)
    expect((await getCategories(database)).at(-1)).toEqual(created)
  })

  it('uses the next sort order for each new category', async () => {
    const first = await addCategory(
      { nameEn: 'Medicine', nameBn: 'ঔষধ', icon: 'heart' },
      database,
    )
    const second = await addCategory(
      { nameEn: 'Phone', nameBn: 'মোবাইল', icon: 'phone' },
      database,
    )

    expect(second.sortOrder).toBe(first.sortOrder + 1)
  })

  it('rejects an invalid category and stores nothing', async () => {
    const error = await expectValidationError(
      addCategory({ nameEn: '', nameBn: '   ', icon: 'heart' }, database),
    )

    expect(error.errors).toContainEqual({ field: 'nameEn', code: 'required' })
    expect(error.errors).toContainEqual({ field: 'nameBn', code: 'required' })
    expect(await database.categories.count()).toBe(9)
  })

  it('rejects an icon that is not in the allowed set', async () => {
    const error = await expectValidationError(
      addCategory(
        { nameEn: 'Rocket', nameBn: 'রকেট', icon: 'rocket' as CategoryIcon },
        database,
      ),
    )

    expect(error.errors).toContainEqual({ field: 'icon', code: 'invalidValue' })
    expect(await database.categories.count()).toBe(9)
  })

  it('renames a default category without changing isDefault or sortOrder', async () => {
    const renamed = await updateCategory(
      'hostel',
      { nameEn: 'Room Rent', nameBn: 'রুম ভাড়া' },
      database,
    )

    expect(renamed).toMatchObject({
      id: 'hostel',
      nameEn: 'Room Rent',
      nameBn: 'রুম ভাড়া',
      isDefault: true,
      archived: false,
      sortOrder: 0,
    })
    expect(await database.categories.get('hostel')).toEqual(renamed)
  })

  it('changes a category icon', async () => {
    const updated = await updateCategory('food', { icon: 'heart' }, database)

    expect(updated.icon).toBe('heart')
    expect(updated.isDefault).toBe(true)
  })

  it('archives and unarchives a default category', async () => {
    const archived = await updateCategory('food', { archived: true }, database)

    expect(archived.archived).toBe(true)
    expect(archived.isDefault).toBe(true)
    expect((await getCategories(database)).find((category) => category.id === 'food')?.archived).toBe(
      true,
    )

    const restored = await updateCategory('food', { archived: false }, database)

    expect(restored.archived).toBe(false)
  })

  it('never lets a default category become non-default', async () => {
    const updated = await updateCategory('hostel', { isDefault: false } as CategoryUpdate, database)

    expect(updated.isDefault).toBe(true)
    expect(updated.nameEn).toBe('Hostel Rent')
  })

  it('rejects an invalid rename and leaves the category unchanged', async () => {
    const before = await database.categories.get('food')

    const error = await expectValidationError(
      updateCategory('food', { nameEn: '   ' }, database),
    )

    expect(error.errors).toContainEqual({ field: 'nameEn', code: 'required' })
    expect(await database.categories.get('food')).toEqual(before)
  })

  it('throws a StorageError when updating a category that does not exist', async () => {
    await expectStorageError(updateCategory('missing-category', { archived: true }, database))
  })

  it('rejects an empty category id', async () => {
    const error = await expectValidationError(
      updateCategory('', { archived: true }, database),
    )

    expect(error.errors).toContainEqual({ field: 'id', code: 'required' })
  })
})

describe('cash checks', () => {
  it('saves a check with the computed difference', async () => {
    const created = await addCashCheck(
      { date: '2026-01-15', countedMinor: 50_000, expectedMinor: 45_000 },
      database,
    )

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
    expect(created).toMatchObject({
      date: '2026-01-15',
      countedMinor: 50_000,
      expectedMinor: 45_000,
      diffMinor: 5_000,
    })
    expect(created.createdAt).toEqual(expect.any(Number))
    expect(await database.cashChecks.get(created.id)).toEqual(created)
  })

  it('stores a negative difference when money is missing', async () => {
    const created = await addCashCheck(
      { date: '2026-01-15', countedMinor: 40_000, expectedMinor: 45_000 },
      database,
    )

    expect(created.diffMinor).toBe(-5_000)
  })

  it('rejects an invalid check and stores nothing', async () => {
    const error = await expectValidationError(
      addCashCheck(
        { date: '2026-13-01', countedMinor: 1.5, expectedMinor: 45_000 },
        database,
      ),
    )

    expect(error.errors).toContainEqual({ field: 'date', code: 'invalidDate' })
    expect(error.errors).toContainEqual({ field: 'countedMinor', code: 'invalidValue' })
    expect(await database.cashChecks.count()).toBe(0)
  })

  it('lists checks newest date first', async () => {
    const january = await addCashCheck(
      { date: '2026-01-10', countedMinor: 1_000, expectedMinor: 1_000 },
      database,
    )
    const february = await addCashCheck(
      { date: '2026-02-01', countedMinor: 1_000, expectedMinor: 1_000 },
      database,
    )
    const januaryLate = await addCashCheck(
      { date: '2026-01-31', countedMinor: 1_000, expectedMinor: 1_000 },
      database,
    )

    expect((await listCashChecks(database)).map((check) => check.id)).toEqual([
      february.id,
      januaryLate.id,
      january.id,
    ])
  })

  it('uses createdAt to order checks on the same day', async () => {
    const now = vi.spyOn(Date, 'now')

    now.mockReturnValue(1_000)
    const first = await addCashCheck(
      { date: '2026-01-10', countedMinor: 1_000, expectedMinor: 1_000 },
      database,
    )

    now.mockReturnValue(2_000)
    const second = await addCashCheck(
      { date: '2026-01-10', countedMinor: 2_000, expectedMinor: 1_000 },
      database,
    )

    expect((await listCashChecks(database)).map((check) => check.id)).toEqual([
      second.id,
      first.id,
    ])
  })

  it('returns an empty array when there are no checks', async () => {
    expect(await listCashChecks(database)).toEqual([])
  })
})

describe('settings', () => {
  it('returns undefined for an unset key', async () => {
    expect(await getSetting('language', database)).toBeUndefined()
  })

  it('stores and updates the language without adding a second row', async () => {
    await setSetting('language', 'bn', database)

    expect(await getSetting('language', database)).toBe('bn')

    await setSetting('language', 'en', database)

    expect(await getSetting('language', database)).toBe('en')
    expect(await database.settings.count()).toBe(1)
  })

  it('stores schemaVersion as a number', async () => {
    await setSetting('schemaVersion', 1, database)

    expect(await getSetting('schemaVersion', database)).toBe(1)
  })

  it('rejects an unknown language', async () => {
    const error = await expectValidationError(setSetting('language', 'fr', database))

    expect(error.errors).toContainEqual({ field: 'value', code: 'invalidValue' })
    expect(await getSetting('language', database)).toBeUndefined()
  })

  it('rejects an invalid schemaVersion', async () => {
    await expectValidationError(setSetting('schemaVersion', 0, database))
    await expectValidationError(setSetting('schemaVersion', 1.5, database))
    await expectValidationError(setSetting('schemaVersion', '1', database))

    expect(await database.settings.count()).toBe(0)
  })

  it('rejects an empty key', async () => {
    const error = await expectValidationError(setSetting('', 'bn', database))

    expect(error.errors).toContainEqual({ field: 'key', code: 'required' })
    expect(await database.settings.count()).toBe(0)
  })

  it('rejects an empty key when reading', async () => {
    const error = await expectValidationError(getSetting('', database))

    expect(error.errors).toContainEqual({ field: 'key', code: 'required' })
  })

  it('rejects a value that is not a string or number', async () => {
    const error = await expectValidationError(
      setSetting('language', true as unknown as string, database),
    )

    expect(error.errors).toContainEqual({ field: 'value', code: 'invalidType' })
    expect(await database.settings.count()).toBe(0)
  })
})
