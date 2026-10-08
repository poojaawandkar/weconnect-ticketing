import { callMethodForFile } from './frappe'

/*
 * ================================================================
 * REPORTS
 *
 * Backs Reports.jsx's "Generate DOC" / "Download DOC" - the real
 * Frappe report builder (weconnect_ticketing.api.generate_report,
 * see weconnect_ticketing/reports.py), never mock/client-only data.
 * Region/Center/Module/Support Team filters and Regional Head
 * scoping are all enforced server-side; this is just the HTTP call.
 *
 * Returns the generated .docx as a Blob plus the server-chosen
 * filename - Reports.jsx triggers the actual browser download from
 * that Blob (no separate download step against the server).
 * ================================================================
 */

export async function generateReport(params) {
  return callMethodForFile('weconnect_ticketing.api.generate_report', {
    params,
    fallbackFilename: 'WeConnect-Report.docx',
  })
}
