import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../app/App'
import { db } from '../../data/db'
import {
  addCashCheck,
  addTransaction,
  listCashChecks,
  setSetting,
} from '../../data/repo'
import { en } from '../../i18n/en'
import { today } from '../../lib/dates'

beforeEach(async () => {
  await db.transactions.clear()
  await db.cashChecks.clear()
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

function message(key: keyof typeof en, amount: string): string {
  return en[key].replace('{amount}', amount)
}

async function openCheck(): Promise<void> {
  await setSetting('language', 'en')
  window.location.hash = '#/check'
  render(<App />)
  await screen.findByRole('heading', { name: en['check.title'] })
}

async function typeReal(amount: string): Promise<void> {
  fireEvent.change(await screen.findByLabelText(en['check.realLabel']), {
    target: { value: amount },
  })
  fireEvent.click(screen.getByRole('button', { name: en['check.button'] }))
}

describe('CashCheck', () => {
  it('shows a match when the counted money equals the balance', async () => {
    await addTransaction({
      type: 'income',
      amountMinor: 50_000,
      source: 'Rahim',
      date: today(),
    })

    await openCheck()

    expect(
      await screen.findByText(message('check.shouldBeLeft', '৳500.00')),
    ).toBeTruthy()

    await typeReal('500')

    await waitFor(() => {
      expect(document.querySelector('.check-result')).toBeTruthy()
    })

    const resultBlock = document.querySelector('.check-result') as HTMLElement

    expect(within(resultBlock).getByText(en['check.matches'])).toBeTruthy()
    expect(within(resultBlock).getByText(en['check.matchesHint'])).toBeTruthy()

    const checks = await listCashChecks()

    expect(checks).toHaveLength(1)
    expect(checks[0]).toMatchObject({
      date: today(),
      countedMinor: 50_000,
      expectedMinor: 50_000,
      diffMinor: 0,
    })

    fireEvent.click(screen.getByRole('button', { name: en['check.again'] }))

    expect(document.querySelector('.check-result')).toBeNull()
    expect(
      (screen.getByLabelText(en['check.realLabel']) as HTMLInputElement).value,
    ).toBe('')
  })

  it('shows less and opens a prefilled expense form', async () => {
    await addTransaction({
      type: 'income',
      amountMinor: 50_000,
      source: 'Rahim',
      date: today(),
    })

    await openCheck()
    await screen.findByText(message('check.shouldBeLeft', '৳500.00'))
    await typeReal('450')

    await waitFor(() => {
      expect(document.querySelector('.check-result')).toBeTruthy()
    })

    const resultBlock = document.querySelector('.check-result') as HTMLElement

    expect(
      within(resultBlock).getByText(message('check.less', '৳50.00')),
    ).toBeTruthy()
    expect(within(resultBlock).getByText(en['check.lessHint'])).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', { name: en['check.addExpense'] }),
    )

    expect(window.location.hash).toBe('#/add/expense?amount=50&category=other')
  })

  it('shows more and opens a prefilled income form', async () => {
    await addTransaction({
      type: 'income',
      amountMinor: 50_000,
      source: 'Rahim',
      date: today(),
    })

    await openCheck()
    await screen.findByText(message('check.shouldBeLeft', '৳500.00'))
    await typeReal('700')

    await waitFor(() => {
      expect(document.querySelector('.check-result')).toBeTruthy()
    })

    const resultBlock = document.querySelector('.check-result') as HTMLElement

    expect(
      within(resultBlock).getByText(message('check.more', '৳200.00')),
    ).toBeTruthy()
    expect(within(resultBlock).getByText(en['check.moreHint'])).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: en['check.addIncome'] }))

    expect(window.location.hash).toBe('#/add/income?amount=200')
  })

  it('requires an amount and saves nothing while empty', async () => {
    await openCheck()

    fireEvent.click(screen.getByRole('button', { name: en['check.button'] }))

    expect(await screen.findByText(en['error.amountRequired'])).toBeTruthy()
    expect(await listCashChecks()).toHaveLength(0)
  })

  it('lists only the last five checks', async () => {
    for (let index = 0; index < 6; index += 1) {
      await addCashCheck({
        date: dayBefore(index),
        countedMinor: (index + 1) * 100_000,
        expectedMinor: 0,
      })
    }

    await openCheck()

    await waitFor(() => {
      expect(document.querySelectorAll('.ledger-row')).toHaveLength(5)
    })

    expect(screen.getByText('৳5,000.00')).toBeTruthy()
    expect(screen.queryByText('৳6,000.00')).toBeNull()
  })
})
