import { Navigate } from 'react-router-dom'

import { useAuth } from './useAuth'

/*
 * ================================================================
 * SUPPORT ROUTE
 *
 * Guards every /support/* route - the WeConnect Support workspace
 * (CenterOps Tickets, Approvals, Skilling monitoring, the support
 * dashboard).
 *
 * Only the "WeConnect Support" Frappe role grants access here.
 *   - A Skilling-Support-only user is sent to their own additive
 *     /skilling-support workspace.
 *   - Anyone else goes back to their normal dashboard.
 *
 * "WeConnect User" alone never grants access. Every /support/*
 * route goes through here, so the workspace disappears immediately
 * if the role is removed in Frappe.
 * ================================================================
 */

function SupportRoute({ children }) {
  const { loading, user, isWeConnectSupport, isSkillingSupport } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isWeConnectSupport) {
    return (
      <Navigate
        to={isSkillingSupport ? '/skilling-support' : '/dashboard'}
        replace
      />
    )
  }

  return children
}

export default SupportRoute
