import { Navigate } from 'react-router-dom'

import { useAuth } from './useAuth'

/*
 * ================================================================
 * CHAMPION ROUTE
 *
 * Guards every /champion/* route. If the logged-in user doesn't
 * have the "WeConnect Champion" role, they're sent back to their
 * normal dashboard instead of rendering the Champion page.
 *
 * This is what makes Champion routes disappear immediately if
 * the role is removed in Frappe - no extra code changes needed
 * elsewhere, since every /champion/* route goes through here.
 * ================================================================
 */

function ChampionRoute({ children }) {
  const { loading, user, isChampion } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <p className="text-sm text-slate-400">
          Loading...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isChampion) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return children
}

export default ChampionRoute
