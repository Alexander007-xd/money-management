export const CATEGORY_ICONS = [
  'home',
  'user',
  'utensils',
  'wifi',
  'zap',
  'flame',
  'bus',
  'book',
  'tag',
  'shopping-bag',
  'heart',
  'phone',
] as const

export type CategoryIcon = (typeof CATEGORY_ICONS)[number]

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  amountMinor: number
  categoryId: string | null
  source: string | null
  note: string
  date: string
  createdAt: number
  updatedAt: number
}

export interface Category {
  id: string
  nameEn: string
  nameBn: string
  icon: CategoryIcon
  isDefault: boolean
  archived: boolean
  sortOrder: number
}

export interface CashCheck {
  id: string
  date: string
  countedMinor: number
  expectedMinor: number
  diffMinor: number
  createdAt: number
}

export interface Setting {
  key: string
  value: string | number
}

export const BACKUP_APP = 'taka-khata'

export interface BackupData {
  app: typeof BACKUP_APP
  schemaVersion: number
  exportedAt: number
  transactions: Transaction[]
  categories: Category[]
  cashChecks: CashCheck[]
  settings: Setting[]
}
