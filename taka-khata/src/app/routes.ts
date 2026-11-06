export const ROUTES = {
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
} as const

export type FormState =
  | 'idle'
  | 'editing'
  | 'validating'
  | 'saving'
  | 'saved'
  | 'error'
  | 'confirmDiscard'

export type DeleteState = 'idle' | 'confirmDelete' | 'deleted'

export type CheckState = 'input' | 'result'

export type ImportState = 'idle' | 'parsing' | 'confirmReplace' | 'importing' | 'done' | 'error'
