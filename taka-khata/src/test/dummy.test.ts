import { describe, expect, it } from 'vitest'

describe('test setup', () => {
  it('provides a jsdom document', () => {
    const element = document.createElement('div')
    element.textContent = 'Taka Khata'

    expect(element.textContent).toBe('Taka Khata')
  })

  it('provides a fake IndexedDB', () => {
    expect(typeof indexedDB).toBe('object')
  })
})
