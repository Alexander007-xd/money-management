import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '../../app/routes'
import EntryForm from '../../components/EntryForm'

export default function AddIncomeScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  return (
    <EntryForm
      mode="add"
      type="income"
      initial={{
        amount: params.get('amount') ?? '',
        source: params.get('source') ?? '',
      }}
      onSaved={() => navigate(ROUTES.home)}
    />
  )
}
