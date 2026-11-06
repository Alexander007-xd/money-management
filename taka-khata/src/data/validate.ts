import { isFuture } from '../lib/dates'
import { toMinor } from '../lib/money'
import {
  BACKUP_APP,
  CATEGORY_ICONS,
  type BackupData,
  type CashCheck,
  type Category,
  type CategoryIcon,
  type Setting,
  type Transaction,
  type TransactionType,
} from './types'

export const MAX_AMOUNT_MINOR = 999_999_999
export const NOTE_MAX_LENGTH = 140

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export type ValidationErrorCode =
  | 'required'
  | 'invalidType'
  | 'invalidValue'
  | 'outOfRange'
  | 'invalidDate'
  | 'futureDate'
  | 'amountRequired'
  | 'amountInvalid'
  | 'amountNotPositive'
  | 'amountTooLarge'
  | 'categoryRequired'
  | 'noteTooLong'

export interface ValidationError {
  field: string
  code: ValidationErrorCode
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidDateString(value: string): boolean {
  const match = DATE_PATTERN.exec(value)

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function validateRecordId(errors: ValidationError[], value: unknown): void {
  if (value === undefined) {
    errors.push({ field: 'id', code: 'required' })
  } else if (typeof value !== 'string') {
    errors.push({ field: 'id', code: 'invalidType' })
  } else if (value.trim() === '') {
    errors.push({ field: 'id', code: 'required' })
  }
}

function validateName(errors: ValidationError[], field: string, value: unknown): void {
  if (value === undefined) {
    errors.push({ field, code: 'required' })
  } else if (typeof value !== 'string') {
    errors.push({ field, code: 'invalidType' })
  } else if (value.trim() === '') {
    errors.push({ field, code: 'required' })
  }
}

function validateAmountMinor(errors: ValidationError[], value: unknown): void {
  if (value === undefined) {
    errors.push({ field: 'amountMinor', code: 'required' })
  } else if (typeof value !== 'number') {
    errors.push({ field: 'amountMinor', code: 'invalidType' })
  } else if (!Number.isInteger(value)) {
    errors.push({ field: 'amountMinor', code: 'invalidValue' })
  } else if (value <= 0) {
    errors.push({ field: 'amountMinor', code: 'amountNotPositive' })
  } else if (value > MAX_AMOUNT_MINOR) {
    errors.push({ field: 'amountMinor', code: 'amountTooLarge' })
  }
}

function validateInteger(errors: ValidationError[], field: string, value: unknown): void {
  if (value === undefined) {
    errors.push({ field, code: 'required' })
  } else if (typeof value !== 'number') {
    errors.push({ field, code: 'invalidType' })
  } else if (!Number.isInteger(value)) {
    errors.push({ field, code: 'invalidValue' })
  }
}

function validateTimestamp(errors: ValidationError[], field: string, value: unknown): void {
  if (value === undefined) {
    errors.push({ field, code: 'required' })
  } else if (typeof value !== 'number') {
    errors.push({ field, code: 'invalidType' })
  } else if (!Number.isInteger(value)) {
    errors.push({ field, code: 'invalidValue' })
  } else if (value < 0) {
    errors.push({ field, code: 'outOfRange' })
  }
}

function validateBoolean(errors: ValidationError[], field: string, value: unknown): void {
  if (value === undefined) {
    errors.push({ field, code: 'required' })
  } else if (typeof value !== 'boolean') {
    errors.push({ field, code: 'invalidType' })
  }
}

function validateDate(
  errors: ValidationError[],
  value: unknown,
  options: { allowFuture: boolean },
): void {
  if (value === undefined) {
    errors.push({ field: 'date', code: 'required' })
  } else if (typeof value !== 'string') {
    errors.push({ field: 'date', code: 'invalidType' })
  } else if (!isValidDateString(value)) {
    errors.push({ field: 'date', code: 'invalidDate' })
  } else if (!options.allowFuture && isFuture(value)) {
    errors.push({ field: 'date', code: 'futureDate' })
  }
}

export function validateAmountInput(raw: string): ValidationResult<number> {
  if (raw.trim() === '') {
    return { ok: false, errors: [{ field: 'amount', code: 'amountRequired' }] }
  }

  const minor = toMinor(raw)

  if (minor === null) {
    return { ok: false, errors: [{ field: 'amount', code: 'amountInvalid' }] }
  }

  if (minor <= 0) {
    return { ok: false, errors: [{ field: 'amount', code: 'amountNotPositive' }] }
  }

  if (minor > MAX_AMOUNT_MINOR) {
    return { ok: false, errors: [{ field: 'amount', code: 'amountTooLarge' }] }
  }

  return { ok: true, value: minor }
}

export function validateTransaction(input: unknown): ValidationResult<Transaction> {
  if (!isRecord(input)) {
    return { ok: false, errors: [{ field: 'record', code: 'invalidType' }] }
  }

  const errors: ValidationError[] = []
  const type = input.type
  const isIncome = type === 'income'
  const isExpense = type === 'expense'

  validateRecordId(errors, input.id)

  if (type === undefined) {
    errors.push({ field: 'type', code: 'required' })
  } else if (!isIncome && !isExpense) {
    errors.push({ field: 'type', code: 'invalidValue' })
  }

  validateAmountMinor(errors, input.amountMinor)

  const categoryId = input.categoryId

  if (isExpense) {
    if (categoryId === undefined || categoryId === null) {
      errors.push({ field: 'categoryId', code: 'categoryRequired' })
    } else if (typeof categoryId !== 'string') {
      errors.push({ field: 'categoryId', code: 'invalidType' })
    } else if (categoryId.trim() === '') {
      errors.push({ field: 'categoryId', code: 'categoryRequired' })
    }
  } else if (isIncome && categoryId !== null) {
    errors.push({ field: 'categoryId', code: 'invalidValue' })
  }

  const source = input.source === undefined ? null : input.source

  if (source !== null && typeof source !== 'string') {
    errors.push({ field: 'source', code: 'invalidType' })
  } else if (isExpense && source !== null) {
    errors.push({ field: 'source', code: 'invalidValue' })
  }

  const note = input.note === undefined ? '' : input.note

  if (typeof note !== 'string') {
    errors.push({ field: 'note', code: 'invalidType' })
  } else if ([...note].length > NOTE_MAX_LENGTH) {
    errors.push({ field: 'note', code: 'noteTooLong' })
  }

  validateDate(errors, input.date, { allowFuture: false })
  validateTimestamp(errors, 'createdAt', input.createdAt)
  validateTimestamp(errors, 'updatedAt', input.updatedAt)

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      id: input.id as string,
      type: type as TransactionType,
      amountMinor: input.amountMinor as number,
      categoryId: categoryId as string | null,
      source: source as string | null,
      note: note as string,
      date: input.date as string,
      createdAt: input.createdAt as number,
      updatedAt: input.updatedAt as number,
    },
  }
}

