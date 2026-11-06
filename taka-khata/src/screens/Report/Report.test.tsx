import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  const monthName = en[`month.${Number(month)}` as TranslationKey]

  return `${monthName} ${year}`
}

async function openReport(): Promise<void> {
  await setSetting('language', 'en')
  window.location.hash = '#/report'
  render(<App />)
  await screen.findByRole('heading', { name: en['report.title'] })
}

function ledgerTitles(): string[] {
  return Array.from(document.querySelectorAll('.ledger-row__title')).map(
    (row) => row.textContent ?? '',
  )
}

describe('Report', () => {
  it('shows month totals and category bars for the current month', async () => {
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
      date: today(),
    })

    await openReport()

    expect(await screen.findByText(en['report.whereMoneyWent'])).toBeTruthy()
    expect(screen.getByText(monthLabel(monthKey(today())))).toBeTruthy()

    const summary = document.querySelector('.report-summary')

    expect(summary).toBeTruthy()
    expect(within(summary as HTMLElement).getByText(en['report.received'])).toBeTruthy()
    expect(within(summary as HTMLElement).getByText(en['report.spent'])).toBeTruthy()
    expect(within(summary as HTMLElement).getByText(en['report.left'])).toBeTruthy()
    expect(
      await within(summary as HTMLElement).findByText('৳500.00'),
    ).toBeTruthy()
    expect(within(summary as HTMLElement).getByText('৳150.50')).toBeTruthy()
    expect(within(summary as HTMLElement).getByText('৳349.50')).toBeTruthy()

    expect(screen.getByText('Food')).toBeTruthy()
    expect(screen.getByText('Transport')).toBeTruthy()
    expect(screen.getByText('80%')).toBeTruthy()
    expect(screen.getByText('20%')).toBeTruthy()
  })

  it('switches to the previous month', async () => {
    const previous = shiftMonth(monthKey(today()), -1)

    await addTransaction({
      type: 'expense',
      amountMinor: 100_000,
      categoryId: 'food',
      date: `${previous}-05`,
    })

    await openReport()

    expect(await screen.findByText(en['report.empty'])).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', { name: en['report.previousMonth'] }),
    )

    expect(await screen.findByText('100%')).toBeTruthy()
    expect(screen.getByText(monthLabel(previous))).toBeTruthy()
    expect(screen.queryByText(en['report.empty'])).toBeNull()
    expect(screen.getAllByText('৳1,000.00').length).toBeGreaterThan(0)
  })

  it('opens History filtered to the tapped category and month', async () => {
    const month = monthKey(today())

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

    await openReport()

    fireEvent.click(await screen.findByRole('button', { name: /Food/ }))

    expect(window.location.hash).toBe(
      `#/history?month=${month}&type=expense&category=food`,
    )

    expect(
      await screen.findByRole('heading', { name: en['history.title'] }),
    ).toBeTruthy()
    await waitFor(() => {
      expect(ledgerTitles()).toEqual(['Food'])
    })
  })

  it('shows the empty state when nothing was spent this month', async () => {
    await addTransaction({
      type: 'income',
      amountMinor: 50_000,
      source: 'Rahim',
      date: today(),
    })

    await openReport()

    expect(await screen.findByText(en['report.empty'])).toBeTruthy()
    expect(screen.queryByText(en['report.whereMoneyWent'])).toBeTruthy()
  })

  it('opens CashCheck from the bottom link', async () => {
    await openReport()

    fireEvent.click(
      await screen.findByRole('link', { name: en['report.checkMoney'] }),
    )

    expect(window.location.hash).toBe('#/check')
  })
})
