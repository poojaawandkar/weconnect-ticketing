import ModuleTicketsWorkspace from '../../components/support/ModuleTicketsWorkspace'
import { CENTEROPS_MODULE } from '../../data/ticketModules'

/*
 * ================================================================
 * CENTEROPS TICKETS
 *
 * WeConnect Support only (route-guarded in App.jsx / SupportRoute).
 * The clean module ticket workspace - status tabs + one table.
 * ================================================================
 */

function SupportCenterOpsTickets() {
  return (
    <ModuleTicketsWorkspace
      module={CENTEROPS_MODULE}
      subtitle="CenterOps tickets handled by WeConnect Support."
    />
  )
}

export default SupportCenterOpsTickets
