import { createContext } from 'react'

/*
 * Raw context object, kept in its own non-component module so both
 * TicketsProvider.jsx and useTickets.js can share it without mixing
 * component and non-component exports in the same file (mirrors
 * src/auth/authContext.js).
 */

export const TicketsContext = createContext(undefined)
