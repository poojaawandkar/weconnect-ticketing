import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '../auth/useAuth'
import { getMyNotifications, markNotificationsRead } from '../api/notifications'
import { NotificationsContext } from './notificationsContext'

/*
 * ================================================================
 * NOTIFICATIONS PROVIDER
 *
 * A real, live feed for the current user - built on the backend
 * from their own Tickets and the Comments on them
 * (weconnect_ticketing.api.get_my_notifications), not seed/mock
 * data. Mounted once (in main.jsx, alongside AuthProvider) so the
 * Header bell and the Notifications page read the same fetch
 * instead of each polling independently.
 *
 * Read/unread state lives on the backend (per user): each item from
 * get_my_notifications carries `read`, and markRead()/markAllRead()
 * persist through mark_notifications_read. Retention (last 2 days,
 * older only while unread) is applied by get_my_notifications.
 * State here is just a cache of the backend's answer.
 * ================================================================
 */

const POLL_INTERVAL_MS = 60 * 1000

export function NotificationsProvider({ children }) {
  const { user } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    try {
      const data = await getMyNotifications()
      setNotifications(data)
      setError(null)
    } catch (err) {
      console.error('NotificationsProvider: failed to load notifications', err)
      setError(err.message || 'Unable to load notifications right now.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    setLoading(true)
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!user) return undefined

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', handleVisibility)
    const intervalId = window.setInterval(refresh, POLL_INTERVAL_MS)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.clearInterval(intervalId)
    }
  }, [user, refresh])

  // Persist on the backend, flip the flag locally right away so the
  // badge updates instantly, then re-sync from the backend (which
  // also corrects the UI if the save failed).
  const markRead = useCallback(
    async (ids) => {
      const idSet = new Set(ids)
      if (idSet.size === 0) return

      setNotifications((current) =>
        current.map((n) => (idSet.has(n.id) ? { ...n, read: true } : n))
      )

      try {
        await markNotificationsRead([...idSet])
      } catch (err) {
        console.error('NotificationsProvider: failed to mark notifications read', err)
      }

      refresh()
    },
    [refresh]
  )

  const markAllRead = useCallback(
    () => markRead(notifications.filter((n) => !n.read).map((n) => n.id)),
    [markRead, notifications]
  )

  const isUnread = useCallback((notification) => !notification.read, [])

  const unreadCount = useMemo(
    () => notifications.filter(isUnread).length,
    [notifications, isUnread]
  )

  const value = useMemo(
    () => ({
      notifications,
      loading,
      error,
      unreadCount,
      isUnread,
      refresh,
      markRead,
      markAllRead,
    }),
    [notifications, loading, error, unreadCount, isUnread, refresh, markRead, markAllRead]
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}
