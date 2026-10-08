import { useNavigate } from 'react-router-dom'

import MyTickets from '../../components/Dashboard/MyTickets'

function MyTicketsPage() {
  const navigate = useNavigate()

  return (
    <MyTickets
      onOpenTicket={(ticket) => navigate(`/tickets/${ticket.id}`)}
    />
  )
}

export default MyTicketsPage