export function validateCategory(input: unknown): ValidationResult<Category> {
  if (!isRecord(input)) {
    return { ok: false, errors: [{ field: 'record', code: 'invalidType' }] }
  }

  const errors: ValidationError[] = []

  validateRecordId(errors, input.id)
  validateName(errors, 'nameEn', input.nameEn)
  validateName(errors, 'nameBn', input.nameBn)

  const icon = input.icon

  if (icon === undefined) {
    errors.push({ field: 'icon', code: 'required' })
  } else if (typeof icon !== 'string' || !CATEGORY_ICONS.includes(icon as CategoryIcon)) {
    errors.push({ field: 'icon', code: 'invalidValue' })
  }

  validateBoolean(errors, 'isDefault', input.isDefault)
  validateBoolean(errors, 'archived', input.archived)
  validateInteger(errors, 'sortOrder', input.sortOrder)

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      id: input.id as string,
      nameEn: input.nameEn as string,
      nameBn: input.nameBn as string,
      icon: icon as CategoryIcon,
      isDefault: input.isDefault as boolean,
      archived: input.archived as boolean,
      sortOrder: input.sortOrder as number,
    },
  }
}

export function validateCashCheck(input: unknown): ValidationResult<CashCheck> {
  if (!isRecord(input)) {
    return { ok: false, errors: [{ field: 'record', code: 'invalidType' }] }
  }

  const errors: ValidationError[] = []

  validateRecordId(errors, input.id)
  validateDate(errors, input.date, { allowFuture: true })
  validateInteger(errors, 'countedMinor', input.countedMinor)
  validateInteger(errors, 'expectedMinor', input.expectedMinor)
  validateInteger(errors, 'diffMinor', input.diffMinor)
  validateTimestamp(errors, 'createdAt', input.createdAt)

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      id: input.id as string,
      date: input.date as string,
      countedMinor: input.countedMinor as number,
      expectedMinor: input.expectedMinor as number,
      diffMinor: input.diffMinor as number,
      createdAt: input.createdAt as number,
    },
  }
}

