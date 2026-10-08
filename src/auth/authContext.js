import { createContext } from 'react'

/*
 * Raw context object, kept in its own non-component module so both
 * AuthContext.jsx (the AuthProvider component) and useAuth.js (the
 * hook) can share it without mixing component and non-component
 * exports in the same file.
 */

export const AuthContext = createContext(undefined)
