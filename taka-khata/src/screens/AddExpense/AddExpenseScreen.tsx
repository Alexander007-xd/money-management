import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../app/routes'
import EntryForm from '../../components/EntryForm'

export default function AddExpenseScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  return (
    <EntryForm
      mode="add"
      type="expense"
      initial={{
        amount: params.get('amount') ?? '',
        categoryId: params.get('category'),
      }}
      onSaved={() => navigate(ROUTES.home)}
    />
  )
}
