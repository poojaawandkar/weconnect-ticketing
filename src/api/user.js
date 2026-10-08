import { callMethod } from './frappe'

/*
 * ================================================================
 * CURRENT USER PROFILE
 *
 * Real identity for the logged-in Frappe user - never a hardcoded
 * name/email. Region and Center come from the "User Profile"
 * DocType (User -> User Profile -> Region + Center), mapped on the
 * backend to whichever user the request is authenticated as. Not
 * every user has a User Profile record yet - the backend handles
 * that gracefully and simply returns null region/center rather than
 * erroring, so callers should do the same instead of assuming they
 * exist.
 * ================================================================
 */

export async function getCurrentUserProfile() {
  return callMethod('weconnect_ticketing.api.get_current_user_profile', {
    method: 'GET',
  })
}

/*
 * ================================================================
 * CURRENT USER'S REGIONAL HEAD REGION(S)
 *
 * The region(s) mapped to the logged-in user via the real "Regional
 * Head" DocType (user, region, active) - a completely different
 * DocType from "User Profile" above. Never a hardcoded region: a
 * user with no active Regional Head record gets back an empty list,
 * which callers should treat as "no region assigned" rather than
 * fall back to any default.
 * ================================================================
 */

export async function getCurrentRegionalHeadRegions() {
  const data = await callMethod(
    'weconnect_ticketing.api.get_current_regional_head_regions',
    { method: 'GET' }
  )
  return data?.regions || []
}

/*
 * ================================================================
 * CURRENT USER'S LIGHTHOUSE ROLES
 *
 * The Lighthouse Role(s) assigned to the logged-in user come from
 * the SAME "User Profile" payload that get_current_user_profile()
 * already returns for auth - no extra request, no new endpoint.
 *
 * `extractLighthouseRoles(profile)` pulls the "Lighthouse Roles"
 * child table out of that payload:
 *
 *   profile.lighthouse_roles = [
 *     { lighthouse_role: "OC" },
 *     { lighthouse_role: "SYC" },
 *   ]
 *   -> ["OC", "SYC"]
 *
 * Returns a de-duplicated string[]; empty when the user has no User
 * Profile or no Lighthouse Roles. Never hardcodes a role list, and
 * never reads a role *master* - only what is assigned to this user.
 * ================================================================
 */

export function extractLighthouseRoles(userProfileDoc) {
  if (!userProfileDoc || typeof userProfileDoc !== 'object') return []

  const seen = new Set()
  const roles = []

  const add = (raw) => {
    const role = raw ? String(raw).trim() : ''
    if (role && !seen.has(role)) {
      seen.add(role)
      roles.push(role)
    }
  }

  // The child table's fieldname on User Profile can vary between
  // sites, so look at every array on the doc:
  //   - child-table rows: objects carrying `lighthouse_role`
  //   - a plain string[] only when the key itself names it, so an
  //     unrelated list (e.g. `roles`) is never mistaken for this one
  for (const [key, value] of Object.entries(userProfileDoc)) {
    if (!Array.isArray(value)) continue

    const keyLooksRight = /lighthouse/i.test(key) && /role/i.test(key)

    for (const row of value) {
      if (row && typeof row === 'object') {
        add(row.lighthouse_role)
      } else if (typeof row === 'string' && keyLooksRight) {
        add(row)
      }
    }
  }

  return roles
}
