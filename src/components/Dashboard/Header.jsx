import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  Ticket,
  UserCheck,
  UserRound,
} from 'lucide-react'

import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { useLogout } from '../../auth/useLogout'
import { roleLabelFor } from '../../auth/identity'
import { useNotifications } from '../../notifications/useNotifications'

/*
 * ================================================================
 * PAGE META
 *
 * Every route the app has gets its own header icon + title instead
 * of the header always saying "Dashboard" - and a Back control
 * shows up on everything except the three workspace root pages
 * (/dashboard, /champion, /support), which the sidebar already
 * gets you to directly.
 * ================================================================
 */

const TICKET_DETAIL_PATTERN = /^\/(champion\/|support\/|skilling-support\/)?tickets\/[^/]+$/

const PAGE_META = [
  { path: '/dashboard', title: 'Dashboard', icon: LayoutDashboard, root: true },
  { path: '/raise-ticket', title: 'Raise Ticket', icon: PlusCircle },
  { path: '/tickets', title: 'My Tickets', icon: Ticket },
  { path: '/champion/tickets', title: 'Assigned to Me', icon: UserCheck },
  { path: '/champion/action', title: 'Requires My Action', icon: AlertCircle },
  { path: '/champion/all-tickets', title: 'All Champion Tickets', icon: Layers },
  { path: '/champion', title: 'Champion Dashboard', icon: ShieldCheck, root: true },
  { path: '/support/centerops', title: 'CenterOps Tickets', icon: Building2 },
  { path: '/support/skilling', title: 'Skilling Tickets', icon: GraduationCap },
  { path: '/support/approvals', title: 'Approvals', icon: ClipboardCheck },
  { path: '/support', title: 'Support Dashboard', icon: LayoutDashboard, root: true },
  { path: '/skilling-support/tickets', title: 'Skilling Tickets', icon: GraduationCap },
  { path: '/skilling-support', title: 'Support Dashboard', icon: LayoutDashboard, root: true },
  { path: '/admin/tickets', title: 'Tickets', icon: Ticket },
  { path: '/admin/performance', title: 'Support Performance', icon: Gauge },
  { path: '/admin/approvals', title: 'Approvals', icon: ClipboardCheck },
  { path: '/admin/reports', title: 'Reports', icon: FileText },
  { path: '/admin', title: 'Overview', icon: LayoutDashboard, root: true },
  { path: '/notifications', title: 'Notifications', icon: Bell },
  { path: '/profile', title: 'Profile', icon: UserRound },
].sort((a, b) => b.path.length - a.path.length)

const DEFAULT_PAGE_META = { title: 'Dashboard', icon: LayoutDashboard, root: true }

function getPageMeta(pathname) {
  if (TICKET_DETAIL_PATTERN.test(pathname)) {
    return { title: 'Ticket Details', icon: Ticket, root: false }
  }

  const match = PAGE_META.find(
    (entry) => pathname === entry.path || pathname.startsWith(`${entry.path}/`)
  )

  return match || DEFAULT_PAGE_META
}

