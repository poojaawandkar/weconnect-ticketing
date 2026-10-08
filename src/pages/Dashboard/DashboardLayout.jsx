import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from '../../components/Dashboard/Sidebar'
import Header from '../../components/Dashboard/Header'

/*
 * ================================================================
 * DASHBOARD LAYOUT
 *
 * Shared Sidebar + Header shell for every authenticated route -
 * the User, Champion and Support workspaces, plus the role-agnostic
 * Notifications/Profile pages. The active page renders through
 * <Outlet />; Header reads the current route itself to show the
 * right page title/icon and back control.
 * ================================================================
 */

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">

        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>

    </div>
  )
}

export default DashboardLayout
