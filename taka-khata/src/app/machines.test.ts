import { describe, expect, it } from 'vitest'
import {
  checkOutcome,
  checkReducer,
  deleteReducer,
  formReducer,
  importReducer,
  routeAfterSave,
  type CheckEvent,
  type DeleteEvent,
  type FormEvent,
  type ImportEvent,
} from './machines'
import {
  ROUTES,
  type CheckState,
  type DeleteState,
  type FormState,
  type ImportState,
} from './routes'

describe('ROUTES', () => {
  it('matches the route contract in AppFlow.md', () => {
    expect(ROUTES).toEqual({
      welcome: '/welcome',
      home: '/',
      addIncome: '/add/income',
      addExpense: '/add/expense',
      edit: '/edit/:id',
      history: '/history',
      report: '/report',
      check: '/check',
      more: '/more',
      categories: '/more/categories',
      backup: '/more/backup',
      install: '/more/install',
    })
  })
})

const formCases: Array<[FormState, FormEvent, FormState]> = [
  ['idle', 'OPEN', 'editing'],
  ['editing', 'SAVE', 'validating'],
  ['validating', 'INVALID', 'editing'],
  ['validating', 'VALID', 'saving'],
  ['saving', 'SUCCESS', 'saved'],
  ['saving', 'FAILURE', 'error'],
  ['error', 'RETRY', 'saving'],
  ['editing', 'BACK', 'confirmDiscard'],
  ['confirmDiscard', 'DISCARD_YES', 'idle'],
  ['confirmDiscard', 'DISCARD_NO', 'editing'],
]

describe('formReducer', () => {
  it.each(formCases)('moves %s with %s to %s', (state, event, expected) => {
    expect(formReducer(state, event)).toBe(expected)
  })

  it('routes home after an add and history after an edit', () => {
    expect(routeAfterSave('add')).toBe(ROUTES.home)
    expect(routeAfterSave('edit')).toBe(ROUTES.history)
  })

  it('keeps the saved state until the screen navigates', () => {
    expect(formReducer('saved', 'SUCCESS')).toBe('saved')
  })

  it('ignores events that do not apply to the current state', () => {
    expect(formReducer('editing', 'OPEN')).toBe('editing')
    expect(formReducer('idle', 'SAVE')).toBe('idle')
    expect(formReducer('confirmDiscard', 'SAVE')).toBe('confirmDiscard')
  })
})

const deleteCases: Array<[DeleteState, DeleteEvent, DeleteState]> = [
  ['idle', 'DELETE', 'confirmDelete'],
  ['confirmDelete', 'CONFIRM', 'deleted'],
  ['confirmDelete', 'CANCEL', 'idle'],
  ['deleted', 'UNDO', 'idle'],
  ['deleted', 'TIMEOUT', 'idle'],
]

describe('deleteReducer', () => {
  it.each(deleteCases)('moves %s with %s to %s', (state, event, expected) => {
    expect(deleteReducer(state, event)).toBe(expected)
  })

  it('ignores events that do not apply to the current state', () => {
    expect(deleteReducer('idle', 'CONFIRM')).toBe('idle')
    expect(deleteReducer('confirmDelete', 'UNDO')).toBe('confirmDelete')
  })
})

const checkCases: Array<[CheckState, CheckEvent, CheckState]> = [
  ['input', 'CHECK', 'result'],
  ['result', 'CHECK_AGAIN', 'input'],
]

describe('checkReducer', () => {
  it.each(checkCases)('moves %s with %s to %s', (state, event, expected) => {
    expect(checkReducer(state, event)).toBe(expected)
  })

  it('ignores events that do not apply to the current state', () => {
    expect(checkReducer('input', 'CHECK_AGAIN')).toBe('input')
    expect(checkReducer('result', 'CHECK')).toBe('result')
  })
})

describe('checkOutcome', () => {
  it('returns matches when the difference is zero', () => {
    expect(checkOutcome(0)).toBe('matches')
  })

  it('returns less when money is missing', () => {
    expect(checkOutcome(-5_000)).toBe('less')
  })

  it('returns more when money is left over', () => {
    expect(checkOutcome(5_000)).toBe('more')
  })
})

const importCases: Array<[ImportState, ImportEvent, ImportState]> = [
  ['idle', 'PICK_FILE', 'parsing'],
  ['parsing', 'INVALID', 'error'],
  ['parsing', 'VALID', 'confirmReplace'],
  ['confirmReplace', 'CONFIRM', 'importing'],
  ['importing', 'SUCCESS', 'done'],
  ['importing', 'FAILURE', 'error'],
]

describe('importReducer', () => {
  it.each(importCases)('moves %s with %s to %s', (state, event, expected) => {
    expect(importReducer(state, event)).toBe(expected)
  })

  it('ignores events that do not apply to the current state', () => {
    expect(importReducer('idle', 'SUCCESS')).toBe('idle')
    expect(importReducer('confirmReplace', 'PICK_FILE')).toBe('confirmReplace')
  })
})
