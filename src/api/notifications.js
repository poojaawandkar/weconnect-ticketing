import { callMethod } from './frappe'

/*
 * ================================================================
 * NOTIFICATIONS
 *
 * There is no dedicated Notification DocType on the backend - this
 * is a real, live feed built from the current user's own Tickets
 * and the Comments on them (weconnect_ticketing.api.get_my_notifications),
 * never seed/mock data. Each item is one of:
 *
 *   - "comment"  someone else replied on one of your tickets
 *   - "status"   one of your tickets became Resolved / Closed /
 *                Awaiting User / Reopened
 * ================================================================
 */

export async function getMyNotifications() {
  const data = await callMethod('weconnect_ticketing.api.get_my_notifications', {
    method: 'GET',
  })

  return Array.isArray(data) ? data : []
}

// Persists read state server-side (per user) - see mark_notifications_read.
export async function markNotificationsRead(ids) {
  return callMethod('weconnect_ticketing.api.mark_notifications_read', {
    params: { ids },
  })
}
