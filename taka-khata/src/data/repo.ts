import type { Collection, IndexableType } from 'dexie'
import { diffForCheck } from './calc'
import { DB_VERSION, db, type TakaKhataDatabase } from './db'
import {
  BACKUP_APP,
  type BackupData,
  type CashCheck,
  type Category,
  type CategoryIcon,
  type Transaction,
  type TransactionType,
} from './types'
import type { ValidationError as FieldValidationError } from './validate'
import {
  validateBackup,
  validateCashCheck,
  validateCategory,
  validateSetting,
  validateTransaction,
} from './validate'

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

export interface TransactionInput {
  type: TransactionType
  amountMinor: number
  categoryId?: string | null
  source?: string | null
  note?: string
  date: string
}

export interface TransactionFilter {
  month?: string
  type?: TransactionType
  categoryId?: string
}

export interface CategoryInput {
  nameEn: string
  nameBn: string
  icon: CategoryIcon
}

export interface CategoryUpdate {
  nameEn?: string
  nameBn?: string
  icon?: CategoryIcon
  archived?: boolean
}

export interface CashCheckInput {
  date: string
  countedMinor: number
  expectedMinor: number
}

export class ValidationError extends Error {
  readonly errors: FieldValidationError[]

  constructor(errors: FieldValidationError[]) {
    super('Invalid data')
    this.name = 'ValidationError'
    this.errors = errors
  }
}

export class StorageError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause })
    this.name = 'StorageError'
  }
}

function createId(): string {
  return crypto.randomUUID()
}

function assertValidId(id: string): void {
  if (typeof id !== 'string') {
    throw new ValidationError([{ field: 'id', code: 'invalidType' }])
  }

  if (id.trim() === '') {
    throw new ValidationError([{ field: 'id', code: 'required' }])
  }
}

function toRecord(
  input: TransactionInput,
  id: string,
  createdAt: number,
  updatedAt: number,
): Transaction {
  return {
    id,
    type: input.type,
    amountMinor: input.amountMinor,
    categoryId: input.categoryId ?? null,
    source: input.source ?? null,
    note: input.note ?? '',
    date: input.date,
    createdAt,
    updatedAt,
  }
}

function validatedRecord(record: Transaction): Transaction {
  const result = validateTransaction(record)

  if (!result.ok) {
    throw new ValidationError(result.errors)
  }

  return result.value
}

function validatedCategory(record: Category): Category {
  const result = validateCategory(record)

  if (!result.ok) {
    throw new ValidationError(result.errors)
  }

  return result.value
}

function validatedCashCheck(record: CashCheck): CashCheck {
  const result = validateCashCheck(record)

  if (!result.ok) {
    throw new ValidationError(result.errors)
  }

  return result.value
}

function assertValidSettingKey(key: string): void {
  if (typeof key !== 'string') {
    throw new ValidationError([{ field: 'key', code: 'invalidType' }])
  }

  if (key.trim() === '') {
    throw new ValidationError([{ field: 'key', code: 'required' }])
  }
}

async function runStorage<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw new StorageError('Storage operation failed', error)
  }
}

function validateFilter(filter: TransactionFilter): void {
  const errors: FieldValidationError[] = []

  if (filter.month !== undefined) {
    if (typeof filter.month !== 'string') {
      errors.push({ field: 'month', code: 'invalidType' })
    } else if (!MONTH_PATTERN.test(filter.month)) {
      errors.push({ field: 'month', code: 'invalidValue' })
    }
  }

  if (filter.type !== undefined && filter.type !== 'income' && filter.type !== 'expense') {
    errors.push({ field: 'type', code: 'invalidValue' })
  }

  if (filter.categoryId !== undefined) {
    if (typeof filter.categoryId !== 'string') {
      errors.push({ field: 'categoryId', code: 'invalidType' })
    } else if (filter.categoryId.trim() === '') {
      errors.push({ field: 'categoryId', code: 'invalidValue' })
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors)
  }
}

function queryTransactions(
  database: TakaKhataDatabase,
  filter: TransactionFilter,
): Collection<Transaction, IndexableType> {
  const { month, type, categoryId } = filter

  if (month !== undefined && type !== undefined) {
    return database.transactions
      .where('[type+date]')
      .between([type, `${month}-00`], [type, `${month}-99`], true, true)
  }

  if (month !== undefined) {
    return database.transactions.where('date').startsWith(`${month}-`)
  }

  if (type !== undefined) {
    return database.transactions.where('type').equals(type)
  }

  if (categoryId !== undefined) {
    return database.transactions.where('categoryId').equals(categoryId)
  }

  return database.transactions.toCollection()
}

function matchesFilter(filter: TransactionFilter): (transaction: Transaction) => boolean {
  return (transaction) => {
    if (filter.month !== undefined && !transaction.date.startsWith(`${filter.month}-`)) {
      return false
    }

    if (filter.type !== undefined && transaction.type !== filter.type) {
      return false
    }

    if (filter.categoryId !== undefined && transaction.categoryId !== filter.categoryId) {
      return false
    }

    return true
  }
}

function newestFirst(first: Transaction, second: Transaction): number {
  if (first.date !== second.date) {
    return first.date < second.date ? 1 : -1
  }

  if (first.createdAt !== second.createdAt) {
    return second.createdAt - first.createdAt
  }

  return first.id.localeCompare(second.id)
}

