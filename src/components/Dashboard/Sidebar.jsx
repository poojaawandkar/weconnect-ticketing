import {
  LayoutDashboard,
  PlusCircle,
  Ticket,
  Bell,
  ChevronDown,
  LogOut,
  UserRound,
  X,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Layers,
  Building2,
  GraduationCap,
  ClipboardCheck,
  Gauge,
  FileText,
} from 'lucide-react'

import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { useLogout } from '../../auth/useLogout'
import { roleLabelFor } from '../../auth/identity'
import { useNotifications } from '../../notifications/useNotifications'

import lighthouseLogo from '../../assets/lighthouse-logo.svg'

/*
 * ================================================================
 * SIDEBAR NAV SECTIONS
 *
 * "Main" (the normal WeConnect User nav) renders for every user
 * EXCEPT a support-only user - someone whose elevated role is
 * Support and who is not also a Champion. For them the Support
 * workspace fully replaces the user workspace (no Raise Ticket /
 * My Tickets), matching UserRoute.
 *
 * "Champion" renders when Frappe roles include "WeConnect
 * Champion". "Support" (the WeConnect Support workspace) renders
 * when they include "WeConnect Support". "Skilling Support" is its
 * own simplified section, rendered when they include "Skilling
 * Support" - it layers on top of the User workspace the same way
 * Champion does. Everything is additive: more roles add more
 * sections, never replace one. Nothing here is based on name/email.
 * ================================================================
 */

const MAIN_SECTION = {
  label: 'Main',
  items: [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'raise-ticket', label: 'Raise Ticket', icon: PlusCircle, path: '/raise-ticket' },
    { id: 'my-tickets', label: 'My Tickets', icon: Ticket, path: '/tickets' },
  ],
}

const CHAMPION_SECTION = {
  label: 'Champion',
  items: [
    { id: 'champion-dashboard', label: 'Champion Dashboard', icon: ShieldCheck, path: '/champion' },
    { id: 'champion-assigned', label: 'Assigned to Me', icon: UserCheck, path: '/champion/tickets' },
    { id: 'champion-action', label: 'Requires My Action', icon: AlertCircle, path: '/champion/action' },
    { id: 'champion-all', label: 'All Champion Tickets', icon: Layers, path: '/champion/all-tickets' },
  ],
}

/*
 * The WeConnect Support workspace. No "Assigned to Me" / "Requires
 * My Action" pages - that information is represented through the
 * dashboard action queue and the stage-based ticket views instead.
 */
const SUPPORT_SECTION = {
  label: 'WeConnect Support',
  items: [
    { id: 'support-dashboard', label: 'Support Dashboard', icon: LayoutDashboard, path: '/support' },
    { id: 'support-centerops', label: 'CenterOps Tickets', icon: Building2, path: '/support/centerops' },
    { id: 'support-skilling', label: 'Skilling Tickets', icon: GraduationCap, path: '/support/skilling' },
    { id: 'support-approvals', label: 'Approvals', icon: ClipboardCheck, path: '/support/approvals' },
  ],
}

/*
 * The Skilling Support workspace - deliberately small. Notifications
 * and Profile are shared (see ACCOUNT_SECTION_ITEMS), so this
 * section is just the dashboard + the ticket workspace. No Raise
 * Ticket (that stays in the User workspace), no Champion anything.
 */
const SKILLING_SUPPORT_SECTION = {
  label: 'Skilling Support',
  items: [
    { id: 'skilling-support-dashboard', label: 'Support Dashboard', icon: LayoutDashboard, path: '/skilling-support' },
    { id: 'skilling-support-tickets', label: 'Skilling Tickets', icon: GraduationCap, path: '/skilling-support/tickets' },
  ],
}

/*
 * The shared analytical workspace - dashboards, support performance,
 * approvals and reports. "WeConnect Admin" sees it read-only;
 * "Program Head" sees the same pages plus approve / reject actions
 * on the Approvals tab. No operational ticket transitions.
 */
