import { Navigate } from 'react-router-dom'

import { useAuth } from './useAuth'
import { UserTicketsProvider } from '../tickets/UserTicketsProvider'

/*
 * ================================================================
 * USER ROUTE
 *
 * Guards the normal WeConnect User routes (/dashboard,
 * /raise-ticket, /tickets, /tickets/:id).
 *
 * A user whose ONLY elevated role is WeConnect Support, Admin or
 * Program Head does not get the normal-user workspace - those are
 * distinct stand-alone workspaces. They are redirected to /support
 * or /admin (Admin and Program Head share the /admin workspace).
 *
 * A Champion OR a Skilling Support user keeps full normal-user
 * access, because both of those workspaces are additive on top of
 * the user workspace.
 * ================================================================
 */

function UserRoute({ children }) {
  const {
    loading,
    user,
    isWeConnectSupport,
    isChampion,
    isSkillingSupport,
    isAdmin,
    isProgramHead,
    isRegionalHead,
  } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    )
  }

  // Signed out - don't render the (empty) user workspace, go to login.
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (
    (isWeConnectSupport || isAdmin || isProgramHead || isRegionalHead) &&
    !isChampion &&
    !isSkillingSupport
  ) {
    return <Navigate to={isWeConnectSupport ? '/support' : '/admin'} replace />
  }

  return (
    <UserTicketsProvider>
      {children}
    </UserTicketsProvider>
  )
}

export default UserRoute
