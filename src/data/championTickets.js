/*
 * ================================================================
 * TICKET DATA (DUMMY SEED)
 *
 * Static seed data shared by every role-based workspace (Champion,
 * WeConnect Support, Skilling Support) - separate from
 * src/data/tickets.js (the regular User's own tickets). These
 * workspaces look at tickets raised by other users across the
 * region, not their own ticket history.
 *
 * Field notes (every one of these stands in for a real Frappe
 * Ticket field and is read as data, never computed from another
 * field by frontend code, so swapping this seed for an API
 * response needs no logic changes):
 *
 *   module        : 'CenterOps' | 'Skilling'
 *   subModule     : one of the values in src/data/ticketModules.js
 *   status        : exactly one of the 9 workflow states in
 *                   src/data/ticketWorkflow.js
 *   supportTeam   : which Support team the ticket is routed to
 *                   ('WeConnect Support' | 'Skilling Support'), or
 *                   null when it is still Champion-only / unrouted
 *   champion      : the Champion currently / previously involved,
 *                   or null. Placeholder label, not a real name -
 *                   Frappe will supply the linked Champion user.
 *   requestType   : 'Issue' (default) | 'Data Request'. Data
 *                   Requests belong to WeConnect Support and are
 *                   surfaced as a filtered view, not a separate
 *                   ticket system.
 *   region/center : used for routing (Regional Head lookup),
 *                   filtering and analytics.
 *
 * This array only seeds the initial state of TicketsProvider
 * (src/tickets/) - once the app is running, tickets are
 * read/mutated through that provider (via useTickets()).
 *
 * Not wired to Frappe yet.
 * ================================================================
 */

/*
 * A few seed tickets below are dated "today" (computed at load) so
 * both support dashboards' "Requires Attention" queues - which only
 * show tickets raised today - are demonstrable with the dummy data.
 * Everything else keeps its fixed historical date.
 */
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]
const _now = new Date()
const TODAY = `${String(_now.getDate()).padStart(2, '0')} ${MONTHS_SHORT[_now.getMonth()]} ${_now.getFullYear()}`

export const seedTickets = [
  {
    id: 'WC-2045',
    module: 'CenterOps',
    subModule: 'Login and Access',
    issue: 'Center Head cannot log in this morning after an overnight sync.',
    title: 'Center Head cannot log in this morning after an overnight sync.',
    description:
      'Following last night’s scheduled sync, the Center Head is being rejected at login with "account not found".',
    region: 'Nagpur',
    center: 'Nagpur Central',
    requesterRole: 'Center Head',
    status: 'Open',
    priority: 'Urgent',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Issue',
    createdDate: TODAY,
    updatedDate: TODAY,
  },
  {
    id: 'WC-2044',
    module: 'Skilling',
    subModule: 'Attendance',
    issue: 'Attendance register not opening for today’s morning batch.',
    title: 'Attendance register not opening for today’s morning batch.',
    description:
      'The trainer cannot open the attendance register for the morning batch today - the page shows a spinner and never loads.',
    region: 'Pune',
    center: 'Wagholi Center',
    requesterRole: 'WeConnect User',
    status: 'Open',
    priority: 'Urgent',
    supportTeam: 'Skilling Support',
    champion: null,
    requestType: 'Issue',
    createdDate: TODAY,
    updatedDate: TODAY,
  },
  {
    id: 'WC-2043',
    module: 'Skilling',
    subModule: 'Assessment',
    issue: 'Assessment scores entered today are not saving.',
    title: 'Assessment scores entered today are not saving.',
    description:
      'Scores entered for the batch assessment this morning disappear after saving and reloading the page.',
    region: 'Nashik',
    center: 'Nashik Road Center',
    requesterRole: 'WeConnect User',
    status: 'Skilling Support In Progress',
    priority: 'High',
    supportTeam: 'Skilling Support',
    champion: null,
    requestType: 'Issue',
    createdDate: TODAY,
    updatedDate: TODAY,
  },
  {
    id: 'WC-2042',
    module: 'Skilling',
    subModule: 'Issue Management',
    issue: 'Duplicate-youth check needs a data fix Skilling Support cannot do.',
    title: 'Duplicate-youth check needs a data fix Skilling Support cannot do.',
    description:
      'Two youth records were wrongly linked as duplicates; unlinking them needs a backend data correction, so Skilling Support has forwarded it to WeConnect Support.',
    region: 'Pune',
    center: 'Wagholi Center',
    requesterRole: 'WeConnect User',
    status: 'WeConnect Support In Progress',
    priority: 'High',
    supportTeam: 'WeConnect Support',
    forwardedFrom: 'Skilling Support',
    forwardReason: 'Needs a backend data correction we cannot run.',
    forwardedAt: '2026-08-24T11:00:00+05:30',
    champion: null,
    requestType: 'Issue',
    createdDate: '23 Aug 2026',
    updatedDate: '24 Aug 2026',
  },
  {
    id: 'WC-2041',
    module: 'Skilling',
    subModule: 'Batch Management',
    issue: 'Batch capacity mismatch is blocking youth approvals.',
    title: 'Batch capacity mismatch is blocking youth approvals.',
    description:
      'The batch has reached its configured limit even though there appears to be available capacity, so youth approvals are being rejected.',
    region: 'Pune',
    center: 'Wagholi Center',
    requesterRole: 'WeConnect User',
    status: 'Open',
    priority: 'Urgent',
    supportTeam: 'Skilling Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '25 Aug 2026',
    updatedDate: '25 Aug 2026',
  },
  {
    id: 'WC-2039',
    module: 'CenterOps',
    subModule: 'Login and Access',
    issue: 'Center Head unable to access CenterOps after password reset.',
    title: 'Center Head unable to access CenterOps after password reset.',
    description:
      'After resetting their password, the Center Head is unable to log into CenterOps - the login page just reloads without an error.',
    region: 'Pune',
    center: 'Hadapsar Center',
    requesterRole: 'Center Head',
    status: 'Open',
    priority: 'High',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '25 Aug 2026',
    updatedDate: '25 Aug 2026',
  },
  {
    id: 'WC-2038',
    module: 'CenterOps',
    subModule: 'Data Upload',
    issue: 'Community data upload for August needs to be re-run.',
    title: 'Community data upload for August needs to be re-run.',
    description:
      'The August community data upload partially failed and the affected rows need to be re-processed against the current master list.',
    region: 'Nashik',
    center: 'Nashik Road Center',
    requesterRole: 'Center Head',
    status: 'Open',
    priority: 'Medium',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Data Request',
    createdDate: '26 Aug 2026',
    updatedDate: '26 Aug 2026',
  },
  {
    id: 'WC-2036',
    module: 'Skilling',
    subModule: 'Issue Management',
    issue: 'Registration form rejects valid Aadhaar numbers for two youth.',
    title: 'Registration form rejects valid Aadhaar numbers for two youth.',
    description:
      'Two youth with valid Aadhaar numbers are unable to complete registration - the form flags them as invalid on submission.',
    region: 'Nashik',
    center: 'Nashik Road Center',
    requesterRole: 'WeConnect User',
    status: 'Champion In Progress',
    priority: 'High',
    supportTeam: null,
    champion: 'Champion — Nashik',
    requestType: 'Issue',
    createdDate: '24 Aug 2026',
    updatedDate: '25 Aug 2026',
    conversation: [
      {
        id: 1,
        sender: 'Champion — Nashik',
        role: 'Champion',
        initials: 'CN',
        type: 'support',
        time: '25 Aug 2026 · 09:40 AM',
        timestamp: '2026-08-25T09:40:00+05:30',
        message: 'Looking into this now - checking the Aadhaar validation rule.',
        attachments: [],
      },
    ],
  },
  {
    id: 'WC-2033',
    module: 'CenterOps',
    subModule: 'Community Data',
    issue: 'New center not appearing in the CenterOps center list.',
    title: 'New center not appearing in the CenterOps center list.',
    description:
      "A newly onboarded center was created last week but still doesn't show up in the CenterOps center selection list.",
    region: 'Nagpur',
    center: 'Nagpur Central',
    requesterRole: 'Center Head',
    status: 'Open',
    priority: 'Medium',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '23 Aug 2026',
    updatedDate: '23 Aug 2026',
  },
  {
    id: 'WC-2030',
    module: 'Skilling',
    subModule: 'Attendance',
    issue: 'Duplicate youth profiles merged incorrectly after import.',
    title: 'Duplicate youth profiles merged incorrectly after import.',
    description:
      'After the last bulk import, several duplicate youth profiles were auto-merged incorrectly, mixing attendance records between two different youth.',
    region: 'Pune',
    center: 'Wagholi Center',
    requesterRole: 'WeConnect User',
    status: 'Awaiting User',
    priority: 'Medium',
    supportTeam: null,
    champion: 'Champion — Pune',
    requestType: 'Issue',
    createdDate: '22 Aug 2026',
    updatedDate: '24 Aug 2026',
    conversation: [
      {
        id: 1,
        sender: 'Champion — Pune',
        role: 'Champion',
        initials: 'CP',
        type: 'support',
        time: '24 Aug 2026 · 11:00 AM',
        timestamp: '2026-08-24T11:00:00+05:30',
        message: 'Could you confirm the two youth IDs affected so we can separate their records?',
        attachments: [],
      },
    ],
  },
  {
    id: 'WC-2029',
    module: 'Skilling',
    subModule: 'Invoicing',
    issue: 'Invoice batch escalated by Champion for Skilling Support review.',
    title: 'Invoice batch escalated by Champion for Skilling Support review.',
    description:
      'The Champion could not reconcile an invoicing batch and has forwarded it to Skilling Support with their notes attached.',
    region: 'Nagpur',
    center: 'Nagpur Central',
    requesterRole: 'WeConnect User',
    status: 'Skilling Support In Progress',
    priority: 'High',
    supportTeam: 'Skilling Support',
    champion: 'Champion — Nagpur',
    requestType: 'Issue',
    createdDate: '21 Aug 2026',
    updatedDate: '25 Aug 2026',
  },
  {
    id: 'WC-2028',
    module: 'CenterOps',
    subModule: 'Login and Access',
    issue: 'Center staff account locked out after multiple failed logins.',
    title: 'Center staff account locked out after multiple failed logins.',
    description:
      'A center staff account got locked out after several failed login attempts and needs to be unlocked.',
    region: 'Nashik',
    center: 'Nashik Road Center',
    requesterRole: 'WeConnect User',
    status: 'Champion In Progress',
    priority: 'Low',
    supportTeam: null,
    champion: 'Champion — Nashik',
    requestType: 'Issue',
    createdDate: '21 Aug 2026',
    updatedDate: '22 Aug 2026',
  },
  {
    id: 'WC-2026',
    module: 'Skilling',
    subModule: 'Issue Management',
    issue: 'Youth registration blocked by duplicate mobile number check.',
    title: 'Youth registration blocked by duplicate mobile number check.',
    description:
      'A family sharing one mobile number across two youth registrations is being blocked by the duplicate-number check.',
    region: 'Nagpur',
    center: 'Nagpur Central',
    requesterRole: 'WeConnect User',
    status: 'Reopened',
    priority: 'High',
    supportTeam: 'Skilling Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '20 Aug 2026',
    updatedDate: '25 Aug 2026',
    resolution:
      'Advised using a secondary contact number; requester reports the issue is still occurring.',
    resolvedAt: '2026-08-21T10:00:00+05:30',
  },
  {
    id: 'WC-2024',
    module: 'Skilling',
    subModule: 'Attendance',
    issue: 'Batch attendance not syncing for the last two sessions.',
    title: 'Batch attendance not syncing for the last two sessions.',
    description:
      "Attendance marked for the last two sessions isn't reflecting in the batch summary report.",
    region: 'Nagpur',
    center: 'Nagpur Central',
    requesterRole: 'WeConnect User',
    status: 'Resolved',
    priority: 'Medium',
    supportTeam: 'Skilling Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '19 Aug 2026',
    updatedDate: '20 Aug 2026',
    resolution:
      'A sync job had stalled for that batch; it was manually re-run and attendance now reflects correctly.',
    resolvedAt: '2026-08-20T10:00:00+05:30',
  },
  {
    id: 'WC-2022',
    module: 'CenterOps',
    subModule: 'Transfer',
    issue: 'Center transfer request stuck pending sign-off.',
    title: 'Center transfer request stuck pending sign-off.',
    description:
      'A youth center-transfer request has been awaiting sign-off for over a week.',
    region: 'Pune',
    center: 'Hadapsar Center',
    requesterRole: 'Center Head',
    status: 'Pending Approval',
    priority: 'Medium',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '18 Aug 2026',
    updatedDate: '19 Aug 2026',
    approvalRequest: {
      approverType: 'Regional Head',
      approver: 'Regional Head — Pune',
      region: 'Pune',
      status: 'Pending',
      requestedAt: '2026-08-19T12:00:00+05:30',
    },
  },

  /*
   * ------------------------------------------------------------
   * Approval pipeline seed (WeConnect Support only)
   *
   * Enough tickets carrying an `approvalRequest` for the Approvals
   * page to be reviewable: 6 sent in total, 3 pending (Regional
   * Head 2, Program Head 1), 2 approved, 1 rejected. `approver`
   * strings are role+scope labels, never real people.
   * ------------------------------------------------------------
   */
  {
    id: 'WC-2021',
    module: 'CenterOps',
    subModule: 'Approval',
    issue: 'Donor name change needs sign-off before the report goes out.',
    title: 'Donor name change needs sign-off before the report goes out.',
    description:
      'A donor has requested their display name be corrected across all enrollment records; this needs approval before the quarterly report is generated.',
    region: 'Nashik',
    center: 'Nashik Road Center',
    requesterRole: 'Center Head',
    status: 'Pending Approval',
    priority: 'High',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '18 Aug 2026',
    updatedDate: '20 Aug 2026',
    approvalRequest: {
      approverType: 'Regional Head',
      approver: 'Regional Head — Nashik',
      region: 'Nashik',
      status: 'Pending',
      requestedAt: '2026-08-20T09:30:00+05:30',
    },
  },
  {
    id: 'WC-2020',
    module: 'Skilling',
    subModule: 'Invoicing',
    issue: 'Out-of-cycle invoice adjustment needs Program Head approval.',
    title: 'Out-of-cycle invoice adjustment needs Program Head approval.',
    description:
      'A partner has requested an invoice adjustment outside the normal billing cycle; per policy this requires Program Head approval.',
    region: 'Nagpur',
    center: 'Nagpur Central',
    requesterRole: 'WeConnect User',
    status: 'Pending Approval',
    priority: 'Medium',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '17 Aug 2026',
    updatedDate: '19 Aug 2026',
    approvalRequest: {
      approverType: 'Program Head',
      approver: 'Program Head',
      region: null,
      status: 'Pending',
      requestedAt: '2026-08-19T15:00:00+05:30',
    },
  },
  {
    id: 'WC-2018',
    module: 'CenterOps',
    subModule: 'Transfer',
    issue: 'Bulk center transfer for 12 youth after a center merged.',
    title: 'Bulk center transfer for 12 youth after a center merged.',
    description:
      'Twelve youth need to be moved to the nearest active center after their center was merged; approved by the Regional Head.',
    region: 'Pune',
    center: 'Hadapsar Center',
    requesterRole: 'Center Head',
    status: 'WeConnect Support In Progress',
    priority: 'Medium',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '14 Aug 2026',
    updatedDate: '17 Aug 2026',
    approvalRequest: {
      approverType: 'Regional Head',
      approver: 'Regional Head — Pune',
      region: 'Pune',
      status: 'Approved',
      requestedAt: '2026-08-15T10:00:00+05:30',
    },
  },
  {
    id: 'WC-2014',
    module: 'Skilling',
    subModule: 'Assessment',
    issue: 'Re-open a finalised assessment window for one batch.',
    title: 'Re-open a finalised assessment window for one batch.',
    description:
      'A batch missed the assessment window due to a trainer absence; Program Head approved re-opening it for two days.',
    region: 'Nashik',
    center: 'Nashik Road Center',
    requesterRole: 'WeConnect User',
    status: 'Resolved',
    priority: 'Medium',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '12 Aug 2026',
    updatedDate: '16 Aug 2026',
    resolution:
      'Assessment window re-opened for the approved two days; the batch completed its assessments and the window was closed again.',
    resolvedAt: '2026-08-16T11:00:00+05:30',
    approvalRequest: {
      approverType: 'Program Head',
      approver: 'Program Head',
      region: null,
      status: 'Approved',
      requestedAt: '2026-08-13T09:00:00+05:30',
    },
  },
  {
    id: 'WC-2012',
    module: 'CenterOps',
    subModule: 'Community Data',
    issue: 'Delete duplicate community records created by a bad import.',
    title: 'Delete duplicate community records created by a bad import.',
    description:
      'A faulty import created ~40 duplicate community records; a hard delete was requested but the Regional Head rejected it in favour of a merge.',
    region: 'Nagpur',
    center: 'Nagpur Central',
    requesterRole: 'Center Head',
    status: 'WeConnect Support In Progress',
    priority: 'Low',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '11 Aug 2026',
    updatedDate: '15 Aug 2026',
    approvalRequest: {
      approverType: 'Regional Head',
      approver: 'Regional Head — Nagpur',
      region: 'Nagpur',
      status: 'Rejected',
      requestedAt: '2026-08-12T14:00:00+05:30',
    },
  },
  {
    id: 'WC-2019',
    module: 'CenterOps',
    subModule: 'Analysis',
    issue: 'Center performance report showing stale enrollment numbers.',
    title: 'Center performance report showing stale enrollment numbers.',
    description:
      'The center performance report is showing enrollment numbers from two weeks ago instead of current figures.',
    region: 'Pune',
    center: 'Hadapsar Center',
    requesterRole: 'Center Head',
    status: 'Resolved',
    priority: 'Low',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Data Request',
    createdDate: '17 Aug 2026',
    updatedDate: '18 Aug 2026',
    resolution:
      'The report cache was refreshed and now reflects current enrollment numbers.',
    resolvedAt: '2026-08-18T09:30:00+05:30',
  },
  {
    id: 'WC-2017',
    module: 'CenterOps',
    subModule: 'Login and Access',
    issue: 'Bulk user import failing for CenterOps admin accounts.',
    title: 'Bulk user import failing for CenterOps admin accounts.',
    description:
      'The bulk import for new CenterOps admin accounts is failing partway through, routed to WeConnect Support.',
    region: 'Nashik',
    center: 'Nashik Road Center',
    requesterRole: 'Center Head',
    status: 'WeConnect Support In Progress',
    priority: 'High',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '16 Aug 2026',
    updatedDate: '17 Aug 2026',
  },
  {
    id: 'WC-2016',
    module: 'Skilling',
    subModule: 'Assessment',
    issue: 'Skilling certificate generation failing for a full batch.',
    title: 'Skilling certificate generation failing for a full batch.',
    description:
      'Certificate generation is failing for an entire completed batch, routed to Skilling Support.',
    region: 'Nagpur',
    center: 'Nagpur Central',
    requesterRole: 'WeConnect User',
    status: 'Skilling Support In Progress',
    priority: 'Medium',
    supportTeam: 'Skilling Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '15 Aug 2026',
    updatedDate: '16 Aug 2026',
    // Support asked, the requester answered - so the ticket is back
    // with support (newest message is from the requester). This is
    // what the "Replied" tab and the dashboard reply indicator show.
    conversation: [
      {
        id: 1,
        sender: 'Skilling Support',
        role: 'Skilling Support',
        initials: 'SS',
        type: 'support',
        time: '16 Aug 2026 · 10:10 AM',
        timestamp: '2026-08-16T10:10:00+05:30',
        message: 'Could you share the batch ID and a screenshot of the error message?',
        attachments: [],
      },
      {
        id: 2,
        sender: 'Requester',
        role: 'WeConnect User',
        initials: 'WU',
        type: 'user',
        time: '16 Aug 2026 · 02:35 PM',
        timestamp: '2026-08-16T14:35:00+05:30',
        message:
          'Batch ID is BATCH-4471. The error says "template not found". It was working last week.',
        attachments: [],
      },
    ],
  },
  {
    id: 'WC-2015',
    module: 'Skilling',
    subModule: 'Approvals/Follow-up',
    issue: 'Application form stuck in draft state after submission.',
    title: 'Application form stuck in draft state after submission.',
    description:
      'The application form remained in draft state even after the youth completed and submitted it.',
    region: 'Nashik',
    center: 'Nashik Road Center',
    requesterRole: 'WeConnect User',
    status: 'Closed',
    priority: 'Low',
    supportTeam: 'Skilling Support',
    champion: 'Champion — Nashik',
    requestType: 'Issue',
    createdDate: '14 Aug 2026',
    updatedDate: '15 Aug 2026',
    resolution:
      'A form validation rule was blocking final submission; corrected, and the application now submits normally.',
    resolvedAt: '2026-08-15T09:00:00+05:30',
  },
  {
    id: 'WC-2013',
    module: 'CenterOps',
    subModule: 'Queries',
    issue: 'Donor-wise enrollment extract requested for quarterly review.',
    title: 'Donor-wise enrollment extract requested for quarterly review.',
    description:
      'The regional team needs a donor-wise enrollment extract for the last quarter for their review deck.',
    region: 'Nagpur',
    center: 'Nagpur Central',
    requesterRole: 'Center Head',
    status: 'WeConnect Support In Progress',
    priority: 'Medium',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Data Request',
    createdDate: '20 Aug 2026',
    updatedDate: '24 Aug 2026',
  },
  {
    id: 'WC-2011',
    module: 'CenterOps',
    subModule: 'Login and Access',
    issue: 'Center Head locked out of CenterOps for over 24 hours.',
    title: 'Center Head locked out of CenterOps for over 24 hours.',
    description:
      'Center Head account was locked out of CenterOps for over 24 hours before access was restored.',
    region: 'Nagpur',
    center: 'Nagpur Central',
    requesterRole: 'Center Head',
    status: 'Closed',
    priority: 'Medium',
    supportTeam: 'WeConnect Support',
    champion: null,
    requestType: 'Issue',
    createdDate: '11 Aug 2026',
    updatedDate: '12 Aug 2026',
    resolution:
      'Account lockout was cleared and access restored; auto-closed after the resolution window passed.',
    resolvedAt: '2026-08-12T09:00:00+05:30',
  },
]

export const PRIORITY_ORDER = ['Urgent', 'High', 'Medium', 'Low']

export function sortByPriority(list) {
  return [...list].sort(
    (a, b) =>
      PRIORITY_ORDER.indexOf(a.priority) -
      PRIORITY_ORDER.indexOf(b.priority)
  )
}