function Header({ onMenuClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    displayName,
    initials,
    isChampion,
    isWeConnectSupport,
    isSkillingSupport,
  } = useAuth()

  const { unreadCount } = useNotifications()
  const logout = useLogout()

  const roleLabel = roleLabelFor({
    isChampion,
    isWeConnectSupport,
    isSkillingSupport,
  })

  const pageMeta = useMemo(
    () => getPageMeta(location.pathname),
    [location.pathname]
  )
  const PageIcon = pageMeta.icon

  /*
   * ============================================================
   * NOTIFICATIONS
   * ============================================================
   */

  const handleNotificationsClick = () => {
    navigate('/notifications')
  }

  /*
   * ============================================================
   * HELP - a real, visible action instead of a decorative icon:
   * a quick panel pointing at the two things people actually need
   * (raise a ticket, check existing ones), closes on an outside
   * click.
   * ============================================================
   */

  const [helpOpen, setHelpOpen] = useState(false)
  const helpRef = useRef(null)

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (!helpOpen && !userMenuOpen) return undefined

    const handleClickOutside = (event) => {
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setHelpOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [helpOpen, userMenuOpen])

  useEffect(() => {
    setHelpOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="flex h-[78px] shrink-0 items-center justify-between bg-gradient-to-r from-teal-900 to-teal-700 px-5 shadow-sm sm:px-6 lg:px-8">

      {/* ======================================================
          LEFT - menu, back (contextual), page icon + title
      ======================================================= */}

      <div className="flex min-w-0 items-center gap-3">

        {/* Menu */}

        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-teal-100 transition hover:bg-white/10 hover:text-white"
          aria-label="Open sidebar"
        >
          <Menu size={21} />
        </button>

        <div className="h-6 w-px shrink-0 bg-teal-600/50" />

        {!pageMeta.root && (
          <>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-teal-100 transition hover:bg-white/10 hover:text-white"
              aria-label="Go back"
            >
              <ChevronLeft size={20} />
              <span className="hidden text-sm font-medium sm:inline">
                Back
              </span>
            </button>

            <div className="hidden h-6 w-px shrink-0 bg-teal-600/50 sm:block" />
          </>
        )}

        <div className="flex min-w-0 items-center gap-2.5">
          <PageIcon size={20} className="shrink-0 text-teal-200" />
          <h1 className="truncate text-xl font-semibold text-white">
            {pageMeta.title}
          </h1>
        </div>

      </div>

      {/* ======================================================
          RIGHT
      ======================================================= */}

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">

        {/* ====================================================
            HELP - opens a real panel instead of doing nothing
        ===================================================== */}

        <div className="relative" ref={helpRef}>

          <button
            type="button"
            onClick={() => setHelpOpen((open) => !open)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
              helpOpen
                ? 'bg-white/15 text-white'
                : 'text-teal-100 hover:bg-white/10 hover:text-white'
            }`}
            aria-label="Help"
            aria-expanded={helpOpen}
          >
            <HelpCircle size={19} />
          </button>

          {helpOpen && (
            <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-lg">

              <div className="flex items-center gap-2">
                <LifeBuoy size={16} className="text-teal-700" />
                <p className="text-sm font-semibold text-slate-800">
                  Need a hand?
                </p>
              </div>

              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Raise a ticket and the right support team will pick it up, or check where your existing tickets stand.
              </p>

              <div className="mt-3.5 space-y-1.5">

                <button
                  type="button"
                  onClick={() => {
                    setHelpOpen(false)
                    navigate('/raise-ticket')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                >
                  <PlusCircle size={15} className="text-teal-600" />
                  Raise a new ticket
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setHelpOpen(false)
                    navigate('/tickets')
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                >
                  <Ticket size={15} className="text-teal-600" />
                  View my tickets
                </button>

              </div>

            </div>
          )}

        </div>

        {/* ====================================================
            NOTIFICATIONS
        ===================================================== */}

        <button
          type="button"
          onClick={handleNotificationsClick}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-teal-100 transition hover:bg-white/10 hover:text-white"
          aria-label="Notifications"
        >

          <Bell size={19} />

          {/* Unread indicator - real count from the current user's
              notification feed, not a static dot */}

          {unreadCount > 0 && (
            unreadCount > 9 ? (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white ring-2 ring-teal-800">
                9+
              </span>
            ) : (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-teal-800" />
            )
          )}

        </button>

        {/* Divider */}

        <div className="mx-1 hidden h-8 w-px bg-teal-600/50 sm:block" />

        {/* ====================================================
            USER MENU - opens a small dropdown (My Profile / Log out)
        ===================================================== */}

        <div className="relative" ref={userMenuRef}>

          <button
            type="button"
            onClick={() => setUserMenuOpen((open) => !open)}
            className={`flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition sm:px-2 ${
              userMenuOpen ? 'bg-white/15' : 'hover:bg-white/10'
            }`}
            aria-label="Account menu"
            aria-expanded={userMenuOpen}
          >

            {/* Avatar */}

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-teal-800">
              {initials}
            </div>

            {/* User information */}

            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-white">{displayName}</p>
              <p className="text-[10px] text-teal-100">{roleLabel}</p>
            </div>

            <ChevronDown
              size={15}
              className={`hidden text-teal-100 transition sm:block ${userMenuOpen ? 'rotate-180' : ''}`}
            />

          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-lg">

              <div className="border-b border-slate-100 px-4 py-3 sm:hidden">
                <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
                <p className="truncate text-[11px] text-slate-400">{roleLabel}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  navigate('/profile')
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
              >
                <UserRound size={16} className="text-slate-400" />
                My Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  logout()
                }}
                className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut size={16} />
                Log out
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  )
}

export default Header
