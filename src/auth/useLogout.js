import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from './useAuth'

/*
 * ================================================================
 * useLogout()
 *
 * The one way to log out from anywhere (sidebar, header menu,
 * profile page). Ends the Frappe session + clears local auth
 * state (useAuth().logout), then sends the user straight to
 * /login with a replace so Back doesn't return to a now-dead
 * workspace.
 *
 * The role-guard routes also send a signed-out user to /login, so
 * even if a guard re-renders first the destination is the same -
 * logout always lands on /login in a single step.
 * ================================================================
 */
export function useLogout() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return useCallback(async () => {
    await logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])
}
