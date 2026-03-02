import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthorizationProvider } from './context/AuthorizationContext';
import { NotificationProvider } from './context/NotificationContext';
import { CallProvider } from './context/CallContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { ResetPassword } from './pages/auth/ResetPassword';
import { InboxLayout, InboxPage } from './pages/Inbox';
import { Contacts } from './pages/Contacts';
import { Broadcast } from './pages/Broadcast';
import { Workflows } from './pages/Workflows';
import { Reports } from './pages/Reports';
import { Channels } from './pages/Channels';
import { ConnectChannelPage } from './pages/channels/ConnectChannelPage';
import { ManageChannelPage } from './pages/channels/ManageChannelPage';
import { Team } from './pages/Team';
import { Organization } from './pages/Organization';
import { Billing } from './pages/Billing';
import { BillingPlans } from './pages/BillingPlans';
import { Dashboard } from './pages/Dashboard';
import { WorkspaceSettings } from './pages/WorkspaceSettings';
import { AppSitemap } from './pages/AppSitemap';

export const App = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AuthorizationProvider>
          <CallProvider>
          <Router>
            <Routes>
              {/* ── Public auth routes ─────────────────────────────────── */}
              <Route path="/auth/login"          element={<Login />} />
              <Route path="/auth/signup"         element={<SignUp />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/verify-email"   element={<VerifyEmail />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />

              {/* ── Protected app routes ───────────────────────────────── */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/inbox" replace />} />

                {/* All roles */}
                <Route path="inbox" element={<ProtectedRoute permission="inbox.view"><InboxLayout /></ProtectedRoute>}>
                  <Route index element={<InboxPage />} />
                  <Route path=":conversationId" element={<InboxPage />} />
                </Route>
                <Route path="dashboard"  element={<ProtectedRoute permission="reports.view"><Dashboard /></ProtectedRoute>} />
                <Route path="contacts"   element={<ProtectedRoute permission="contacts.view"><Contacts /></ProtectedRoute>} />
                <Route path="broadcast"  element={<ProtectedRoute permission="broadcast.view"><Broadcast /></ProtectedRoute>} />
                <Route path="workflows"  element={<ProtectedRoute permission="workflows.view"><Workflows /></ProtectedRoute>} />
                <Route path="reports"    element={<ProtectedRoute permission="reports.view"><Reports /></ProtectedRoute>} />
                <Route path="channels"   element={<ProtectedRoute permission="channels.view"><Channels /></ProtectedRoute>} />
                <Route path="channel/connect/:channelId" element={<ProtectedRoute permission="channels.view"><ConnectChannelPage /></ProtectedRoute>} />
                <Route path="channel/manage/:channelType/:channelId"  element={<ProtectedRoute permission="channels.view"><ManageChannelPage /></ProtectedRoute>} />
                <Route path="team"       element={<ProtectedRoute permission="team.view"><Team /></ProtectedRoute>} />

                {/* Admin / owner only */}
                <Route path="organization"        element={<ProtectedRoute permission="workspace.settings"><Organization /></ProtectedRoute>} />
                <Route path="billing"             element={<ProtectedRoute permission="billing.view"><Billing /></ProtectedRoute>} />
                <Route path="billing/plans"       element={<ProtectedRoute permission="billing.view"><BillingPlans /></ProtectedRoute>} />
                <Route path="workspace-settings"  element={<ProtectedRoute permission="workspace.settings"><WorkspaceSettings /></ProtectedRoute>} />
                <Route path="sitemap"             element={<AppSitemap />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Routes>
          </Router>
          </CallProvider>
        </AuthorizationProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};
