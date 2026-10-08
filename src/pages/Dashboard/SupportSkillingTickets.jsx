import ModuleTicketsWorkspace from '../../components/support/ModuleTicketsWorkspace'
import { SKILLING_MODULE } from '../../data/ticketModules'

/*
 * ================================================================
 * SKILLING TICKETS  (WeConnect Support view)
 *
 * The Skilling tickets WeConnect Support handles - same clean
 * workspace as the CenterOps page. Kept as its own page (not merged
 * with CenterOps) so filtering and scanning each module stays
 * simple.
 * ================================================================
 */

function SupportSkillingTickets() {
  return (
    <ModuleTicketsWorkspace
      module={SKILLING_MODULE}
      subtitle="Skilling tickets handled by WeConnect Support."
    />
  )
}

export default SupportSkillingTickets
