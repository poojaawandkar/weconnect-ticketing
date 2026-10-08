/*
 * ================================================================
 * IDENTITY HELPERS
 *
 * Derive a display name / initials / role label from the REAL
 * logged-in Frappe user (an email or user id) - never a hardcoded
 * name. Used by the Sidebar and Header so removing a role in Frappe
 * immediately changes what the shell shows.
 * ================================================================
 */

export function displayNameFromUser(user) {
  const local = String(user || '').split('@')[0]
  if (!local) return 'User'

  return local
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function initialsFromUser(user) {
  const name = displayNameFromUser(user)
  const parts = name.split(/\s+/).filter(Boolean)

  const initials =
    (parts[0]?.charAt(0) || '') +
    (parts[1]?.charAt(0) || parts[0]?.charAt(1) || '')

  return initials.toUpperCase() || '??'
}

export function roleLabelFor({
  isChampion,
  isWeConnectSupport,
  isSkillingSupport,
  isAdmin,
  isProgramHead,
  isRegionalHead,
} = {}) {
  const roles = []

  if (isAdmin) roles.push('WeConnect Admin')
  if (isProgramHead) roles.push('Program Head')
  if (isRegionalHead) roles.push('Regional Head')

  if (isWeConnectSupport && isSkillingSupport) {
    roles.push('WeConnect + Skilling Support')
  } else if (isWeConnectSupport) {
    roles.push('WeConnect Support')
  } else if (isSkillingSupport) {
    roles.push('Skilling Support')
  }

  if (isChampion) roles.push('WeConnect Champion')

  return roles.length > 0 ? roles.join(' · ') : 'WeConnect User'
}
