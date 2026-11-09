import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BalanceCard from './BalanceCard'

describe('BalanceCard', () => {
  it('shows the label, amount and no hint when the balance is positive', () => {
    render(
      <BalanceCard
        label="Money that should be left"
        amountText="৳1,250.00"
        negative={false}
        hint="You wrote more spending than money received."
      />,
    )

    expect(screen.getByText('Money that should be left')).toBeTruthy()
    expect(screen.getByText('৳1,250.00')).toBeTruthy()
    expect(
      screen.queryByText('You wrote more spending than money received.'),
    ).toBeNull()
  })

  it('shows the hint when the balance is negative', () => {
    render(
      <BalanceCard
        label="Money that should be left"
        amountText="-৳500.00"
        negative
        hint="You wrote more spending than money received."
      />,
    )

    expect(
      screen.getByText('You wrote more spending than money received.'),
    ).toBeTruthy()
  })

  it('uses the normal size for a short amount', () => {
    render(
      <BalanceCard
        label="Money that should be left"
        amountText="৳250.00"
        negative={false}
        hint=""
      />,
    )

    expect(screen.getByText('৳250.00').className).not.toContain('is-compact')
  })

  it('shrinks the amount so a very large number fits a 360px screen', () => {
    render(
      <BalanceCard
        label="Money that should be left"
        amountText="৳9,999,999.99"
        negative={false}
        hint=""
      />,
    )

    expect(screen.getByText('৳9,999,999.99').className).toContain('is-compact')
  })

  it('shrinks the amount for a long negative number', () => {
    render(
      <BalanceCard
        label="Money that should be left"
        amountText="-৳9,999,999.99"
        negative
        hint="Too much spending."
      />,
    )

    expect(screen.getByText('-৳9,999,999.99').className).toContain('is-compact')
  })
})
