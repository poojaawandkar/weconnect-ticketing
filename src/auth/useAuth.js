import { useContext } from 'react'

import { AuthContext } from './authContext'

/*
 * ================================================================
 * useAuth()
 *
 * The one sanctioned way to read who's logged in and what roles
 * they have. Components should never hardcode a user/email, and
 * should never check roles any other way - always go through
 * hasRole() / isChampion here.
 * ================================================================
 */

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
