import {
  ROUTES,
  type CheckState,
  type DeleteState,
  type FormState,
  type ImportState,
} from './routes'

export type FormEvent =
  | 'OPEN'
  | 'SAVE'
  | 'INVALID'
  | 'VALID'
  | 'SUCCESS'
  | 'FAILURE'
  | 'RETRY'
  | 'BACK'
  | 'DISCARD_YES'
  | 'DISCARD_NO'

export type DeleteEvent = 'DELETE' | 'CONFIRM' | 'CANCEL' | 'UNDO' | 'TIMEOUT'

export type CheckEvent = 'CHECK' | 'CHECK_AGAIN'

export type ImportEvent = 'PICK_FILE' | 'INVALID' | 'VALID' | 'CONFIRM' | 'SUCCESS' | 'FAILURE'

export type CheckOutcome = 'matches' | 'less' | 'more'

export function formReducer(state: FormState, event: FormEvent): FormState {
  switch (state) {
    case 'idle':
      return event === 'OPEN' ? 'editing' : state
    case 'editing':
      if (event === 'SAVE') {
        return 'validating'
      }

      if (event === 'BACK') {
        return 'confirmDiscard'
      }

      return state
    case 'validating':
      if (event === 'INVALID') {
        return 'editing'
      }

      if (event === 'VALID') {
        return 'saving'
      }

      return state
    case 'saving':
      if (event === 'SUCCESS') {
        return 'saved'
      }

      if (event === 'FAILURE') {
        return 'error'
      }

      return state
    case 'saved':
      return state
    case 'error':
      return event === 'RETRY' ? 'saving' : state
    case 'confirmDiscard':
      if (event === 'DISCARD_YES') {
        return 'idle'
      }

      if (event === 'DISCARD_NO') {
        return 'editing'
      }

      return state
    default:
      return state
  }
}

export function routeAfterSave(mode: 'add' | 'edit'): string {
  return mode === 'edit' ? ROUTES.history : ROUTES.home
}

export function deleteReducer(state: DeleteState, event: DeleteEvent): DeleteState {
  switch (state) {
    case 'idle':
      return event === 'DELETE' ? 'confirmDelete' : state
    case 'confirmDelete':
      if (event === 'CONFIRM') {
        return 'deleted'
      }

      if (event === 'CANCEL') {
        return 'idle'
      }

      return state
    case 'deleted':
      return event === 'UNDO' || event === 'TIMEOUT' ? 'idle' : state
    default:
      return state
  }
}

export function checkReducer(state: CheckState, event: CheckEvent): CheckState {
  switch (state) {
    case 'input':
      return event === 'CHECK' ? 'result' : state
    case 'result':
      return event === 'CHECK_AGAIN' ? 'input' : state
    default:
      return state
  }
}

export function checkOutcome(diffMinor: number): CheckOutcome {
  if (diffMinor === 0) {
    return 'matches'
  }

  return diffMinor < 0 ? 'less' : 'more'
}

export function importReducer(state: ImportState, event: ImportEvent): ImportState {
  switch (state) {
    case 'idle':
      return event === 'PICK_FILE' ? 'parsing' : state
    case 'parsing':
      if (event === 'INVALID') {
        return 'error'
      }

      if (event === 'VALID') {
        return 'confirmReplace'
      }

      return state
    case 'confirmReplace':
      return event === 'CONFIRM' ? 'importing' : state
    case 'importing':
      if (event === 'SUCCESS') {
        return 'done'
      }

      if (event === 'FAILURE') {
        return 'error'
      }

      return state
    case 'done':
      return state
    case 'error':
      return state
    default:
      return state
  }
}
