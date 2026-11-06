import { monthKey } from '../lib/dates'
import type { Transaction } from './types'

export interface MonthTotals {
  incomeMinor: number
  expenseMinor: number
  leftMinor: number
}

export interface CategoryExpense {
  categoryId: string
  totalMinor: number
  percent: number
}

export function balance(transactions: Transaction[]): number {
  let total = 0

  for (const transaction of transactions) {
    total += transaction.type === 'income' ? transaction.amountMinor : -transaction.amountMinor
  }

  return total
}

export function monthTotals(transactions: Transaction[], key: string): MonthTotals {
  let incomeMinor = 0
  let expenseMinor = 0

  for (const transaction of transactions) {
    if (monthKey(transaction.date) !== key) {
      continue
    }

    if (transaction.type === 'income') {
      incomeMinor += transaction.amountMinor
    } else {
      expenseMinor += transaction.amountMinor
    }
  }

  return {
    incomeMinor,
    expenseMinor,
    leftMinor: incomeMinor - expenseMinor,
  }
}

export function expenseByCategory(transactions: Transaction[], key: string): CategoryExpense[] {
  const totals = new Map<string, number>()
  let spentMinor = 0

  for (const transaction of transactions) {
    if (
      transaction.type !== 'expense' ||
      transaction.categoryId === null ||
      monthKey(transaction.date) !== key
    ) {
      continue
    }

    totals.set(
      transaction.categoryId,
      (totals.get(transaction.categoryId) ?? 0) + transaction.amountMinor,
    )
    spentMinor += transaction.amountMinor
  }

  if (spentMinor === 0) {
    return []
  }

  return [...totals.entries()]
    .map(([categoryId, totalMinor]) => ({
      categoryId,
      totalMinor,
      percent: Math.round((totalMinor * 100) / spentMinor),
    }))
    .sort((a, b) => b.totalMinor - a.totalMinor)
}

export function diffForCheck(countedMinor: number, expectedMinor: number): number {
  return countedMinor - expectedMinor
}