export function validateSetting(input: unknown): ValidationResult<Setting> {
  if (!isRecord(input)) {
    return { ok: false, errors: [{ field: 'record', code: 'invalidType' }] }
  }

  const errors: ValidationError[] = []
  const key = input.key
  const value = input.value

  validateName(errors, 'key', key)

  if (value === undefined) {
    errors.push({ field: 'value', code: 'required' })
  } else if (typeof value !== 'string' && typeof value !== 'number') {
    errors.push({ field: 'value', code: 'invalidType' })
  } else if (key === 'language' && value !== 'bn' && value !== 'en') {
    errors.push({ field: 'value', code: 'invalidValue' })
  } else if (
    key === 'schemaVersion' &&
    (typeof value !== 'number' || !Number.isInteger(value) || value < 1)
  ) {
    errors.push({ field: 'value', code: 'invalidValue' })
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      key: key as string,
      value: value as string | number,
    },
  }
}

function validateArray<T>(
  errors: ValidationError[],
  field: string,
  value: unknown,
  validateItem: (item: unknown) => ValidationResult<T>,
): T[] {
  if (value === undefined) {
    errors.push({ field, code: 'required' })
    return []
  }

  if (!Array.isArray(value)) {
    errors.push({ field, code: 'invalidType' })
    return []
  }

  const items: T[] = []

  value.forEach((item, index) => {
    const result = validateItem(item)

    if (result.ok) {
      items.push(result.value)
    } else {
      for (const error of result.errors) {
        errors.push({
          field: `${field}[${index}].${error.field}`,
          code: error.code,
        })
      }
    }
  })

  return items
}

export function validateBackup(
  input: unknown,
  currentSchemaVersion: number,
): ValidationResult<BackupData> {
  if (!isRecord(input)) {
    return { ok: false, errors: [{ field: 'record', code: 'invalidType' }] }
  }

  const errors: ValidationError[] = []
  const app = input.app
  const schemaVersion = input.schemaVersion

  if (app === undefined) {
    errors.push({ field: 'app', code: 'required' })
  } else if (app !== BACKUP_APP) {
    errors.push({ field: 'app', code: 'invalidValue' })
  }

  if (schemaVersion === undefined) {
    errors.push({ field: 'schemaVersion', code: 'required' })
  } else if (
    typeof schemaVersion !== 'number' ||
    !Number.isInteger(schemaVersion) ||
    schemaVersion < 1
  ) {
    errors.push({ field: 'schemaVersion', code: 'invalidValue' })
  } else if (schemaVersion > currentSchemaVersion) {
    errors.push({ field: 'schemaVersion', code: 'outOfRange' })
  }

  validateTimestamp(errors, 'exportedAt', input.exportedAt)

  const transactions = validateArray(
    errors,
    'transactions',
    input.transactions,
    validateTransaction,
  )
  const categories = validateArray(errors, 'categories', input.categories, validateCategory)
  const cashChecks = validateArray(errors, 'cashChecks', input.cashChecks, validateCashCheck)
  const settings = validateArray(errors, 'settings', input.settings, validateSetting)

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      app: BACKUP_APP,
      schemaVersion: schemaVersion as number,
      exportedAt: input.exportedAt as number,
      transactions,
      categories,
      cashChecks,
      settings,
    },
  }
}
