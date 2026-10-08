import { Navigate } from 'react-router-dom'

import { useAuth } from './useAuth'

/*
 * ================================================================
 * ADMIN ROUTE
 *
 * Guards every /admin/* route - the shared analytical workspace.
 * Three Frappe roles reach it: "WeConnect Admin" (read-only
 * analytics), "Program Head" (same analytics + approve/reject on
 * the Approvals tab) and "Regional Head" (same analytics + region-
 * restricted approvals, every screen scoped to the assigned
 * region(s)). Anyone else is sent back to their normal dashboard.
 *
 * Every /admin/* route goes through here, so the workspace
 * disappears immediately if the role is removed in Frappe.
 * ================================================================
 */

function AdminRoute({ children }) {
  const { loading, user, isAdmin, isProgramHead, isRegionalHead } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    )
  }

  // Signed out (e.g. just logged out) - straight to login, one step.
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin && !isProgramHead && !isRegionalHead) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute
