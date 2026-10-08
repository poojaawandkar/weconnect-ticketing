import { useEffect, useMemo, useState } from 'react'
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    ChevronDown,
    FileText,
    ImagePlus,
    Info,
    Loader2,
    Paperclip,
    Send,
    X,
} from 'lucide-react'

import { useAuth } from '../../auth/useAuth'
import { roleLabelFor } from '../../auth/identity'
import { useUserTickets } from '../../tickets/useUserTickets'
import { getTicketFormOptions, createTicket } from '../../api/tickets'

/*
 * Priority cards - a proper radio-card look (ring + filled check
 * badge on the selected one) instead of a subtle border/background
 * tint, so which priority is selected is never ambiguous.
 */
const PRIORITY_CONFIG = {
    Urgent: {
        ring: 'ring-red-500 border-red-500 bg-red-50',
        badge: 'bg-red-500',
        dot: 'bg-red-500',
        helper: 'Immediate attention',
    },
    High: {
        ring: 'ring-rose-500 border-rose-500 bg-rose-50',
        badge: 'bg-rose-500',
        dot: 'bg-rose-500',
        helper: 'Needs quick attention',
    },
    Medium: {
        ring: 'ring-amber-500 border-amber-500 bg-amber-50',
        badge: 'bg-amber-500',
        dot: 'bg-amber-500',
        helper: 'Standard priority',
    },
    Low: {
        ring: 'ring-slate-500 border-slate-500 bg-slate-100',
        badge: 'bg-slate-500',
        dot: 'bg-slate-400',
        helper: 'General issue',
    },
}
const DEFAULT_PRIORITY_CONFIG = {
    ring: 'ring-slate-500 border-slate-500 bg-slate-100',
    badge: 'bg-slate-500',
    dot: 'bg-slate-400',
    helper: '',
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

const emptyFormOptions = {
    modules: [],
    subModulesByModule: {},
    issueTypes: [],
    regions: [],
    centersByRegion: {},
    priorities: [],
}

function RaiseTicket({ onBack }) {
    const {
        user: currentUser,
        displayName,
        initials,
        region: profileRegion,
        center: profileCenter,
        lighthouseRoles,
        isChampion,
        isWeConnectSupport,
        isSkillingSupport,
    } = useAuth()
    const { refresh: refreshTickets } = useUserTickets()

    /* ============================================================
       FORM OPTIONS - real Frappe data
    ============================================================ */

    const [formOptions, setFormOptions] = useState(emptyFormOptions)
    const [optionsLoading, setOptionsLoading] = useState(true)
    const [optionsError, setOptionsError] = useState(null)

    useEffect(() => {
        let cancelled = false

        setOptionsLoading(true)

        getTicketFormOptions()
            .then((data) => {
                if (cancelled) return
                setFormOptions(data)
                setOptionsError(null)
            })
            .catch((error) => {
                if (cancelled) return
                console.error('RaiseTicket: failed to load form options', error)
                setOptionsError(
                    error.message || 'Unable to load the ticket form right now.'
                )
            })
            .finally(() => {
                if (!cancelled) setOptionsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    /* ============================================================
       FORM STATE
    ============================================================ */

    const [subject, setSubject] = useState('')
    const [module, setModule] = useState('')
    const [subModule, setSubModule] = useState('')
    const [priority, setPriority] = useState('')
    const [region, setRegion] = useState('')
    const [center, setCenter] = useState('')
    const [asRole, setAsRole] = useState('')
    const [issue, setIssue] = useState('')
    const [files, setFiles] = useState([])

    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)
    const [createdTicket, setCreatedTicket] = useState(null)

    const subModuleOptions = useMemo(
        () => (module ? formOptions.subModulesByModule[module] || [] : []),
        [module, formOptions]
    )

    const centerOptions = useMemo(
        () => (region ? formOptions.centersByRegion[region] || [] : []),
        [region, formOptions]
    )

    /*
     * Default Region/Center from the user's real WeConnect profile
     * (User -> User Profile -> Region + Center) as soon as both the
     * profile and the dropdown options have loaded. Only runs while
     * neither field has a value yet, so it never overrides a manual
     * change - and it simply does nothing for a user with no User
     * Profile record (profileRegion/profileCenter are null then).
     */
    useEffect(() => {
        if (optionsLoading || region || center) return
        if (!profileRegion || !formOptions.regions.includes(profileRegion)) return

        setRegion(profileRegion)

        const validCenters = formOptions.centersByRegion[profileRegion] || []
        if (profileCenter && validCenters.includes(profileCenter)) {
            setCenter(profileCenter)
        }
    }, [optionsLoading, profileRegion, profileCenter, formOptions, region, center])

    /*
     * "As Role" is the Lighthouse Role the ticket is being raised
     * under. When the user holds exactly one Lighthouse Role there is
     * nothing to choose, so pre-select it. A user with several roles
     * picks the one this ticket applies to. Never overrides a manual
     * choice, and does nothing for a user with no Lighthouse Role.
     */
    useEffect(() => {
        if (asRole || lighthouseRoles.length !== 1) return
        setAsRole(lighthouseRoles[0])
    }, [lighthouseRoles, asRole])

    const resetForm = () => {
        setSubject('')
        setModule('')
        setSubModule('')
        setPriority('')
        setRegion(
            profileRegion && formOptions.regions.includes(profileRegion) ? profileRegion : ''
        )
        setCenter(
            profileRegion && profileCenter &&
                (formOptions.centersByRegion[profileRegion] || []).includes(profileCenter)
                ? profileCenter
                : ''
        )
        setAsRole(lighthouseRoles.length === 1 ? lighthouseRoles[0] : '')
        setIssue('')
        setFiles([])
        setSubmitError(null)
    }

    /* ============================================================
       FILE ATTACHMENTS (multiple)
    ============================================================ */

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files || [])

        if (!selected.length) return

        const tooLarge = selected.filter((file) => file.size > MAX_FILE_SIZE_BYTES)

        if (tooLarge.length > 0) {
            setSubmitError(
                `${tooLarge.map((f) => f.name).join(', ')} exceed${tooLarge.length === 1 ? 's' : ''} the 10 MB limit and ${tooLarge.length === 1 ? 'was' : 'were'} not added.`
            )
        }

        const accepted = selected.filter((file) => file.size <= MAX_FILE_SIZE_BYTES)

        setFiles((previous) => [...previous, ...accepted])

        e.target.value = ''
    }

    const removeAttachment = (index) => {
        setFiles((previous) => previous.filter((_, i) => i !== index))
    }

    /* ============================================================
       SUBMIT
    ============================================================ */

    const isFormValid =
        subject.trim() &&
        module &&
        subModule &&
        issue.trim() &&
        priority &&
        region &&
        center &&
        asRole

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!isFormValid || submitting) return

        setSubmitting(true)
        setSubmitError(null)

        try {
            const result = await createTicket({
                subject: subject.trim(),
                description: issue.trim(),
                module,
                subModule,
                priority,
                region,
                center,
                raisedBy: currentUser,
                raisedAsLighthouseRole: asRole,
                files,
            })

            setCreatedTicket(result)

            // Refresh the shared ticket list so Dashboard / My Tickets
            // show this ticket immediately, without a manual reload.
            refreshTickets()
        } catch (error) {
            console.error('RaiseTicket: failed to create ticket', error)
            setSubmitError(error.message || 'Unable to raise the ticket. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    /* ============================================================
       SUCCESS SCREEN
    ============================================================ */

    if (createdTicket) {
        return (
            <div className="flex min-h-full items-center justify-center px-5 py-12">

                <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                        <CheckCircle2
                            size={32}
                            className="text-emerald-600"
                        />
                    </div>

                    <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                        Ticket raised successfully
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                        Your issue has been submitted. You can track its progress from My Tickets.
                    </p>

                    <div className="mx-auto mt-6 w-fit rounded-xl bg-slate-50 px-5 py-3">

                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Ticket Number
                        </p>

                        <p className="mt-1 text-base font-semibold text-teal-700">
                            {createdTicket.name}
                        </p>

                    </div>

                    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

                        <button
                            type="button"
                            onClick={onBack}
                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Back to Dashboard
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setCreatedTicket(null)
                                resetForm()
                            }}
                            className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
                        >
                            Raise Another Ticket
                        </button>

                    </div>

                </div>

            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-7 lg:px-9">

            {/* =====================================================
          PAGE INTRO

          No repeated "Raise a Support Ticket" title here - the
          shared Header already shows the page title.
      ====================================================== */}

            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="max-w-xl text-sm leading-relaxed text-slate-500">
                    Tell us what you're facing and provide enough detail for the support team to help you quickly.
                </p>

                <div className="hidden items-center gap-2 rounded-xl bg-teal-50 px-4 py-2.5 sm:flex">

                    <Info
                        size={16}
                        className="text-teal-700"
                    />

                    <span className="text-xs font-medium text-teal-700">
                        Required fields are marked *
                    </span>

                </div>

            </div>

            {optionsError && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{optionsError}</span>
                </div>
            )}

            {submitError && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>{submitError}</span>
                </div>
            )}

            {/* =====================================================
          FORM + SIDE INFORMATION
      ====================================================== */}

            <form onSubmit={handleSubmit}>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_290px]">

                    {/* =================================================
              MAIN FORM
          ================================================== */}

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                        {/* Form heading */}

                        <div className="border-b border-slate-100 px-6 py-5 sm:px-7">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                                    <FileText
                                        size={19}
                                        className="text-teal-700"
                                    />
                                </div>

                                <div>

                                    <h3 className="text-base font-semibold text-slate-900">
                                        Issue Details
                                    </h3>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                        Tell us where you're facing the problem.
                                    </p>

                                </div>

                            </div>

                        </div>

                        <div className="space-y-7 px-6 py-7 sm:px-7">

                            {/* =================================================
                  SUBJECT
              ================================================== */}

                            <div>

                                <label
                                    htmlFor="subject"
                                    className="mb-2.5 block text-sm font-medium text-slate-700"
                                >
                                    Subject <span className="text-rose-500">*</span>
                                </label>

                                <input
                                    id="subject"
                                    type="text"
                                    value={subject}
                                    maxLength={140}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="A short summary of the issue"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
                                />

                            </div>

                            {/* =================================================
                  MODULE
              ================================================== */}

                            <div>

                                <label
                                    htmlFor="module"
                                    className="mb-2.5 block text-sm font-medium text-slate-700"
                                >
                                    Module <span className="text-rose-500">*</span>
                                </label>

                                <div className="relative">

                                    <select
                                        id="module"
                                        value={module}
                                        disabled={optionsLoading}
                                        onChange={(e) => {
                                            setModule(e.target.value)
                                            setSubModule('')
                                        }}
                                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:text-slate-400"
                                    >

                                        <option value="">
                                            {optionsLoading ? 'Loading modules...' : 'Select module'}
                                        </option>

                                        {formOptions.modules.map((item) => (
                                            <option
                                                key={item}
                                                value={item}
                                            >
                                                {item}
                                            </option>
                                        ))}

                                    </select>

                                    <ChevronDown
                                        size={17}
                                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                </div>

                            </div>

                            {/* =================================================
                  SUB MODULE
              ================================================== */}

                            <div>

                                <label
                                    htmlFor="subModule"
                                    className="mb-2.5 block text-sm font-medium text-slate-700"
                                >
                                    Sub Module <span className="text-rose-500">*</span>
                                </label>

                                <div className="relative">

                                    <select
                                        id="subModule"
                                        value={subModule}
                                        disabled={!module}
                                        onChange={(e) => setSubModule(e.target.value)}
                                        className={`h-12 w-full appearance-none rounded-xl border border-slate-200 px-4 pr-11 text-sm outline-none transition ${module
                                                ? 'bg-slate-50 text-slate-700 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10'
                                                : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                            }`}
                                    >

                                        <option value="">
                                            {module
                                                ? 'Select sub module'
                                                : 'Select module first'}
                                        </option>

                                        {subModuleOptions.map((item) => (
                                            <option
                                                key={item}
                                                value={item}
                                            >
                                                {item}
                                            </option>
                                        ))}

                                    </select>

                                    <ChevronDown
                                        size={17}
                                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                </div>

                            </div>

                            {/* =================================================
                  AS ROLE  (Lighthouse Role the ticket is raised as)
              ================================================== */}

                            <div>

                                <label
                                    htmlFor="asRole"
                                    className="mb-2.5 block text-sm font-medium text-slate-700"
                                >
                                    As Role <span className="text-rose-500">*</span>
                                </label>

                                <div className="relative">

                                    <select
                                        id="asRole"
                                        value={asRole}
                                        disabled={lighthouseRoles.length === 0}
                                        onChange={(e) => setAsRole(e.target.value)}
                                        className={`h-12 w-full appearance-none rounded-xl border border-slate-200 px-4 pr-11 text-sm outline-none transition ${lighthouseRoles.length > 0
                                                ? 'bg-slate-50 text-slate-700 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10'
                                                : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                            }`}
                                    >

                                        <option value="">
                                            {lighthouseRoles.length === 0
                                                ? 'No Lighthouse Role on your profile'
                                                : 'Select the role you are raising this as'}
                                        </option>

                                        {lighthouseRoles.map((item) => (
                                            <option
                                                key={item}
                                                value={item}
                                            >
                                                {item}
                                            </option>
                                        ))}

                                    </select>

                                    <ChevronDown
                                        size={17}
                                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                </div>

                                <p className="mt-2 text-xs text-slate-400">
                                    {lighthouseRoles.length === 0
                                        ? 'Your WeConnect profile has no Lighthouse Role assigned - ask an administrator to add one before raising a ticket.'
                                        : 'Pick the Lighthouse Role this ticket is being raised under.'}
                                </p>

                            </div>

                            {/* =================================================
                  REGION / CENTER
              ================================================== */}

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                <div>

                                    <label
                                        htmlFor="region"
                                        className="mb-2.5 block text-sm font-medium text-slate-700"
                                    >
                                        Region <span className="text-rose-500">*</span>
                                    </label>

                                    <div className="relative">

                                        <select
                                            id="region"
                                            value={region}
                                            disabled={optionsLoading}
                                            onChange={(e) => {
                                                setRegion(e.target.value)
                                                setCenter('')
                                            }}
                                            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:text-slate-400"
                                        >

                                            <option value="">
                                                {optionsLoading ? 'Loading regions...' : 'Select region'}
                                            </option>

                                            {formOptions.regions.map((item) => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item}
                                                </option>
                                            ))}

                                        </select>

                                        <ChevronDown
                                            size={17}
                                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                    </div>

                                </div>

                                <div>

                                    <label
                                        htmlFor="center"
                                        className="mb-2.5 block text-sm font-medium text-slate-700"
                                    >
                                        Center <span className="text-rose-500">*</span>
                                    </label>

                                    <div className="relative">

                                        <select
                                            id="center"
                                            value={center}
                                            disabled={!region}
                                            onChange={(e) => setCenter(e.target.value)}
                                            className={`h-12 w-full appearance-none rounded-xl border px-4 pr-11 text-sm outline-none transition ${region
                                                    ? 'border-slate-200 bg-slate-50 text-slate-700 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10'
                                                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                                }`}
                                        >

                                            <option value="">
                                                {region ? 'Select center' : 'Select region first'}
                                            </option>

                                            {centerOptions.map((item) => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item}
                                                </option>
                                            ))}

                                        </select>

                                        <ChevronDown
                                            size={17}
                                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                    </div>

                                </div>

                            </div>

                            {/* =================================================
                  ISSUE DETAILS
              ================================================== */}

                            <div>

                                <div className="mb-2.5 flex items-center justify-between">

                                    <label
                                        htmlFor="issue"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Description <span className="text-rose-500">*</span>
                                    </label>

                                    <span className="text-xs text-slate-400">
                                        {issue.length}/1000
                                    </span>

                                </div>

                                <textarea
                                    id="issue"
                                    value={issue}
                                    maxLength={1000}
                                    onChange={(e) => setIssue(e.target.value)}
                                    rows={7}
                                    placeholder="Describe the issue you're facing. Include what you were trying to do, what happened, and any error message you saw."
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-relaxed text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/10"
                                />

                                <p className="mt-2 text-xs text-slate-400">
                                    Please provide enough information for the support team to understand the issue.
                                </p>

                            </div>

                            {/* =================================================
    PRIORITY
================================================== */}

                            <div>

                                <div className="mb-3">

                                    <label className="block text-sm font-medium text-slate-700">
                                        Priority <span className="text-rose-500">*</span>
                                    </label>

                                    <p className="mt-1 text-xs text-slate-400">
                                        Select the priority of your issue.
                                    </p>

                                </div>

                                <div
                                    role="radiogroup"
                                    aria-label="Priority"
                                    className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                                >

                                    {formOptions.priorities.map((level) => {

                                        const config = PRIORITY_CONFIG[level] || DEFAULT_PRIORITY_CONFIG
                                        const isSelected = priority === level

                                        return (
                                            <button
                                                key={level}
                                                type="button"
                                                role="radio"
                                                aria-checked={isSelected}
                                                onClick={() => setPriority(level)}
                                                className={`relative rounded-xl border-2 px-4 py-3.5 text-left transition ${isSelected
                                                        ? `${config.ring} ring-2 ring-offset-1 ring-offset-white shadow-sm`
                                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >

                                                {/* Selection indicator - unmistakably
                                                    on or off, not just a tinted card */}

                                                <span
                                                    className={`absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full ${isSelected
                                                            ? `${config.badge} text-white`
                                                            : 'bg-white text-slate-300 ring-1 ring-inset ring-slate-300'
                                                        }`}
                                                >
                                                    {isSelected && <Check size={13} strokeWidth={3} />}
                                                </span>

                                                <div className="flex items-center gap-2.5 pr-6">

                                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${config.dot}`} />

                                                    <span
                                                        className={`text-sm ${isSelected ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}
                                                    >
                                                        {level}
                                                    </span>

                                                </div>

                                                <p className="mt-1.5 pl-5 text-xs text-slate-400">
                                                    {config.helper}
                                                </p>

                                            </button>
                                        )
                                    })}

                                </div>

                                {!priority && (
                                    <p className="mt-2.5 text-xs text-amber-600">
                                        Pick one so the support team knows how urgent this is.
                                    </p>
                                )}

                            </div>

                            {/* =================================================
                  ATTACHMENTS (multiple)
              ================================================== */}

                            <div>

                                <label className="mb-2.5 block text-sm font-medium text-slate-700">

                                    Attachments

                                    <span className="ml-1 text-xs font-normal text-slate-400">
                                        (Optional)
                                    </span>

                                </label>

                                <label
                                    htmlFor="attachment"
                                    className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-teal-400 hover:bg-teal-50/40"
                                >

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">

                                        <ImagePlus
                                            size={20}
                                            className="text-slate-400 transition group-hover:text-teal-600"
                                        />

                                    </div>

                                    <p className="mt-3 text-sm font-medium text-slate-600">
                                        Add screenshots or files
                                    </p>

                                    <p className="mt-1.5 text-xs text-slate-400">
                                        PNG, JPG, PDF up to 10 MB each · multiple files allowed
                                    </p>

                                    <input
                                        id="attachment"
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.pdf"
                                        multiple
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                </label>

                                {files.length > 0 && (

                                    <div className="mt-3 space-y-2">

                                        {files.map((file, index) => (

                                            <div
                                                key={`${file.name}-${file.size}-${index}`}
                                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                            >

                                                <div className="flex min-w-0 items-center gap-3">

                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white">

                                                        <Paperclip
                                                            size={17}
                                                            className="text-teal-700"
                                                        />

                                                    </div>

                                                    <div className="min-w-0">

                                                        <p className="truncate text-sm font-medium text-slate-700">
                                                            {file.name}
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-slate-400">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>

                                                    </div>

                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                    aria-label={`Remove ${file.name}`}
                                                >
                                                    <X size={16} />
                                                </button>

                                            </div>
                                        ))}

                                    </div>
                                )}

                            </div>

                        </div>

                        {/* =================================================
                FORM FOOTER
            ================================================== */}

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-7">

                            <button
                                type="button"
                                onClick={onBack}
                                className="h-11 rounded-xl border border-slate-200 px-6 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={!isFormValid || submitting || optionsLoading}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-7 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >

                                {submitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Submit Ticket
                                    </>
                                )}

                            </button>

                        </div>

                    </div>

                    {/* =================================================
              RIGHT INFORMATION
          ================================================== */}

                    <aside>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                                    {initials}
                                </div>

                                <div>

                                    <p className="text-sm font-semibold text-slate-800">
                                        {displayName}
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {roleLabelFor({ isChampion, isWeConnectSupport, isSkillingSupport })}
                                    </p>

                                </div>

                            </div>

                            <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">

                                <div className="flex items-center justify-between">

                                    <span className="text-xs text-slate-400">
                                        Region
                                    </span>

                                    <span className="text-xs font-medium text-slate-600">
                                        {region || 'Not selected yet'}
                                    </span>

                                </div>

                                <div className="flex items-center justify-between">

                                    <span className="text-xs text-slate-400">
                                        Center
                                    </span>

                                    <span className="text-xs font-medium text-slate-600">
                                        {center || 'Not selected yet'}
                                    </span>

                                </div>

                            </div>

                            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">

                                <p className="text-xs leading-relaxed text-slate-400">
                                    {profileRegion
                                        ? "Defaulted from your WeConnect profile - change it above if this ticket is for a different center."
                                        : 'Select the Region and Center this ticket applies to.'}
                                </p>

                            </div>

                        </div>

                        <div className="mt-5 rounded-2xl bg-teal-700 p-6 text-white shadow-sm">

                            <p className="text-sm font-semibold">
                                Help us resolve it faster
                            </p>

                            <p className="mt-2 text-xs leading-relaxed text-teal-50/80">
                                Include the exact steps you followed and attach a screenshot if possible. This helps the support team understand the issue quickly.
                            </p>

                        </div>

                    </aside>

                </div>

            </form>

        </div>
    )
}

export default RaiseTicket
