import { useMemo } from 'react'

import { useAuth } from '../../auth/useAuth'

/*
 * ================================================================
 * REGION HEAD SCOPE
 *
 * currentUser -> assignedRegion(s) -> (allowedCenters) -> allowedTickets
 *
 * A "Regional Head" sees the SAME analytical workspace as Admin /
 * Program Head, but every screen is restricted to the region(s)
 * assigned to them. This hook is the single source of that scope:
 *
 *   { isRegionHead, regions, single, label }
 *
 * `regions` is null for Admin / Program Head (no restriction) and a
 * string[] for a Regional Head - the REAL region(s) from their
 * active "Regional Head" DocType record(s) (useAuth().regionalHeadRegions,
 * fetched via weconnect_ticketing.api.get_current_regional_head_regions).
 * Admin / Program Head win if the user somehow holds several of
 * these roles.
 *
 * There is no hardcoded/default region here: a Regional Head with no
 * active "Regional Head" record (or one whose region doesn't resolve)
 * gets an EMPTY regions[] and sees no tickets, rather than silently
 * falling back to some other region's data.
 * ================================================================
 */

export function useRegionScope() {
  const { isAdmin, isProgramHead, isRegionalHead, regionalHeadRegions } = useAuth()

  return useMemo(() => {
    if (!isRegionalHead || isAdmin || isProgramHead) {
      return { isRegionHead: false, regions: null, single: false, label: null }
    }

    const regions = regionalHeadRegions || []
    const single = regions.length === 1

    return {
      isRegionHead: true,
      regions,
      single,
      label:
        regions.length === 0
          ? 'No region assigned'
          : single
            ? `Region: ${regions[0]}`
            : 'Regions: Assigned regions',
    }
  }, [isAdmin, isProgramHead, isRegionalHead, regionalHeadRegions])
}
