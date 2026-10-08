/*
 * ================================================================
 * ADMIN ANALYTICS DIMENSIONS  (temporary frontend mock)
 *
 * The lookup lists the Admin filters and charts are built from.
 * Modules / sub-modules come straight from the real
 * src/data/ticketModules.js. Regions/centers are REAL, live Frappe
 * data - see ./regionDimensions.js (getRegions()/getCentersByRegion()/
 * useRegionDimensionsSync()) - themes are still an expanded mock
 * value ONLY so the Admin visualisations have something to show for
 * that one dimension. When the Frappe Analytics API is wired in for
 * themes too, replace that export with the values that API returns -
 * nothing else in src/admin changes.
 * ================================================================
 */

import {
  CENTEROPS_MODULE,
  SKILLING_MODULE,
  MODULE_SUBMODULES,
} from '../../data/ticketModules'
import {
  WECONNECT_SUPPORT_ROLE,
  SKILLING_SUPPORT_ROLE,
} from '../../data/ticketWorkflow'

export const MODULES = [CENTEROPS_MODULE, SKILLING_MODULE]

export const SUBMODULES_BY_MODULE = MODULE_SUBMODULES

export const SUPPORT_TEAMS = [WECONNECT_SUPPORT_ROLE, SKILLING_SUPPORT_ROLE]

export const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low']

export const APPROVAL_TYPES = ['Regional Head', 'Program Head']

/*
 * The Admin views group workflow states into the buckets an
 * executive reads by, rather than the 9 raw states.
 */
export const STATUS_GROUPS = ['Open', 'In Progress', 'Awaiting User', 'Pending Approval', 'Resolved', 'Closed', 'Reopened']

export function statusGroupOf(status) {
  if (!status) return 'Open'
  if (status.includes('In Progress')) return 'In Progress'
  if (status === 'Awaiting User') return 'Awaiting User'
  if (status === 'Pending Approval') return 'Pending Approval'
  if (status === 'Resolved') return 'Resolved'
  if (status === 'Closed') return 'Closed'
  if (status === 'Reopened') return 'Reopened'
  return 'Open'
}

export const OPEN_STATUS_GROUPS = ['Open', 'In Progress', 'Awaiting User', 'Pending Approval', 'Reopened']

/*
 * Recurring "issue themes" - a coarser grouping than sub-module,
 * used for the theme analysis. Mock list.
 */
export const ISSUE_THEMES = [
  'Login & Access',
  'Data Sync Failure',
  'Duplicate Records',
  'Batch Capacity',
  'Attendance Mismatch',
  'Certificate Generation',
  'Report Accuracy',
  'Transfer Delay',
  'Invoicing Discrepancy',
  'Form Validation',
]

// Which themes tend to belong to which module (mock affinity).
export const THEMES_BY_MODULE = {
  [CENTEROPS_MODULE]: [
    'Login & Access',
    'Data Sync Failure',
    'Duplicate Records',
    'Report Accuracy',
    'Transfer Delay',
    'Form Validation',
  ],
  [SKILLING_MODULE]: [
    'Batch Capacity',
    'Attendance Mismatch',
    'Certificate Generation',
    'Invoicing Discrepancy',
    'Form Validation',
    'Data Sync Failure',
  ],
}
