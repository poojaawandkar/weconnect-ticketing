import { useContext } from 'react'

import { NotificationsContext } from './notificationsContext'

/*
 * ================================================================
 * useNotifications()
 *
 * The one sanctioned way to read the current user's real
 * notification feed (comments received + ticket status changes) -
 * used by the Header bell and the Notifications page so neither one
 * fetches independently.
 * ================================================================
 */

export function useNotifications() {
  const context = useContext(NotificationsContext)

  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }

  return context
}
