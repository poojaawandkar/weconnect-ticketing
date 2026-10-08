import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  getLoggedInUser,
  getLoggedInUserRoles,
  frappeLogout,
} from '../api/frappe'
import {
  getCurrentUserProfile,
  getCurrentRegionalHeadRegions,
  extractLighthouseRoles,
} from '../api/user'
import { displayNameFromUser, initialsFromUser } from './identity'

import {
  CHAMPION_ROLE,
  WECONNECT_SUPPORT_ROLE,
  SKILLING_SUPPORT_ROLE,
  ADMIN_ROLE,
  PROGRAM_HEAD_ROLE,
  REGIONAL_HEAD_ROLE,
} from '../data/ticketWorkflow'

import { AuthContext } from './authContext'


/*
 * ================================================================
 * AUTH PROVIDER
 *
 * Frappe is the source of truth for:
 *   - current user
 *   - current user's roles
 *   - current user's "User Profile" (Region + Center), via
 *     weconnect_ticketing.api.get_current_user_profile, which maps
 *     User -> User Profile -> Region + Center on the backend
 *
 * No user/email/region/center is hardcoded. Not every user has a
 * User Profile record yet - that's handled gracefully (region and
 * center simply come back null) rather than treated as an error.
 * ================================================================
 */

const BACKGROUND_REFRESH_INTERVAL_MS = 60 * 1000

