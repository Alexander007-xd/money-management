import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_CATEGORIES, TakaKhataDatabase } from './db'

const TEST_DB_NAME = 'takakhata-test'
const openedDatabases: TakaKhataDatabase[] = []

function createDatabase(): TakaKhataDatabase {
  const database = new TakaKhataDatabase(TEST_DB_NAME)
  openedDatabases.push(database)

  return database
}

afterEach(async () => {
  for (const database of openedDatabases) {
    database.close()
  }

  openedDatabases.length = 0
  await Dexie.delete(TEST_DB_NAME)
})

describe('TakaKhataDatabase', () => {
  it('seeds the nine default categories when the database is created', async () => {
    const database = createDatabase()
    await database.open()

    const categories = await database.categories.toArray()

    expect(categories).toHaveLength(9)
    expect(categories.map((category) => category.id).sort()).toEqual(
      DEFAULT_CATEGORIES.map((category) => category.id).sort(),
    )
  })

  it('seeds the categories with the fields from Schema.md', async () => {
    const database = createDatabase()
    await database.open()

    const categories = await database.categories.orderBy('sortOrder').toArray()

    expect(categories[0]).toEqual({
      id: 'hostel',
      nameEn: 'Hostel Rent',
      nameBn: 'হোস্টেল ভাড়া',
      icon: 'home',
      isDefault: true,
      archived: false,
      sortOrder: 0,
    })
    expect(categories.map((category) => category.sortOrder)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(categories.every((category) => category.isDefault)).toBe(true)
    expect(categories.every((category) => category.archived)).toBe(false)
  })

  it('does not duplicate categories when the same database is reopened', async () => {
    const database = createDatabase()
    await database.open()
    database.close()

    await database.open()

    expect(await database.categories.count()).toBe(9)
  })

  it('does not duplicate categories when a second instance opens the same database', async () => {
    const first = createDatabase()
    await first.open()
    const idsBefore = (await first.categories.toArray()).map((category) => category.id).sort()
    first.close()

    const second = createDatabase()
    await second.open()
    const idsAfter = (await second.categories.toArray()).map((category) => category.id).sort()

    expect(idsAfter).toEqual(idsBefore)
    expect(new Set(idsAfter).size).toBe(9)
  })

  it('starts with empty transactions, cash checks and settings', async () => {
    const database = createDatabase()
    await database.open()

    expect(await database.transactions.count()).toBe(0)
    expect(await database.cashChecks.count()).toBe(0)
    expect(await database.settings.count()).toBe(0)
  })
})
