import {
  Building2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { useAuth } from '../auth/useAuth'
import { useLogout } from '../auth/useLogout'
import { roleLabelFor } from '../auth/identity'

/*
 * ================================================================
 * PROFILE
 *
 * Real identity for the logged-in Frappe user, read from the
 * centralized AuthContext (no separate fetch here - AuthContext
 * already loaded it once via
 * weconnect_ticketing.api.get_current_user_profile on login).
 *
 * Region and Center come from the real User -> User Profile ->
 * Region + Center mapping. Not every user has a User Profile
 * record yet - handled gracefully below instead of crashing or
 * showing a fabricated value.
 * ================================================================
 */

function Profile() {
  const {
    loading,
    displayName,
    initials,
    email,
    phone,
    region,
    center,
    hasUserProfile,
    isChampion,
    isWeConnectSupport,
    isSkillingSupport,
  } = useAuth()

  const roleLabel = roleLabelFor({ isChampion, isWeConnectSupport, isSkillingSupport })
  const logout = useLogout()

  return (
    <div className="min-h-full bg-slate-50">

      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6">

        {/* No repeated "Profile" title here - the shared Header
            already shows the page title and a back control. */}

        <p className="text-sm text-slate-500">
          Your WeConnect account information.
        </p>

        {/* Profile overview */}

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">

          <div className="bg-gradient-to-r from-teal-50 to-white px-5 py-7 sm:px-7">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-lg font-semibold text-teal-700">

                  {loading ? '...' : initials}

                </div>

                <div>

                  <h2 className="text-lg font-semibold text-slate-900">
                    {loading ? 'Loading...' : displayName}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {roleLabel}
                  </p>

                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600">

                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                    Active account

                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-rose-200 bg-white px-4 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut size={15} />
                Log out
              </button>

            </div>

          </div>

          {/* Account details */}

          <div className="border-t border-slate-100 px-5 py-6 sm:px-7">

            <div className="flex items-center gap-2">

              <UserRound
                size={17}
                className="text-teal-700"
              />

              <h2 className="text-sm font-semibold text-slate-800">
                Account Information
              </h2>

            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              <div>

                <div className="flex items-center gap-2 text-slate-400">

                  <Mail size={14} />

                  <p className="text-[10px] uppercase tracking-wide">
                    Email
                  </p>

                </div>

                <p className="mt-2 text-xs font-medium text-slate-700">
                  {loading ? 'Loading...' : email}
                </p>

              </div>

              <div>

                <div className="flex items-center gap-2 text-slate-400">

                  <Phone size={14} />

                  <p className="text-[10px] uppercase tracking-wide">
                    Phone
                  </p>

                </div>

                <p className="mt-2 text-xs font-medium text-slate-700">
                  {loading ? 'Loading...' : phone || 'Not provided'}
                </p>

              </div>

              <div>

                <div className="flex items-center gap-2 text-slate-400">

                  <ShieldCheck size={14} />

                  <p className="text-[10px] uppercase tracking-wide">
                    Role
                  </p>

                </div>

                <p className="mt-2 text-xs font-medium text-slate-700">
                  {roleLabel}
                </p>

              </div>

            </div>

          </div>

          {/* WeConnect details - Region / Center, from the real
              User Profile mapping */}

          <div className="border-t border-slate-100 px-5 py-6 sm:px-7">

            <div className="flex items-center gap-2">

              <Building2
                size={17}
                className="text-teal-700"
              />

              <h2 className="text-sm font-semibold text-slate-800">
                WeConnect Details
              </h2>

            </div>

            {!loading && !hasUserProfile ? (

              <p className="mt-4 text-xs leading-relaxed text-slate-400">
                No Region/Center is set up for your account yet. Contact an administrator to have your User Profile configured.
              </p>

            ) : (

              <div className="mt-5 grid gap-5 sm:grid-cols-2">

                <div className="rounded-lg bg-slate-50 px-4 py-4">

                  <div className="flex items-center gap-2">

                    <MapPin
                      size={15}
                      className="text-slate-400"
                    />

                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Region
                    </p>

                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    {loading ? 'Loading...' : region}
                  </p>

                </div>

                <div className="rounded-lg bg-slate-50 px-4 py-4">

                  <div className="flex items-center gap-2">

                    <Building2
                      size={15}
                      className="text-slate-400"
                    />

                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Center
                    </p>

                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    {loading ? 'Loading...' : center}
                  </p>

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  )
}

export default Profile
