import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AmountInput from './AmountInput'
import Button from './Button'
import ConfirmDialog from './ConfirmDialog'
import EmptyState from './EmptyState'
import Field from './Field'
import Toast from './Toast'

describe('Button', () => {
  it('renders its label and variant class', () => {
    render(<Button variant="primary-income">Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' })

    expect(button.className).toContain('btn--primary-income')
  })

  it('calls onClick when pressed', () => {
    const onClick = vi.fn()

    render(<Button onClick={onClick}>Save</Button>)

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows ... and is disabled while loading', () => {
    render(<Button loading>Save</Button>)

    const button = screen.getByRole('button', { name: '...' }) as HTMLButtonElement

    expect(button.disabled).toBe(true)
    expect(button.textContent).toBe('...')
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>Save</Button>)

    const button = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement

    expect(button.disabled).toBe(true)
  })
})

describe('Field', () => {
  it('connects the label to the input and renders its value', () => {
    render(<Field label="Date" type="date" value="2026-01-15" onChange={() => {}} />)

    expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe('2026-01-15')
  })

  it('shows error text and marks the input invalid', () => {
    render(
      <Field
        label="Date"
        value="2026-01-15"
        onChange={() => {}}
        error="The date cannot be after today."
      />,
    )

    expect(screen.getByText('The date cannot be after today.')).toBeTruthy()
    expect(screen.getByLabelText('Date').getAttribute('aria-invalid')).toBe('true')
  })
})

describe('AmountInput', () => {
  it('shows the taka symbol, the value and a decimal keypad', () => {
    render(<AmountInput label="How much?" value="250" onChange={() => {}} />)

    const input = screen.getByLabelText('How much?')

    expect(screen.getByText('৳')).toBeTruthy()
    expect((input as HTMLInputElement).value).toBe('250')
    expect(input.getAttribute('inputmode')).toBe('decimal')
  })

  it('shows error text and marks the input invalid', () => {
    render(
      <AmountInput
        label="How much?"
        value=""
        onChange={() => {}}
        error="Write an amount."
      />,
    )

    expect(screen.getByText('Write an amount.')).toBeTruthy()
    expect(screen.getByLabelText('How much?').getAttribute('aria-invalid')).toBe('true')
  })
})

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Delete this entry?"
        message="You can undo for 5 seconds."
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders the texts and calls both actions', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        open
        title="Delete this entry?"
        message="You can undo for 5 seconds."
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Delete this entry?')).toBeTruthy()
    expect(screen.getByText('You can undo for 5 seconds.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    fireEvent.click(screen.getByRole('button', { name: 'No' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

describe('Toast', () => {
  it('renders the message and an optional action', () => {
    const onAction = vi.fn()

    render(<Toast message="Saved" actionLabel="Undo" onAction={onAction} />)

    expect(screen.getByRole('status').textContent).toContain('Saved')

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))

    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when hidden', () => {
    render(<Toast message="Saved" visible={false} />)

    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('EmptyState', () => {
  it('renders a message and an action button', () => {
    const onAction = vi.fn()

    render(
      <EmptyState
        message="Nothing written yet."
        actionLabel="Add"
        onAction={onAction}
      />,
    )

    expect(screen.getByText('Nothing written yet.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
