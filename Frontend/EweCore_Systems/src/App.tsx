import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleBasedRoute } from './routes/RoleBasedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { EmployeesPage } from './features/hr/EmployeesPage';
import { EmployeeDetailsPage } from './features/hr/EmployeeDetailsPage';
import { DepartmentsPage } from './features/hr/DepartmentsPage';
import { LeavesPage } from './features/hr/LeavesPage';
import { AttendancePage } from './features/hr/AttendancePage';
import { ExpensesPage } from './features/finance/ExpensesPage';
import { PettyCashPage } from './features/finance/PettyCashPage';
import { InvoicesPage } from './features/finance/InvoicesPage';
import { ProcurementPage } from './features/finance/ProcurementPage';
import { PayablesPage } from './features/finance/PayablesPage';
import { PayablesCalendar } from './features/finance/PayablesCalendar';
import { ReceivablesPage } from './features/finance/ReceivablesPage';
import { ReceivablesCalendar } from './features/finance/ReceivablesCalendar';
import { AssetManagerPage } from './features/assets/AssetManagerPage';
import { FleetPage } from './features/assets/FleetPage';
import { EmployeeDashboardPage } from './features/dashboard/EmployeeDashboardPage';
import { OnboardingPage } from './features/hr/OnboardingPage';
import { ApprovalsPage } from './features/approvals/ApprovalsPage';
import { LeaveDetailsPage } from './features/hr/LeaveDetailsPage';
import { LeaveConfigurationPage } from './features/hr/LeaveConfigurationPage';
import { LeaveCalendarPage } from './features/hr/LeaveCalendarPage';
import { ApprovalWorkflowConfigPage } from './features/hr/ApprovalWorkflowConfigPage';
import { LeaveSystemSettingsPage } from './features/hr/LeaveSystemSettingsPage';
import { OnboardingDetailsPage } from './features/hr/OnboardingDetailsPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { SettingsPage } from './features/settings/SettingsPage';
import { MyLeavesPage } from './features/employee/MyLeavesPage';
import { MyAttendancePage } from './features/employee/MyAttendancePage';
import { MyRequestsPage } from './features/employee/MyRequestsPage';
import { MyPettyCashPage } from './features/employee/MyPettyCashPage';
import { TeamDirectoryPage } from './features/employee/TeamDirectoryPage';
import { MyAssetsPage } from './features/employee/MyAssetsPage';
import { DocumentsPage } from './features/documents/DocumentsPage';
import { MyDocumentsPage } from './features/documents/MyDocumentsPage';
import { ReportsDashboardPage } from './features/reports/ReportsDashboardPage';
import { ReportViewerPage } from './features/reports/ReportViewerPage';

// Placeholder components for routes
const NotificationsPage = () => <div><h2>Notifications</h2><p>Notifications coming soon...</p></div>;

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#32373c',
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route
            path="/login"
            element={
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthLayout>
                <ForgotPasswordPage />
              </AuthLayout>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route
              path="approvals"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <ApprovalsPage />
                </RoleBasedRoute>
              }
            />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Employee routes - accessible by all roles */}
            <Route path="employee/dashboard" element={<EmployeeDashboardPage />} />
            <Route path="employee/leaves" element={<MyLeavesPage />} />
            <Route path="employee/attendance" element={<MyAttendancePage />} />
            <Route path="employee/requests" element={<MyRequestsPage />} />
            <Route path="employee/petty-cash" element={<MyPettyCashPage />} />
            <Route path="employee/directory" element={<TeamDirectoryPage />} />
            <Route path="employee/assets" element={<MyAssetsPage />} />
            <Route path="employee/documents" element={<MyDocumentsPage />} />

            {/* Document Management routes */}
            <Route
              path="documents/all"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <DocumentsPage />
                </RoleBasedRoute>
              }
            />

            {/* Reports & Analytics routes */}
            <Route
              path="reports/dashboard"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <ReportsDashboardPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="reports/viewer/:id"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <ReportViewerPage />
                </RoleBasedRoute>
              }
            />

            {/* Management/HR routes - restricted to managers and above */}
            <Route
              path="hr/employees"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <EmployeesPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="hr/employees/:id"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <EmployeeDetailsPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="hr/departments"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <DepartmentsPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="hr/leaves"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <LeavesPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="hr/leaves/:id"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <LeaveDetailsPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="hr/leave-configuration"
              element={
                <RoleBasedRoute allowedRoles={['hr_manager', 'ceo', 'admin']}>
                  <LeaveConfigurationPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="hr/leave-calendar"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <LeaveCalendarPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="hr/approval-workflows"
              element={
                <RoleBasedRoute allowedRoles={['hr_manager', 'ceo', 'admin']}>
                  <ApprovalWorkflowConfigPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="hr/leave-settings"
              element={
                <RoleBasedRoute allowedRoles={['hr_manager', 'ceo', 'admin']}>
                  <LeaveSystemSettingsPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="hr/attendance"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <AttendancePage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="hr/onboarding"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <OnboardingPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="hr/onboarding/:id"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <OnboardingDetailsPage />
                </RoleBasedRoute>
              }
            />

            {/* Finance routes - accessible to all managers */}
            <Route
              path="finance/petty-cash"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <PettyCashPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="finance/expenses"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <ExpensesPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="finance/invoices"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <InvoicesPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="finance/procurement"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <ProcurementPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="finance/payables"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <PayablesPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="finance/payables/calendar"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <PayablesCalendar />
                </RoleBasedRoute>
              }
            />
            <Route
              path="finance/receivables"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <ReceivablesPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="finance/receivables/calendar"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <ReceivablesCalendar />
                </RoleBasedRoute>
              }
            />

            {/* Assets routes - restricted to managers and above */}
            <Route
              path="assets/asset-manager"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <AssetManagerPage />
                </RoleBasedRoute>
              }
            />
            <Route
              path="assets/fleet"
              element={
                <RoleBasedRoute allowedRoles={['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin']}>
                  <FleetPage />
                </RoleBasedRoute>
              }
            />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
