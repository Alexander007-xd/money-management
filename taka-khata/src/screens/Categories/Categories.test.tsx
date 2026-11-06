import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../app/App'
import { DEFAULT_CATEGORIES, db } from '../../data/db'
import { addTransaction, getCategories, setSetting } from '../../data/repo'
import { en } from '../../i18n/en'
import { today } from '../../lib/dates'

beforeEach(async () => {
  await db.transactions.clear()
  await db.categories.clear()
  await db.categories.bulkAdd([...DEFAULT_CATEGORIES])
  await db.settings.clear()
  window.location.hash = ''
})

afterEach(() => {
  window.location.hash = ''
})

async function openCategories() {
  await setSetting('language', 'en')
  window.location.hash = '#/more/categories'
  const view = render(<App />)
  await screen.findByRole('heading', { name: en['categories.title'] })
  await screen.findByText('Food')

  return view
}

function rowFor(name: string): HTMLElement {
  const title = screen.getByText(name)
  const row = title.closest('.category-row')

  if (!(row instanceof HTMLElement)) {
    throw new Error(`No category row for ${name}`)
  }

  return row
}

async function findCategory(id: string) {
  const categories = await getCategories()

  return categories.find((category) => category.id === id)
}

describe('Categories', () => {
  it('lists every category with rename and hide controls', async () => {
    await openCategories()

    expect(screen.getByText('Food')).toBeTruthy()
    expect(screen.getByText('Transport')).toBeTruthy()
    expect(screen.getByText(en['categories.defaultHint'])).toBeTruthy()
    expect(
      screen.getAllByRole('button', { name: en['categories.rename'] }),
    ).toHaveLength(DEFAULT_CATEGORIES.length)
    expect(
      screen.getAllByRole('button', { name: en['categories.hide'] }),
    ).toHaveLength(DEFAULT_CATEGORIES.length)
  })

  it('renames a category in both languages', async () => {
    await openCategories()

    fireEvent.click(
      within(rowFor('Food')).getByRole('button', {
        name: en['categories.rename'],
      }),
    )

    const nameInput = screen.getByLabelText(
      en['categories.nameLabel'],
    ) as HTMLInputElement

    expect(nameInput.value).toBe('Food')

    fireEvent.change(nameInput, { target: { value: 'Snacks' } })
    fireEvent.click(screen.getByRole('button', { name: en['categories.save'] }))

    expect(await screen.findByText('Snacks')).toBeTruthy()
    expect(screen.queryByText('Food')).toBeNull()
    await waitFor(async () => {
      expect(await findCategory('food')).toMatchObject({
        nameEn: 'Snacks',
        nameBn: 'Snacks',
      })
    })
  })

  it('hides a category from the expense form but keeps it on old entries', async () => {
    await addTransaction({
      type: 'expense',
      amountMinor: 12_050,
      categoryId: 'food',
      note: 'Lunch',
      date: today(),
    })

    const view = await openCategories()

    fireEvent.click(
      within(rowFor('Food')).getByRole('button', {
        name: en['categories.hide'],
      }),
    )

    await waitFor(async () => {
      expect(await findCategory('food')).toMatchObject({ archived: true })
    })
    expect(
      within(rowFor('Food')).getByRole('button', {
        name: en['categories.show'],
      }),
    ).toBeTruthy()

    view.unmount()
    window.location.hash = '#/add/expense'
    const expenseView = render(<App />)

    expect(
      await screen.findByLabelText(en['add.amountLabel']),
    ).toBeTruthy()

    expect(screen.queryByRole('button', { name: 'Food' })).toBeNull()

    expenseView.unmount()
    window.location.hash = '#/history'
    render(<App />)

    expect(
      await screen.findByRole('heading', { name: en['history.title'] }),
    ).toBeTruthy()
    await waitFor(() => {
      expect(
        Array.from(document.querySelectorAll('.ledger-row__title')).map(
          (node) => node.textContent,
        ),
      ).toEqual(['Food'])
    })
  })

  it('adds a category with a chosen icon', async () => {
    const view = await openCategories()

    fireEvent.click(
      screen.getByRole('button', { name: en['categories.add'] }),
    )

    const nameInput = screen.getByLabelText(
      en['categories.nameLabel'],
    ) as HTMLInputElement

    expect(nameInput.value).toBe('')

    fireEvent.change(nameInput, { target: { value: 'Snacks' } })
    fireEvent.click(
      screen.getByRole('button', { name: en['categories.iconHeart'] }),
    )
    fireEvent.click(screen.getByRole('button', { name: en['categories.save'] }))

    expect(await screen.findByText('Snacks')).toBeTruthy()

    const categories = await getCategories()
    const added = categories.find((category) => category.nameEn === 'Snacks')

    expect(added).toMatchObject({
      nameEn: 'Snacks',
      nameBn: 'Snacks',
      icon: 'heart',
      isDefault: false,
      archived: false,
    })

    view.unmount()
    window.location.hash = '#/add/expense'
    render(<App />)

    expect(
      await screen.findByRole('button', { name: 'Snacks' }),
    ).toBeTruthy()
  })

  it('requires a name before saving and can cancel the editor', async () => {
    await openCategories()
    const before = await getCategories()

    fireEvent.click(
      screen.getByRole('button', { name: en['categories.add'] }),
    )
    fireEvent.click(screen.getByRole('button', { name: en['categories.save'] }))

    expect(
      await screen.findByText(en['categories.nameRequired']),
    ).toBeTruthy()
    expect(await getCategories()).toHaveLength(before.length)

    fireEvent.click(screen.getByRole('button', { name: en['common.cancel'] }))

    expect(screen.queryByLabelText(en['categories.nameLabel'])).toBeNull()
  })
})
