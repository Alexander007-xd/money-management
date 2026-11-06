import Dexie, { type Table } from 'dexie'
import type { CashCheck, Category, Setting, Transaction } from './types'

export const DB_NAME = 'takakhata'
export const DB_VERSION = 1

export const DEFAULT_CATEGORIES: readonly Category[] = [
  {
    id: 'hostel',
    nameEn: 'Hostel Rent',
    nameBn: 'হোস্টেল ভাড়া',
    icon: 'home',
    isDefault: true,
    archived: false,
    sortOrder: 0,
  },
  {
    id: 'cook',
    nameEn: 'Cook',
    nameBn: 'রান্নার খালা',
    icon: 'user',
    isDefault: true,
    archived: false,
    sortOrder: 1,
  },
  {
    id: 'food',
    nameEn: 'Food',
    nameBn: 'খাবার',
    icon: 'utensils',
    isDefault: true,
    archived: false,
    sortOrder: 2,
  },
  {
    id: 'wifi',
    nameEn: 'Wifi',
    nameBn: 'ওয়াইফাই',
    icon: 'wifi',
    isDefault: true,
    archived: false,
    sortOrder: 3,
  },
  {
    id: 'electricity',
    nameEn: 'Electricity',
    nameBn: 'কারেন্ট বিল',
    icon: 'zap',
    isDefault: true,
    archived: false,
    sortOrder: 4,
  },
  {
    id: 'gas',
    nameEn: 'Gas',
    nameBn: 'গ্যাস বিল',
    icon: 'flame',
    isDefault: true,
    archived: false,
    sortOrder: 5,
  },
  {
    id: 'transport',
    nameEn: 'Transport',
    nameBn: 'যাতায়াত',
    icon: 'bus',
    isDefault: true,
    archived: false,
    sortOrder: 6,
  },
  {
    id: 'study',
    nameEn: 'Study',
    nameBn: 'পড়াশোনা',
    icon: 'book',
    isDefault: true,
    archived: false,
    sortOrder: 7,
  },
  {
    id: 'other',
    nameEn: 'Other',
    nameBn: 'অন্যান্য',
    icon: 'tag',
    isDefault: true,
    archived: false,
    sortOrder: 8,
  },
]

export class TakaKhataDatabase extends Dexie {
  transactions!: Table<Transaction, string>
  categories!: Table<Category, string>
  cashChecks!: Table<CashCheck, string>
  settings!: Table<Setting, string>

  constructor(name: string = DB_NAME) {
    super(name)

    this.version(DB_VERSION).stores({
      transactions: 'id, date, type, categoryId, [type+date]',
      categories: 'id, sortOrder',
      cashChecks: 'id, date',
      settings: 'key',
    })

    this.on('populate', (transaction) => {
      return transaction.table('categories').bulkAdd([...DEFAULT_CATEGORIES])
    })
  }
}

export const db = new TakaKhataDatabase()
