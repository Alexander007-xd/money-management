import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../app/App'
import { db } from '../../data/db'
import { listTransactions, setSetting } from '../../data/repo'
import { en } from '../../i18n/en'
import { today } from '../../lib/dates'

beforeEach(async () => {
  await db.transactions.clear()
  await db.settings.clear()
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
})

async function openAddExpense(hash = '#/add/expense'): Promise<void> {
  await setSetting('language', 'en')
  window.location.hash = hash
  render(<App />)
  await screen.findByLabelText(en['add.amountLabel'])
}

describe('AddExpense', () => {
  it('saves an expense with the chosen category and returns Home', async () => {
    await openAddExpense()

    fireEvent.change(screen.getByLabelText(en['add.amountLabel']), {
      target: { value: '120.50' },
    })

    const food = await screen.findByRole('button', { name: 'Food' })

    fireEvent.click(food)
    fireEvent.click(screen.getByRole('button', { name: en['add.save'] }))

    expect(await screen.findByText(en['home.balanceLabel'])).toBeTruthy()

    const rows = await listTransactions()

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      type: 'expense',
      amountMinor: 12_050,
      categoryId: 'food',
      source: null,
      date: today(),
    })
  })

  it('refuses to save without a category', async () => {
    await openAddExpense()

    fireEvent.change(screen.getByLabelText(en['add.amountLabel']), {
      target: { value: '50' },
    })
    fireEvent.click(screen.getByRole('button', { name: en['add.save'] }))

    expect(await screen.findByText(en['error.categoryRequired'])).toBeTruthy()
    expect(await listTransactions()).toHaveLength(0)
  })

  it('prefills the amount and category from the URL', async () => {
    await openAddExpense('#/add/expense?amount=100&category=food')

    expect((screen.getByLabelText(en['add.amountLabel']) as HTMLInputElement).value).toBe(
      '100',
    )

    const food = await screen.findByRole('button', { name: 'Food' })

    expect(food.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: en['add.save'] }))

    expect(await screen.findByText(en['home.balanceLabel'])).toBeTruthy()

    const rows = await listTransactions()

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      type: 'expense',
      amountMinor: 10_000,
      categoryId: 'food',
    })
  })

  it('shows the seeded categories as tiles', async () => {
    await openAddExpense()

    expect(await screen.findByRole('button', { name: 'Hostel Rent' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cook' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Transport' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Other' })).toBeTruthy()
  })
})