const normalizeRole = (value) =>
  (value || '').trim().toLowerCase()


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [roles, setRoles] = useState([])
  const [profile, setProfile] = useState(null)
  const [lighthouseRoles, setLighthouseRoles] = useState([])
  const [regionalHeadRegions, setRegionalHeadRegions] = useState([])
  const [loading, setLoading] = useState(true)

  /*
   * Prevent background refreshes from starting before
   * authentication has been established.
   */
  const hasAuthenticatedSession = useRef(false)


  /*
   * ================================================================
   * REFRESH AUTH
   * ================================================================
   */

  const refreshAuth = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true)
      }

      try {
        /*
         * First determine the current Frappe user.
         *
         * If there is no session, getLoggedInUser() returns null.
         * This is a normal logged-out state, not an error.
         */
        const loggedInUser = await getLoggedInUser()

        if (!loggedInUser || loggedInUser === 'Guest') {
          hasAuthenticatedSession.current = false

          setUser(null)
          setRoles([])
          setProfile(null)
          setLighthouseRoles([])
          setRegionalHeadRegions([])

          return null
        }

        /*
         * We now know that a valid Frappe session exists.
         */
        hasAuthenticatedSession.current = true

        setUser(loggedInUser)

        /*
         * Fetch the actual Frappe roles, the User Profile (Region,
         * Center, and - when the backend includes it - the
         * "Lighthouse Roles" child table), and this user's Regional
         * Head region assignment(s) (a completely separate DocType
         * from User Profile - see getCurrentRegionalHeadRegions) for
         * this same user, in parallel.
         */
        const [userRoles, userProfile, userRegionalHeadRegions] = await Promise.all([
          getLoggedInUserRoles(),
          getCurrentUserProfile().catch((profileError) => {
            /*
             * A failed User Profile lookup should not sign the user
             * out - they're still validly authenticated. It just
             * means region/center (and the rest of the profile)
             * come back empty, same as a user with no User Profile
             * record at all.
             */
            console.error(
              'useAuth: failed to load user profile',
              profileError
            )
            return null
          }),
          getCurrentRegionalHeadRegions().catch((regionsError) => {
            /*
             * Same treatment - a failed lookup means "no Regional
             * Head region assigned", never a hardcoded fallback.
             */
            console.error(
              'useAuth: failed to load Regional Head regions',
              regionsError
            )
            return []
          }),
        ])

        /*
         * The Lighthouse Role(s) offered by the native Frappe Ticket
         * form under "Raised As Lighthouse Role" - taken from the
         * same User Profile payload, no extra request. Empty (and the
         * Raise Ticket "As Role" picker stays blocked) when the
         * payload doesn't carry the child table.
         */
        const resolvedLighthouseRoles = extractLighthouseRoles(userProfile)

        setRoles(userRoles)
        setProfile(userProfile)
        setLighthouseRoles(resolvedLighthouseRoles)
        setRegionalHeadRegions(userRegionalHeadRegions)

        return {
          user: loggedInUser,
          roles: userRoles,
          profile: userProfile,
          lighthouseRoles: resolvedLighthouseRoles,
          regionalHeadRegions: userRegionalHeadRegions,
        }

      } catch (error) {

        /*
         * An expired/invalid session should simply result
         * in a logged-out state.
         */
        console.error(
          'useAuth: authentication check failed',
          error
        )

        hasAuthenticatedSession.current = false

        setUser(null)
        setRoles([])
        setProfile(null)
        setLighthouseRoles([])
        setRegionalHeadRegions([])

        return null

      } finally {
        setLoading(false)
      }
    },
    []
  )


  /*
   * ================================================================
   * INITIAL AUTH CHECK
   *
   * It is okay to check once on startup.
   * A 401/403 is handled as "not logged in".
   * ================================================================
   */

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])


  /*
   * ================================================================
   * BACKGROUND ROLE REFRESH
   *
   * Only check while an authenticated user exists.
   *
   * This means changing a user's Frappe role can be reflected
   * without hardcoding the user.
   * ================================================================
   */

  useEffect(() => {
    const silentRefresh = () => {
      if (!hasAuthenticatedSession.current) {
        return
      }

      refreshAuth({ silent: true })
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        silentRefresh()
      }
    }

    window.addEventListener(
      'focus',
      silentRefresh
    )

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    )

    const intervalId = window.setInterval(
      silentRefresh,
      BACKGROUND_REFRESH_INTERVAL_MS
    )

    return () => {
      window.removeEventListener(
        'focus',
        silentRefresh
      )

      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      )

      window.clearInterval(intervalId)
    }
  }, [refreshAuth])


  /*
   * ================================================================
   * ROLE HELPERS
   * ================================================================
   */

  const hasRole = useCallback(
    (roleName) =>
      roles.some(
        (role) =>
          normalizeRole(role) ===
          normalizeRole(roleName)
      ),
    [roles]
  )


  /*
   * ================================================================
   * CLEAR AUTH
   * ================================================================
   */

  const clearAuth = useCallback(() => {
    hasAuthenticatedSession.current = false

    setUser(null)
    setRoles([])
    setProfile(null)
    setLighthouseRoles([])
    setRegionalHeadRegions([])
  }, [])


  /*
   * ================================================================
   * LOGOUT
   *
   * Ends the real Frappe session (POST /api/method/logout) and then
   * clears local auth/profile state - the one sanctioned way to log
   * out, so no component talks to the logout endpoint directly.
   * ================================================================
   */

  const logout = useCallback(async () => {
    try {
      await frappeLogout()
    } catch (error) {
      console.error('useAuth: logout request failed', error)
    } finally {
      clearAuth()
    }
  }, [clearAuth])


  /*
   * ================================================================
   * DERIVED IDENTITY
   *
   * The single place "what do we call this user" is decided - the
   * real Frappe full name when the User Profile lookup succeeded,
   * falling back to a name derived from their user id/email so the
   * UI still reads sensibly for a user with no profile yet.
   * ================================================================
   */

  const displayName = useMemo(
    () => profile?.full_name || displayNameFromUser(user),
    [profile, user]
  )

  const initials = useMemo(
    () => (profile?.full_name
      ? initialsFromUser(profile.full_name)
      : initialsFromUser(user)),
    [profile, user]
  )


  /*
   * ================================================================
   * AUTH CONTEXT VALUE
   * ================================================================
   */

  const value = useMemo(
    () => ({
      user,
      roles,
      loading,

      // Real User Profile mapping (User -> User Profile -> Region +
      // Center), plus the rest of the real Frappe identity. `null`
      // until resolved, and stays null (not an error) for a user
      // with no User Profile record.
      profile,
      email: profile?.email || user,
      fullName: displayName,
      firstName: profile?.first_name || null,
      phone: profile?.phone || null,
      region: profile?.region || null,
      center: profile?.center || null,
      hasUserProfile: Boolean(profile?.has_user_profile),

      displayName,
      initials,

      // Real Lighthouse Role(s) for this user, from their User
      // Profile. Empty (not an error) when none are assigned.
      lighthouseRoles,

      // Real region(s) this user is an ACTIVE "Regional Head" for,
      // from the real "Regional Head" DocType (user, region, active)
      // - NOT from User Profile. Empty (not an error) when this user
      // holds no active Regional Head assignment.
      regionalHeadRegions,

      hasRole,

      isChampion:
        hasRole(CHAMPION_ROLE),

      isWeConnectSupport:
        hasRole(WECONNECT_SUPPORT_ROLE),

      isSkillingSupport:
        hasRole(SKILLING_SUPPORT_ROLE),

      isSupport:
        hasRole(WECONNECT_SUPPORT_ROLE) ||
        hasRole(SKILLING_SUPPORT_ROLE),

      isAdmin:
        hasRole(ADMIN_ROLE),

      isProgramHead:
        hasRole(PROGRAM_HEAD_ROLE),

      isRegionalHead:
        hasRole(REGIONAL_HEAD_ROLE),

      refreshAuth,
      clearAuth,
      logout,
    }),
    [
      user,
      roles,
      profile,
      loading,
      displayName,
      initials,
      lighthouseRoles,
      regionalHeadRegions,
      hasRole,
      refreshAuth,
      clearAuth,
      logout,
    ]
  )


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}