import { useNavigate } from 'react-router-dom'

import RaiseTicket from '../../components/Dashboard/RaiseTicket'

function RaiseTicketPage() {
  const navigate = useNavigate()

  return (
    <RaiseTicket
      onBack={() => navigate('/dashboard')}
    />
  )
}

export default RaiseTicketPage
