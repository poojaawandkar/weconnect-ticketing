import { useEffect, useSyncExternalStore } from 'react'

import { getTicketFormOptions } from '../../api/tickets'

/*
 * ================================================================
 * REGION / CENTER MASTER DATA - REAL FRAPPE BACKED
 *
 * Replaces the old hardcoded REGIONS / CENTERS_BY_REGION mock lists
 * that used to live in dimensions.js. Fetched once from the same
 * weconnect_ticketing.api.get_ticket_form_options endpoint the Raise
 * Ticket form already uses (the real "Region"/"Center" DocTypes),
 * and shared by every Admin page the same way admin/data/mockTickets.js
 * shares the ticket list - one fetch, a small module-level store,
 * useRegionDimensionsSync() for components that need to re-render
 * once it resolves.
 * ================================================================
 */

// A single, stably-referenced snapshot - replaced (never mutated) only
// when the fetch actually resolves, so useSyncExternalStore's
// getSnapshot doesn't return a fresh object on every call (the same
// footgun called out in mockTickets.js).
let snapshot = { regions: [], centersByRegion: {}, allCenters: [] }
let fetchStarted = false
const listeners = new Set()

function notify() {
  listeners.forEach((fn) => fn())
}

async function fetchRegionDimensions() {
  if (fetchStarted) return
  fetchStarted = true

  try {
    const { regions, centersByRegion } = await getTicketFormOptions()
    snapshot = {
      regions: regions || [],
      centersByRegion: centersByRegion || {},
      allCenters: Object.values(centersByRegion || {}).flat(),
    }
  } catch (err) {
    console.error('Admin workspace: failed to load region/center master data', err)
  } finally {
    notify()
  }
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Instant, synchronous reads for plain (non-hook) call sites - empty
// until the fetch resolves, same pattern as mockTickets.js's
// getAdminTickets().
export function getRegions() {
  return snapshot.regions
}

export function getCentersByRegion() {
  return snapshot.centersByRegion
}

export function getAllCenters() {
  return snapshot.allCenters
}

// Starts the fetch (once) and keeps the calling component in sync.
export function useRegionDimensionsSync() {
  useEffect(() => {
    fetchRegionDimensions()
  }, [])
  return useSyncExternalStore(subscribe, () => snapshot)
}
