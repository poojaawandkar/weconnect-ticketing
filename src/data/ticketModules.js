/*
 * ================================================================
 * TICKET MODULES & SUB-MODULES (single source of truth)
 *
 * Mirrors the module / sub-module structure already defined in
 * Frappe. Used for filtering, ticket display and analytics across
 * the Support workspace. Do not add categories that don't exist in
 * the Frappe Ticket DocType.
 * ================================================================
 */

export const CENTEROPS_MODULE = 'CenterOps'
export const SKILLING_MODULE = 'Skilling'

export const SUPPORT_MODULES = [CENTEROPS_MODULE, SKILLING_MODULE]

export const CENTEROPS_SUBMODULES = [
  'Enquiry',
  'Pre-Enrollment',
  'Registration',
  'Batch Management',
  'Approval',
  'Donor Name',
  'Login and Access',
  'Community Data',
  'Data Upload',
  'LH Visit',
  'Duplicate Youth',
  'Analysis',
  'Queries',
  'Counselling',
  'Target',
  'REG Form B',
  'Transfer',
]

export const SKILLING_SUBMODULES = [
  'WFS',
  'Approvals/Follow-up',
  'Issue Management',
  'Attendance',
  'Invoicing',
  'Assessment',
  'Counselling/Recounselling',
]

export const MODULE_SUBMODULES = {
  [CENTEROPS_MODULE]: CENTEROPS_SUBMODULES,
  [SKILLING_MODULE]: SKILLING_SUBMODULES,
}

export function subModulesForModule(moduleName) {
  return MODULE_SUBMODULES[moduleName] || []
}
