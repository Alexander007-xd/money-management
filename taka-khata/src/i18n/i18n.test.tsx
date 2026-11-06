import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { bn } from './bn'
import { en } from './en'
import { LanguageProvider, formatNumber, t, useLanguage } from './index'

function Probe() {
  const { lang, setLang, t, formatNumber } = useLanguage()

  return (
    <div>
      <span data-testid="text">{t('home.received')}</span>
      <span data-testid="number">{formatNumber(1234)}</span>
      <span data-testid="lang">{lang}</span>
      <button type="button" onClick={() => setLang('en')}>
        switch
      </button>
    </div>
  )
}

describe('translations', () => {
  it('has the same keys in Bangla and English', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(bn).sort())
  })

  it('has no empty translations', () => {
    for (const value of Object.values(bn)) {
      expect(value.trim()).not.toBe('')
    }

    for (const value of Object.values(en)) {
      expect(value.trim()).not.toBe('')
    }
  })

  it('translates a key for the chosen language', () => {
    expect(t('bn', 'home.received')).toBe(bn['home.received'])
    expect(t('en', 'home.received')).toBe(en['home.received'])
  })

  it('interpolates strings and converts numeric params to Bangla digits', () => {
    expect(t('bn', 'check.less', { amount: '৳১০০' })).toContain('৳১০০')
    expect(t('bn', 'backup.confirmMessage', { count: 3 })).toContain('৩')
    expect(t('en', 'backup.confirmMessage', { count: 3 })).toContain('3')
  })
})

describe('formatNumber', () => {
  it('uses Bangla digits for Bangla', () => {
    expect(formatNumber(1234, 'bn')).toBe('১২৩৪')
  })

  it('uses Latin digits for English and converts Bangla input', () => {
    expect(formatNumber(1234, 'en')).toBe('1234')
    expect(formatNumber('১২৩৪', 'en')).toBe('1234')
  })

  it('leaves non-digits untouched', () => {
    expect(formatNumber('12.5%', 'bn')).toBe('১২.৫%')
  })
})

describe('LanguageProvider', () => {
  it('switches language and re-renders text and digits', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    )

    expect(screen.getByTestId('text').textContent).toBe(bn['home.received'])
    expect(screen.getByTestId('number').textContent).toBe('১২৩৪')
    expect(screen.getByTestId('lang').textContent).toBe('bn')
    expect(document.documentElement.lang).toBe('bn')

    fireEvent.click(screen.getByRole('button', { name: 'switch' }))

    expect(screen.getByTestId('text').textContent).toBe(en['home.received'])
    expect(screen.getByTestId('number').textContent).toBe('1234')
    expect(screen.getByTestId('lang').textContent).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('starts in Bangla by default', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    )

    expect(screen.getByTestId('lang').textContent).toBe('bn')
  })
})