const ADMIN_SECTION = {
  label: 'Admin',
  items: [
    { id: 'admin-overview', label: 'Overview', icon: LayoutDashboard, path: '/admin' },
    { id: 'admin-performance', label: 'Support Performance', icon: Gauge, path: '/admin/performance' },
    { id: 'admin-approvals', label: 'Approvals', icon: ClipboardCheck, path: '/admin/approvals' },
    { id: 'admin-reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
    { id: 'admin-tickets', label: 'Tickets', icon: Ticket, path: '/admin/tickets' },
  ],
}

const ACCOUNT_SECTION_ITEMS = [
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
  { id: 'profile', label: 'Profile', icon: UserRound, path: '/profile' },
]

// Paths that should only be "active" on an exact match - everything
// else falls back to startsWith.
const EXACT_MATCH_PATHS = ['/dashboard', '/champion', '/support', '/skilling-support', '/admin']

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    displayName,
    initials,
    isChampion,
    isWeConnectSupport,
    isSkillingSupport,
    isAdmin,
    isProgramHead,
    isRegionalHead,
  } = useAuth()

  const logout = useLogout()

  const { unreadCount } = useNotifications()

  const roleLabel = roleLabelFor({
    isChampion,
    isWeConnectSupport,
    isSkillingSupport,
    isAdmin,
    isProgramHead,
    isRegionalHead,
  })

  /*
   * A WeConnect-Support-only, Admin-only, Program-Head-only or
   * Regional-Head-only user loses the normal-user nav - those are
   * stand-alone workspaces. Champions and Skilling Support users
   * keep it (additive).
   */
  const isStandalone =
    (isWeConnectSupport || isAdmin || isProgramHead || isRegionalHead) &&
    !isChampion &&
    !isSkillingSupport
  const showMain = !isStandalone

  const analyticsSection =
    isAdmin || isProgramHead || isRegionalHead
      ? {
          ...ADMIN_SECTION,
          label: isAdmin ? 'Admin' : isProgramHead ? 'Program Head' : 'Region Head',
        }
      : null

  const accountSection = {
    label: 'Account',
    items: ACCOUNT_SECTION_ITEMS.map((item) =>
      item.id === 'notifications' && unreadCount > 0
        ? { ...item, badge: unreadCount > 9 ? '9+' : unreadCount }
        : item
    ),
  }

  const sections = [
    ...(showMain ? [MAIN_SECTION] : []),
    ...(isChampion ? [CHAMPION_SECTION] : []),
    ...(isWeConnectSupport ? [SUPPORT_SECTION] : []),
    ...(isSkillingSupport ? [SKILLING_SUPPORT_SECTION] : []),
    ...(analyticsSection ? [analyticsSection] : []),
    accountSection,
  ]

  const isItemActive = (item) => {
    if (EXACT_MATCH_PATHS.includes(item.path)) {
      return location.pathname === item.path
    }
    return location.pathname.startsWith(item.path)
  }

  const handleMenuClick = (item) => {
    navigate(item.path)
    onClose()
  }

  const handleProfileClick = () => {
    navigate('/profile')
    onClose()
  }

  /*
   * Ends the real Frappe session, clears local auth state and lands
   * on /login in a single step (see useLogout).
   */
  const handleLogout = () => {
    onClose()
    logout()
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[250px] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >

        <div className="flex h-[78px] items-center justify-between border-b border-slate-100 px-5">
          <img
            src={lighthouseLogo}
            alt="Lighthouse Communities"
            className="h-11 w-auto max-w-[170px] object-contain"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          {sections.map((section) => (
            <div key={section.label} className="mb-6 last:mb-0">
              <p className="mb-2 px-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = isItemActive(item)

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMenuClick(item)}
                      className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm transition ${
                        isActive
                          ? 'bg-teal-50 font-medium text-teal-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2.2 : 1.8}
                        className={
                          isActive
                            ? 'text-teal-700'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }
                      />
                      <span>{item.label}</span>

                      {item.badge != null && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-100 px-1.5 text-[10px] font-semibold text-rose-600">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={handleProfileClick}
            className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-slate-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-slate-400">
                {roleLabel}
              </p>
            </div>

            <ChevronDown size={15} className="text-slate-400" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>

      </aside>
    </>
  )
}

export default Sidebar
