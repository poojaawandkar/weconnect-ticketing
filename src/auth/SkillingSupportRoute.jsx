import { Navigate } from 'react-router-dom'

import { useAuth } from './useAuth'

/*
 * ================================================================
 * SKILLING SUPPORT ROUTE
 *
 * Guards every /skilling-support/* route. The Skilling Support
 * workspace is additive - it layers on top of whatever else the
 * user has (typically WeConnect User), the same way the Champion
 * workspace does - so this only checks for the "Skilling Support"
 * Frappe role and sends everyone else back to their dashboard.
 *
 * Because every /skilling-support/* route goes through here, the
 * workspace disappears immediately if the role is removed in Frappe.
 * ================================================================
 */

function SkillingSupportRoute({ children }) {
  const { loading, user, isSkillingSupport } = useAuth()

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

  if (!isSkillingSupport) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default SkillingSupportRoute