export async function addTransaction(
  input: TransactionInput,
  database: TakaKhataDatabase = db,
): Promise<Transaction> {
  const now = Date.now()
  const record = validatedRecord(toRecord(input, createId(), now, now))

  await runStorage(() => database.transactions.add(record))

  return record
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
  database: TakaKhataDatabase = db,
): Promise<Transaction> {
  assertValidId(id)

  const existing = await runStorage(() => database.transactions.get(id))

  if (existing === undefined) {
    throw new StorageError(`Transaction ${id} was not found`)
  }

  const record = validatedRecord(toRecord(input, id, existing.createdAt, Date.now()))

  await runStorage(() => database.transactions.put(record))

  return record
}

export async function deleteTransaction(
  id: string,
  database: TakaKhataDatabase = db,
): Promise<void> {
  assertValidId(id)

  await runStorage(() => database.transactions.delete(id))
}

export async function restoreTransaction(
  transaction: Transaction,
  database: TakaKhataDatabase = db,
): Promise<Transaction> {
  const record = validatedRecord(transaction)

  await runStorage(() => database.transactions.add(record))

  return record
}

export async function listTransactions(
  filter: TransactionFilter = {},
  database: TakaKhataDatabase = db,
): Promise<Transaction[]> {
  validateFilter(filter)

  const rows = await runStorage(() =>
    queryTransactions(database, filter).filter(matchesFilter(filter)).toArray(),
  )

  return rows.sort(newestFirst)
}

export async function getCategories(database: TakaKhataDatabase = db): Promise<Category[]> {
  const categories = await runStorage(() => database.categories.toArray())

  return categories.sort(
    (first, second) => first.sortOrder - second.sortOrder || first.id.localeCompare(second.id),
  )
}

export async function addCategory(
  input: CategoryInput,
  database: TakaKhataDatabase = db,
): Promise<Category> {
  const existing = await runStorage(() => database.categories.toArray())
  const sortOrder =
    existing.reduce((highest, category) => Math.max(highest, category.sortOrder), -1) + 1

  const record = validatedCategory({
    id: createId(),
    nameEn: input.nameEn,
    nameBn: input.nameBn,
    icon: input.icon,
    isDefault: false,
    archived: false,
    sortOrder,
  })

  await runStorage(() => database.categories.add(record))

  return record
}

export async function updateCategory(
  id: string,
  changes: CategoryUpdate,
  database: TakaKhataDatabase = db,
): Promise<Category> {
  assertValidId(id)

  const existing = await runStorage(() => database.categories.get(id))

  if (existing === undefined) {
    throw new StorageError(`Category ${id} was not found`)
  }

  const record = validatedCategory({
    id: existing.id,
    nameEn: changes.nameEn === undefined ? existing.nameEn : changes.nameEn,
    nameBn: changes.nameBn === undefined ? existing.nameBn : changes.nameBn,
    icon: changes.icon === undefined ? existing.icon : changes.icon,
    isDefault: existing.isDefault,
    archived: changes.archived === undefined ? existing.archived : changes.archived,
    sortOrder: existing.sortOrder,
  })

  await runStorage(() => database.categories.put(record))

  return record
}

export async function addCashCheck(
  input: CashCheckInput,
  database: TakaKhataDatabase = db,
): Promise<CashCheck> {
  const record = validatedCashCheck({
    id: createId(),
    date: input.date,
    countedMinor: input.countedMinor,
    expectedMinor: input.expectedMinor,
    diffMinor: diffForCheck(input.countedMinor, input.expectedMinor),
    createdAt: Date.now(),
  })

  await runStorage(() => database.cashChecks.add(record))

  return record
}

function newestCheckFirst(first: CashCheck, second: CashCheck): number {
  if (first.date !== second.date) {
    return first.date < second.date ? 1 : -1
  }

  if (first.createdAt !== second.createdAt) {
    return second.createdAt - first.createdAt
  }

  return first.id.localeCompare(second.id)
}

export async function listCashChecks(database: TakaKhataDatabase = db): Promise<CashCheck[]> {
  const checks = await runStorage(() => database.cashChecks.toArray())

  return checks.sort(newestCheckFirst)
}

export async function getSetting(
  key: string,
  database: TakaKhataDatabase = db,
): Promise<string | number | undefined> {
  assertValidSettingKey(key)

  const setting = await runStorage(() => database.settings.get(key))

  return setting?.value
}

export async function setSetting(
  key: string,
  value: string | number,
  database: TakaKhataDatabase = db,
): Promise<void> {
  const result = validateSetting({ key, value })

  if (!result.ok) {
    throw new ValidationError(result.errors)
  }

  await runStorage(() => database.settings.put(result.value))
}

export async function exportAll(database: TakaKhataDatabase = db): Promise<BackupData> {
  const [transactions, categories, cashChecks, settings] = await runStorage(() =>
    Promise.all([
      database.transactions.toArray(),
      database.categories.toArray(),
      database.cashChecks.toArray(),
      database.settings.toArray(),
    ]),
  )

  return {
    app: BACKUP_APP,
    schemaVersion: DB_VERSION,
    exportedAt: Date.now(),
    transactions,
    categories,
    cashChecks,
    settings,
  }
}

export async function importAll(
  input: unknown,
  database: TakaKhataDatabase = db,
): Promise<void> {
  const result = validateBackup(input, DB_VERSION)

  if (!result.ok) {
    throw new ValidationError(result.errors)
  }

  const backup = result.value

  try {
    await database.transaction(
      'rw',
      [database.transactions, database.categories, database.cashChecks, database.settings],
      async () => {
        await database.transactions.clear()
        await database.categories.clear()
        await database.cashChecks.clear()
        await database.settings.clear()

        await database.transactions.bulkAdd(backup.transactions)
        await database.categories.bulkAdd(backup.categories)
        await database.cashChecks.bulkAdd(backup.cashChecks)
        await database.settings.bulkAdd(backup.settings)
      },
    )
  } catch (error) {
    throw new StorageError('Import failed', error)
  }
}
