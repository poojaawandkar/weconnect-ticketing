import { createContext } from 'react'

/*
 * Raw context object, kept in its own non-component module so both
 * NotificationsProvider.jsx and useNotifications.js can share it
 * without mixing component and non-component exports in the same
 * file (mirrors src/auth/authContext.js and src/tickets/ticketsContext.js).
 */

export const NotificationsContext = createContext(undefined)
