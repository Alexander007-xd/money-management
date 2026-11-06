import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../app/App'
import { db } from '../../data/db'
import { addTransaction, setSetting } from '../../data/repo'
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

async function openHome(): Promise<void> {
  await setSetting('language', 'en')
  window.location.hash = '#/'
  render(<App />)
  await screen.findByText(en['home.balanceLabel'])
}

describe('Home', () => {
  it('shows a zero balance, both actions and the empty state when nothing is written', async () => {
    await openHome()

    expect(screen.getByText('৳0.00')).toBeTruthy()
    expect(screen.getByRole('link', { name: en['home.received'] })).toBeTruthy()
    expect(screen.getByRole('link', { name: en['home.spent'] })).toBeTruthy()
    expect(await screen.findByText(en['home.empty'])).toBeTruthy()
    expect(
      screen.getByRole('link', { name: new RegExp(en['home.checkMoney']) }),
    ).toBeTruthy()
  })

  it('shows the all-time balance, this month totals and the latest entries', async () => {
    await addTransaction({
      type: 'income',
      amountMinor: 500_000,
      source: 'Rahim',
      date: today(),
    })
    await addTransaction({
      type: 'expense',
      amountMinor: 12_050,
      categoryId: 'food',
      note: 'Lunch',
      date: today(),
    })

    await openHome()

    expect(await screen.findByText('Rahim')).toBeTruthy()
    expect(screen.getByText(en['home.balanceLabel'])).toBeTruthy()
    expect(screen.getByText('৳4,879.50')).toBeTruthy()
    expect(screen.getByText(en['home.thisMonth'])).toBeTruthy()

    const monthStrip = document.querySelector('.month-strip')

    expect(monthStrip).toBeTruthy()
    expect(within(monthStrip as HTMLElement).getByText(en['home.received'])).toBeTruthy()
    expect(within(monthStrip as HTMLElement).getByText(en['home.spent'])).toBeTruthy()
    expect(within(monthStrip as HTMLElement).getByText('+৳5,000.00')).toBeTruthy()
    expect(within(monthStrip as HTMLElement).getByText('-৳120.50')).toBeTruthy()
    expect(screen.getByText('Food')).toBeTruthy()
    expect(screen.getByText(/Lunch/)).toBeTruthy()
    expect(screen.queryByText(en['home.empty'])).toBeNull()
  })

  it('shows at most five latest entries', async () => {
    for (let index = 0; index < 6; index += 1) {
      const date = new Date()
      date.setDate(date.getDate() - index)
      const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      await addTransaction({
        type: 'income',
        amountMinor: (index + 1) * 1_000,
        source: `Source ${index + 1}`,
        date: formatted,
      })
    }

    await openHome()

    expect(await screen.findByText('Source 1')).toBeTruthy()
    expect(screen.getByText('Source 5')).toBeTruthy()
    expect(screen.queryByText('Source 6')).toBeNull()
    expect(document.querySelectorAll('.ledger-row')).toHaveLength(5)
  })

  it('shows the negative hint when spending is more than money received', async () => {
    await addTransaction({
      type: 'expense',
      amountMinor: 10_000,
      categoryId: 'food',
      date: today(),
    })

    await openHome()

    expect(await screen.findByText(en['home.negativeHint'])).toBeTruthy()
    expect(screen.getAllByText('-৳100.00').length).toBeGreaterThan(0)
  })

  it('opens the add screens from the big actions', async () => {
    await openHome()

    fireEvent.click(screen.getByRole('link', { name: en['home.received'] }))

    expect(window.location.hash).toBe('#/add/income')

    window.location.hash = '#/'
    fireEvent.click(await screen.findByRole('link', { name: en['home.spent'] }))

    expect(window.location.hash).toBe('#/add/expense')
  })

  it('opens the edit screen from a ledger row and History from See all', async () => {
    const saved = await addTransaction({
      type: 'expense',
      amountMinor: 8_000,
      categoryId: 'transport',
      date: today(),
    })

    await openHome()

    fireEvent.click(await screen.findByRole('button', { name: /Transport/ }))

    expect(window.location.hash).toBe(`#/edit/${saved.id}`)

    window.location.hash = '#/'
    fireEvent.click(await screen.findByRole('link', { name: en['home.seeAll'] }))

    expect(window.location.hash).toBe('#/history')
  })
})
