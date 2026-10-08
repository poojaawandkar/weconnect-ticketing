import { useAuth } from '../../auth/useAuth'
import { useRegionScope } from '../data/regionScope'

/*
 * The consistent top of every Admin page: the workspace badge, an
 * analytical title + one-line framing question, then the global
 * filter bar. For a Regional Head the badge also carries a subtle
 * scope line ("Region: <their real assigned region>", from
 * useRegionScope()) - no warnings, no restricted styling.
 */
function AdminPageHeader({ title, question, controls, greet = false }) {
  const { displayName, isAdmin, isProgramHead } = useAuth()
  const scope = useRegionScope()

  const workspaceLabel = isAdmin
    ? 'Admin Workspace'
    : isProgramHead
      ? 'Program Head'
      : scope.isRegionHead
        ? 'Region Head Workspace'
        : 'Admin Workspace'

  return (
    <div className="mb-5">
      <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-700">
          {workspaceLabel}
        </span>
        {scope.isRegionHead && (
          <span className="text-[10px] font-medium text-teal-600/80">{scope.label}</span>
        )}
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        {greet ? `${title}, ${displayName}` : title}
      </h2>
      {question && <p className="mt-1 text-sm text-slate-500">{question}</p>}

      {controls && <div className="mt-4">{controls}</div>}
    </div>
  )
}

export default AdminPageHeader
