import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login/Login'
import DashboardLayout from './pages/Dashboard/DashboardLayout'
import Overview from './pages/Dashboard/Overview'
import RaiseTicketPage from './pages/Dashboard/RaiseTicketPage'
import MyTicketsPage from './pages/Dashboard/MyTicketsPage'
import TicketDetailsPage from './pages/Dashboard/TicketDetailsPage'
import ChampionDashboard from './pages/Dashboard/ChampionDashboard'
import ChampionAssignedTickets from './pages/Dashboard/ChampionAssignedTickets'
import ChampionAction from './pages/Dashboard/ChampionAction'
import ChampionTickets from './pages/Dashboard/ChampionTickets'
import ChampionTicketDetailsPage from './pages/Dashboard/ChampionTicketDetailsPage'
import SupportDashboard from './pages/Dashboard/SupportDashboard'
import SupportCenterOpsTickets from './pages/Dashboard/SupportCenterOpsTickets'
import SupportSkillingTickets from './pages/Dashboard/SupportSkillingTickets'
import SupportApprovals from './pages/Dashboard/SupportApprovals'
import SupportTicketDetailsPage from './pages/Dashboard/SupportTicketDetailsPage'
import SkillingSupportDashboard from './pages/Dashboard/SkillingSupportDashboard'
import SkillingTicketsPage from './pages/Dashboard/SkillingTicketsPage'
import SkillingTicketDetailsPage from './pages/Dashboard/SkillingTicketDetailsPage'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminTickets from './pages/Admin/AdminTickets'
import AdminTicketDetails from './pages/Admin/AdminTicketDetails'
import SupportPerformance from './pages/Admin/SupportPerformance'
import AdminApprovals from './pages/Admin/AdminApprovals'
import Reports from './pages/Admin/Reports'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import ChampionRoute from './auth/ChampionRoute'
import SupportRoute from './auth/SupportRoute'
import SkillingSupportRoute from './auth/SkillingSupportRoute'
import AdminRoute from './auth/AdminRoute'
import UserRoute from './auth/UserRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        {/* ==================================================
            DASHBOARD (shared Sidebar + Header layout)
        =================================================== */}

        <Route element={<DashboardLayout />}>

          {/* ================================================
              NORMAL USER WORKSPACE

              Support-only users (no Champion role) are
              redirected to /support by UserRoute.
          ================================================= */}

          <Route
            path="/dashboard"
            element={
              <UserRoute>
                <Overview />
              </UserRoute>
            }
          />

          <Route
            path="/raise-ticket"
            element={
              <UserRoute>
                <RaiseTicketPage />
              </UserRoute>
            }
          />

          <Route
            path="/tickets"
            element={
              <UserRoute>
                <MyTicketsPage />
              </UserRoute>
            }
          />

          <Route
            path="/tickets/:ticketId"
            element={
              <UserRoute>
                <TicketDetailsPage />
              </UserRoute>
            }
          />

          {/* ================================================
              CHAMPION WORKSPACE (role-protected)
          ================================================= */}

          <Route
            path="/champion"
            element={
              <ChampionRoute>
                <ChampionDashboard />
              </ChampionRoute>
            }
          />

          <Route
            path="/champion/tickets"
            element={
              <ChampionRoute>
                <ChampionAssignedTickets />
              </ChampionRoute>
            }
          />

          <Route
            path="/champion/tickets/:ticketId"
            element={
              <ChampionRoute>
                <ChampionTicketDetailsPage />
              </ChampionRoute>
            }
          />

          <Route
            path="/champion/action"
            element={
              <ChampionRoute>
                <ChampionAction />
              </ChampionRoute>
            }
          />

          <Route
            path="/champion/all-tickets"
            element={
              <ChampionRoute>
                <ChampionTickets />
              </ChampionRoute>
            }
          />

          {/* ================================================
              WECONNECT SUPPORT WORKSPACE (role-protected)

              - /support              overview
              - /support/centerops    WeConnect Support only
              - /support/skilling     Skilling tickets (read-only
                                      monitoring for WeConnect Support)
              - /support/approvals    WeConnect Support only
              - /support/tickets/:id  ticket detail + actions

              SupportRoute now requires the WeConnect Support role;
              a Skilling-Support-only user is sent to their own
              /skilling-support workspace below.
          ================================================= */}

          <Route
            path="/support"
            element={
              <SupportRoute>
                <SupportDashboard />
              </SupportRoute>
            }
          />

          <Route
            path="/support/centerops"
            element={
              <SupportRoute>
                <SupportCenterOpsTickets />
              </SupportRoute>
            }
          />

          <Route
            path="/support/skilling"
            element={
              <SupportRoute>
                <SupportSkillingTickets />
              </SupportRoute>
            }
          />

          <Route
            path="/support/approvals"
            element={
              <SupportRoute>
                <SupportApprovals />
              </SupportRoute>
            }
          />

          <Route
            path="/support/tickets/:ticketId"
            element={
              <SupportRoute>
                <SupportTicketDetailsPage />
              </SupportRoute>
            }
          />

          {/* ================================================
              SKILLING SUPPORT WORKSPACE (role-protected)

              Additive - layers on top of the normal User
              workspace, the same way the Champion workspace does.

              - /skilling-support             dashboard
              - /skilling-support/tickets      ticket workspace
              - /skilling-support/tickets/:id  ticket detail + actions
          ================================================= */}

          <Route
            path="/skilling-support"
            element={
              <SkillingSupportRoute>
                <SkillingSupportDashboard />
              </SkillingSupportRoute>
            }
          />

          <Route
            path="/skilling-support/tickets"
            element={
              <SkillingSupportRoute>
                <SkillingTicketsPage />
              </SkillingSupportRoute>
            }
          />

          <Route
            path="/skilling-support/tickets/:ticketId"
            element={
              <SkillingSupportRoute>
                <SkillingTicketDetailsPage />
              </SkillingSupportRoute>
            }
          />

          {/* ================================================
              ADMIN WORKSPACE (role-protected, analytical only)

              - /admin                 overview (status, region, center, module, issues)
              - /admin/performance     support performance
              - /admin/approvals       approval analysis
              - /admin/reports         DOC report builder
              - /admin/tickets         drill-down ticket list
          ================================================= */}

          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
          <Route path="/admin/tickets/:ticketId" element={<AdminRoute><AdminTicketDetails /></AdminRoute>} />
          <Route path="/admin/performance" element={<AdminRoute><SupportPerformance /></AdminRoute>} />
          <Route path="/admin/approvals" element={<AdminRoute><AdminApprovals /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />

          {/* ================================================
              ACCOUNT (role-agnostic - every logged-in user,
              regardless of workspace, gets Notifications/Profile
              inside the same Sidebar + Header shell)
          ================================================= */}

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

        </Route>

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App
