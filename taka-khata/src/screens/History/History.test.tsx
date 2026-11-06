import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../app/App'
import { db } from '../../data/db'
import { addTransaction, setSetting } from '../../data/repo'
import { en } from '../../i18n/en'
import type { TranslationKey } from '../../i18n/bn'
import { monthKey, shiftMonth, today } from '../../lib/dates'

beforeEach(async () => {
  await db.transactions.clear()
  await db.settings.clear()
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
})

function dayBefore(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  const monthName = en[`month.${Number(month)}` as TranslationKey]

  return `${monthName} ${year}`
}

async function openHistory(): Promise<void> {
  await setSetting('language', 'en')
  window.location.hash = '#/history'
  render(<App />)
  await screen.findByRole('heading', { name: en['history.title'] })
}

function ledgerTitles(): string[] {
  return Array.from(document.querySelectorAll('.ledger-row__title')).map(
    (row) => row.textContent ?? '',
  )
}

describe('History', () => {
  it('groups entries by day with day totals and shows the month', async () => {
    await addTransaction({
      type: 'income',
      amountMinor: 50_000,
      source: 'Rahim',
      date: today(),
    })
    await addTransaction({
      type: 'expense',
      amountMinor: 12_050,
      categoryId: 'food',
      date: today(),
    })
    await addTransaction({
      type: 'expense',
      amountMinor: 3_000,
      categoryId: 'transport',
      date: dayBefore(1),
    })

    await openHistory()

    expect(await screen.findByText('Rahim')).toBeTruthy()
    expect(screen.getByText(monthLabel(monthKey(today())))).toBeTruthy()
    expect(screen.getByText('Today')).toBeTruthy()
    expect(screen.getByText('Yesterday')).toBeTruthy()
    expect(screen.getByText('Food')).toBeTruthy()
    expect(screen.getByText('Transport')).toBeTruthy()
    expect(screen.getByText('+৳379.50')).toBeTruthy()
    expect(screen.getAllByText('-৳30.00').length).toBeGreaterThan(0)
  })

  it('switches to the previous month', async () => {
    const previous = shiftMonth(monthKey(today()), -1)

    await addTransaction({
      type: 'income',
      amountMinor: 25_000,
      source: 'Old entry',
      date: `${previous}-15`,
    })

    await openHistory()

    expect(await screen.findByText(en['history.empty'])).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', { name: en['history.previousMonth'] }),
    )

    expect(await screen.findByText('Old entry')).toBeTruthy()
    expect(screen.getByText(monthLabel(previous))).toBeTruthy()
    expect(screen.queryByText(en['history.empty'])).toBeNull()
  })

  it('filters by received and spent', async () => {
    await addTransaction({
      type: 'income',
      amountMinor: 50_000,
      source: 'Rahim',
      date: today(),
    })
    await addTransaction({
      type: 'expense',
      amountMinor: 12_050,
      categoryId: 'food',
      date: today(),
    })

    await openHistory()

    expect(await screen.findByText('Rahim')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: en['history.received'] }))

    expect(await screen.findByText('Rahim')).toBeTruthy()
    expect(ledgerTitles()).toEqual(['Rahim'])

    fireEvent.click(screen.getByRole('button', { name: en['history.spent'] }))

    expect(ledgerTitles()).toEqual(['Food'])
  })

  it('filters spent entries by category', async () => {
    await addTransaction({
      type: 'expense',
      amountMinor: 12_050,
      categoryId: 'food',
      date: today(),
    })
    await addTransaction({
      type: 'expense',
      amountMinor: 3_000,
      categoryId: 'transport',
      date: today(),
    })

    await openHistory()

    expect(await screen.findByText('Food')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: en['history.spent'] }))

    expect(ledgerTitles().sort()).toEqual(['Food', 'Transport'])

    fireEvent.click(screen.getByRole('button', { name: 'Food' }))

    expect(ledgerTitles()).toEqual(['Food'])

    fireEvent.click(
      screen.getByRole('button', { name: en['history.allCategories'] }),
    )

    expect(ledgerTitles().sort()).toEqual(['Food', 'Transport'])
  })

  it('shows the empty state when the month has no entries', async () => {
    await openHistory()

    expect(await screen.findByText(en['history.empty'])).toBeTruthy()
  })

  it('opens the edit screen from a row', async () => {
    const saved = await addTransaction({
      type: 'expense',
      amountMinor: 12_050,
      categoryId: 'food',
      date: today(),
    })

    await openHistory()

    fireEvent.click(await screen.findByRole('button', { name: /Food/ }))

    expect(window.location.hash).toBe(`#/edit/${saved.id}`)
  })
})
