const FRAPPE_URL = ''

const ROLES_API_METHOD =
  'weconnect_ticketing.api.get_current_user_roles'


/*
 * ================================================================
 * ERROR PARSING
 *
 * Frappe error responses carry the real, useful message in one of
 * a few shapes depending on how the exception was raised
 * (frappe.throw, a raw Python exception, a permission error, ...).
 * This pulls out the best available human-readable message instead
 * of ever showing a generic "something went wrong".
 * ================================================================
 */

function extractServerMessage(data) {
  if (!data) return null

  // frappe.throw(_("...")) - the primary, translated message.
  if (data._server_messages) {
    try {
      const messages = JSON.parse(data._server_messages)
      const first = JSON.parse(messages[0])
      if (first?.message) return first.message
    } catch {
      // fall through to the other shapes below
    }
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message
  }

  // A raw Python exception looks like
  // "frappe.exceptions.ValidationError: Subject is required."
  if (typeof data.exception === 'string' && data.exception.trim()) {
    const parts = data.exception.split(': ')
    return parts.length > 1 ? parts.slice(1).join(': ') : data.exception
  }

  return null
}

export class FrappeApiError extends Error {
  constructor(message, { status, isAuthError = false } = {}) {
    super(message)
    this.name = 'FrappeApiError'
    this.status = status
    this.isAuthError = isAuthError
  }
}

async function parseErrorResponse(response) {
  const status = response.status
  const isAuthError = status === 401 || status === 403

  const text = await response.text()

  let message = isAuthError
    ? 'Your session has expired. Please log in again.'
    : `Request failed (${status}).`

  if (text) {
    try {
      const data = JSON.parse(text)
      const serverMessage = extractServerMessage(data)
      if (serverMessage) message = serverMessage
    } catch {
      message = text
    }
  }

  return new FrappeApiError(message, { status, isAuthError })
}


/*
 * ================================================================
 * CALL A WHITELISTED METHOD
 *
 * GET is used for read-only lookups, POST for anything that
 * changes data. Every call carries the real Frappe session cookie
 * and never caches - the caller always gets fresh data.
 * ================================================================
 */

export async function callMethod(methodPath, { method = 'POST', params } = {}) {
  let url = `${FRAPPE_URL}/api/method/${methodPath}`
  const options = {
    method,
    credentials: 'include',
    cache: 'no-store',
  }

  if (method === 'GET') {
    if (params) {
      const query = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        query.set(
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value)
        )
      })
      const queryString = query.toString()
      if (queryString) url += `?${queryString}`
    }
  } else {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(params || {})
  }

  const response = await fetch(url, options)

  if (!response.ok) {
    throw await parseErrorResponse(response)
  }

  const data = await response.json()
  return data.message
}


/*
 * ================================================================
 * CALL A WHITELISTED METHOD - BINARY DOWNLOAD
 *
 * Same session/error handling as callMethod() above, but for an
 * endpoint that streams back a generated file
 * (frappe.local.response.type = "download", e.g.
 * weconnect_ticketing.api.generate_report) instead of JSON - reads
 * the response as a Blob and takes the filename Frappe itself chose
 * off Content-Disposition, rather than guessing one client-side.
 * ================================================================
 */

export async function callMethodForFile(methodPath, { params, fallbackFilename = 'download' } = {}) {
  const response = await fetch(`${FRAPPE_URL}/api/method/${methodPath}`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
  })

  if (!response.ok) {
    throw await parseErrorResponse(response)
  }

  const blob = await response.blob()

  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^";]+)"?/i)
  const filename = match ? match[1] : fallbackFilename

  return { blob, filename }
}


/*
 * ================================================================
 * UPLOAD A FILE
 *
 * Uses Frappe's standard file upload endpoint. The file is
 * uploaded as a private, unattached file owned by the current
 * user - the backend re-parents it onto the right document once
 * that document exists (see weconnect_ticketing.api.create_ticket
 * / add_ticket_comment).
 * ================================================================
 */

export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file, file.name)
  formData.append('is_private', '1')

  const response = await fetch(`${FRAPPE_URL}/api/method/upload_file`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    body: formData,
  })

  if (!response.ok) {
    throw await parseErrorResponse(response)
  }

  const data = await response.json()

  return {
    file_url: data.message?.file_url,
    file_name: data.message?.file_name || file.name,
    name: data.message?.name,
  }
}


/*
 * ================================================================
 * LOGIN
 * ================================================================
 */

export async function frappeLogin(username, password) {
  const response = await fetch(
    `${FRAPPE_URL}/api/method/login`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usr: username,
        pwd: password,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data?.message || 'Login failed'
    )
  }

  return data
}


/*
 * ================================================================
 * LOGOUT
 * ================================================================
 */

export async function frappeLogout() {
  const response = await fetch(`${FRAPPE_URL}/api/method/logout`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  })

  // A failed logout call shouldn't block the frontend from clearing
  // its own state and sending the user back to /login - it just
  // means the Frappe session cookie may still be valid server-side.
  if (!response.ok) {
    console.error('frappeLogout: logout request failed', response.status)
  }
}


/*
 * ================================================================
 * GET CURRENT USER + ROLES
 *
 * Uses the authenticated Frappe session.
 *
 * The backend determines the current user.
 * Nothing is hardcoded.
 * ================================================================
 */

async function getCurrentUserAndRoles() {
  const response = await fetch(
    `${FRAPPE_URL}/api/method/${ROLES_API_METHOD}`,
    {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    }
  )

  /*
   * A 403 here simply means there is no active Frappe session.
   * Do not try to parse a potentially empty/non-JSON response.
   */
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return {
        user: null,
        roles: [],
      }
    }

    throw await parseErrorResponse(response)
  }

  const data = await response.json()

  return {
    user: data?.message?.user || null,
    roles: Array.isArray(data?.message?.roles)
      ? data.message.roles
      : [],
  }
}


/*
 * ================================================================
 * GET LOGGED-IN USER
 * ================================================================
 */

export async function getLoggedInUser() {
  const data = await getCurrentUserAndRoles()

  return data.user
}


/*
 * ================================================================
 * GET LOGGED-IN USER'S ROLES
 * ================================================================
 */

export async function getLoggedInUserRoles() {
  const data = await getCurrentUserAndRoles()

  return data.roles
}
