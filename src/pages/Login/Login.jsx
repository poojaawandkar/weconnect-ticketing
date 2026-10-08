import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { frappeLogin } from '../../api/frappe'
import { useAuth } from '../../auth/useAuth'
import {
  WECONNECT_SUPPORT_ROLE,
  SKILLING_SUPPORT_ROLE,
  CHAMPION_ROLE,
  ADMIN_ROLE,
  PROGRAM_HEAD_ROLE,
  REGIONAL_HEAD_ROLE,
} from '../../data/ticketWorkflow'
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  CircleCheck,
} from 'lucide-react'

import lighthouseLogo from '../../assets/lighthouse-logo.svg'

function Login() {
  const navigate = useNavigate()
  const { refreshAuth } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')

    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    try {
      // =====================================================
      // LOGIN TO FRAPPE
      // =====================================================

      await frappeLogin(email, password)

      // =====================================================
      // SYNC LOGGED-IN USER + ROLES
      //
      // AuthContext resolves the Frappe user and their roles
      // (including "WeConnect Champion" / the Support roles). The
      // Sidebar reacts to this automatically. We land the user on
      // the workspace their roles imply.
      //
      // Skilling Support is additive (it layers on the normal User
      // workspace, like Champion), so those users land on /dashboard
      // and reach their Skilling workspace from the sidebar. Only a
      // WeConnect-Support-only user has no normal-user workspace and
      // goes straight to /support.
      // =====================================================

      const session = await refreshAuth()

      const roles = (session?.roles || []).map((role) =>
        String(role).trim().toLowerCase()
      )
      const has = (role) => roles.includes(role.toLowerCase())

      const isStandalone = !has(CHAMPION_ROLE) && !has(SKILLING_SUPPORT_ROLE)
      const landing = isStandalone && has(WECONNECT_SUPPORT_ROLE)
        ? '/support'
        : isStandalone && (has(ADMIN_ROLE) || has(PROGRAM_HEAD_ROLE) || has(REGIONAL_HEAD_ROLE))
          ? '/admin'
          : '/dashboard'

      navigate(landing)

    } catch (error) {
      console.error('Login error:', error)

      setError(
        error?.message ||
        'Unable to login. Please check your email and password.'
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex lg:h-screen lg:overflow-hidden">

      {/* =====================================================
          LEFT PANEL
      ====================================================== */}

      <section className="hidden lg:flex lg:w-[58%] relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700">

        {/* Decorative background shapes */}

        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-teal-600/20" />

        <div className="absolute -bottom-52 -right-32 h-[620px] w-[620px] rounded-full bg-emerald-400/10" />

        <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        {/* Left content */}

        <div className="relative z-10 flex w-full flex-col items-center justify-center px-12 xl:px-20 text-center text-white">

          {/* Heading */}

          <div className="max-w-2xl">

            <h2 className="text-4xl xl:text-5xl font-semibold leading-[1.2] tracking-tight">
              Resolve Issues,
              <br />
              With WeConnect Support.
            </h2>

            <div className="mx-auto my-7 h-px w-20 bg-teal-300/60" />

            <p className="mx-auto max-w-xl text-base xl:text-lg font-normal leading-relaxed text-teal-50/90">
              A simple and structured way to raise, track and resolve
              WeConnect support issues.
            </p>

          </div>

          {/* Ticket / Support visual */}

          <div className="relative mt-12 h-64 w-64">

            {/* Outer circle */}

            <div className="absolute inset-0 rounded-full border border-white/10 bg-white/5" />

            {/* Middle circle */}

            <div className="absolute left-8 top-8 h-48 w-48 rounded-full border border-white/10 bg-white/5" />

            {/* Inner circle */}

            <div className="absolute left-16 top-16 flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-teal-500/20">

              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 shadow-lg">

                <ShieldCheck
                  size={42}
                  strokeWidth={1.5}
                  className="text-teal-100"
                />

              </div>

            </div>

            {/* Resolved status */}

            <div className="absolute -right-16 top-7 rounded-xl border border-white/20 bg-white/95 px-4 py-3 text-left shadow-xl">

              <div className="flex items-center gap-2">

                <CircleCheck
                  size={16}
                  className="text-emerald-600"
                />

                <span className="text-xs font-medium text-slate-500">
                  Ticket Status
                </span>

              </div>

              <p className="mt-1 text-sm font-semibold text-emerald-600">
                Resolved
              </p>

            </div>

            {/* Support status */}

            <div className="absolute -left-20 bottom-8 rounded-xl border border-white/20 bg-white/95 px-4 py-3 text-left shadow-xl">

              <p className="text-xs text-slate-400">
                Support
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                We're here to help
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          RIGHT PANEL
      ====================================================== */}

      <section className="flex w-full lg:w-[42%] items-center justify-center px-5 py-10 sm:px-8">

        <div className="w-full max-w-[420px]">

          {/* Login Card */}

          <div className="rounded-2xl border border-slate-200 bg-white px-7 py-9 shadow-sm sm:px-10">

            {/* Lighthouse Logo */}

            <div className="flex justify-center">

              <img
                src={lighthouseLogo}
                alt="Lighthouse Communities"
                className="h-20 w-auto max-w-[230px] object-contain"
              />

            </div>

            {/* Divider */}

            <div className="my-8 h-px bg-slate-200" />

            {/* Heading */}

            <div className="mb-7">

              <h2 className="text-2xl font-semibold text-slate-900">
                Login
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Welcome back! Please login to your account.
              </p>

            </div>

            {/* Form */}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-medium text-slate-700"
                >
                  Email ID <span className="text-red-500">*</span>
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
                />

              </div>

              {/* Password */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-medium text-slate-700"
                >
                  Password <span className="text-red-500">*</span>
                </label>

                <div className="relative">

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-4 pr-11 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-teal-700"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>

                </div>

              </div>

              {/* Error */}

              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
                  <p className="text-xs text-red-600">
                    {error}
                  </p>
                </div>
              )}

              {/* Remember / Forgot */}

              <div className="flex items-center justify-between">

                <label className="flex cursor-pointer items-center gap-2">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(e.target.checked)
                    }
                    className="h-3.5 w-3.5 cursor-pointer accent-teal-700"
                  />

                  <span className="text-xs text-slate-600">
                    Remember Me
                  </span>

                </label>

                <button
                  type="button"
                  className="text-xs font-medium text-teal-700 transition hover:text-teal-900"
                >
                  Forgot Password?
                </button>

              </div>

              {/* Login button */}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-700 text-xs font-medium text-white shadow-sm transition hover:bg-teal-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? 'Logging in...' : 'Login'}

                {!loading && (
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                )}

              </button>

            </form>

          </div>

          {/* Footer */}

          <p className="mt-6 text-center text-[10px] text-slate-400">
            Lighthouse Communities • Ticketing System
          </p>

        </div>

      </section>

    </div>
  )
}

export default Login