import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import { Layout } from "../components/Layout";
import { AppSitemap } from "../pages/AppSitemap";
import { ResetPassword } from "../pages/auth/ResetPassword";
import { Billing } from "../pages/Billing";
import { BillingPlans } from "../pages/BillingPlans";
import { Broadcast } from "../pages/Broadcast";
import { Channels } from "../pages/Channels";
import { ConnectChannelPage } from "../pages/channels/ConnectChannelPage";
import { ManageChannelPage } from "../pages/channels/ManageChannelPage";
import { ChannelCatalogView } from "../pages/ConnectChannel";
import { Contacts } from "../pages/Contacts";
import { Dashboard } from "../pages/Dashboard";
import { InboxLayout, InboxPage } from "../pages/Inbox";
import InstagramCallback from "../pages/InstagramCallback";
import { Organization } from "../pages/Organization";
import { BillingUsage } from "../pages/organization/BillingUsage";
import { GeneralOrgInfo } from "../pages/organization/GeneralOrgInfo";
import { OrgUsersSettings } from "../pages/organization/OrgUsersSettings";
import { WhatsAppFees } from "../pages/organization/WhatsAppFees";
import { WorkspacesManage } from "../pages/organization/WorkspacesManage";
import { Reports } from "../pages/Reports";
import { TemplateGallery } from "../pages/workflow/TemplateGallery";
import { WorkflowCanvas } from "../pages/workflow/WorkflowCanvas";
import { WorkflowList } from "../pages/workflow/WorkflowList";
import { WorkspaceSettings } from "../pages/workspace";
import { UserSettings } from "../pages/workspace/sections/UserSettings";
import { WorkspaceUsers } from "../pages/workspace/sections/WorkspaceUsers";
import Lifecycle from "../pages/workspace/sections/Lifecycle";
import { Tags } from "../pages/workspace/sections/Tags";
import { WorkspaceGeneralInfo } from "../pages/workspace/sections/GeneralInfo";

// ... all your existing imports ...

export const WorkspaceRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/inbox" replace />} />
        <Route path="/meta/instagram/callback" element={<InstagramCallback />} />

        {/* Agents and above */}
        <Route path="inbox" element={
          <ProtectedRoute ws="ws:messages:view">
            <InboxLayout />
          </ProtectedRoute>
        }>
          <Route index element={<InboxPage />} />
          <Route path=":conversationId" element={<InboxPage />} />
        </Route>

        {/* Owner + Manager only */}
        <Route path="dashboard" element={
          <ProtectedRoute ws="ws:dashboard:view">
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="contacts" element={
          <ProtectedRoute ws="ws:contacts:view">
            <Contacts />
          </ProtectedRoute>
        } />

        <Route path="broadcast" element={
          <ProtectedRoute ws="ws:broadcasts:view">
            <Broadcast />
          </ProtectedRoute>
        } />

        <Route path="workflows" element={
          <ProtectedRoute ws="ws:workflows:view">
            <WorkflowList />
          </ProtectedRoute>
        } />
        <Route path="workflows/:workflowId" element={
          <ProtectedRoute ws="ws:workflows:view">
            <WorkflowCanvas />
          </ProtectedRoute>
        } />
        <Route path="workflows/templates" element={
          <ProtectedRoute ws="ws:workflows:view">
            <TemplateGallery />
          </ProtectedRoute>
        } />

        <Route path="reports" element={
          <ProtectedRoute ws="ws:reports:view">
            <Reports />
          </ProtectedRoute>
        } />

        <Route path="channels" element={
          <ProtectedRoute ws="ws:settings:view">
            <Channels />
          </ProtectedRoute>
        } />
        <Route path="channels/connect" element={
          <ProtectedRoute ws="ws:channels:manage">
            <ChannelCatalogView />
          </ProtectedRoute>
        } />
        <Route path="channel/connect/:channelId" element={
          <ProtectedRoute ws="ws:channels:manage">
            <ConnectChannelPage />
          </ProtectedRoute>
        } />
        <Route path="channel/manage/:channelType/:channelId" element={
          <ProtectedRoute ws="ws:channels:manage">
            <ManageChannelPage />
          </ProtectedRoute>
        } />
        <Route path="channel/manage/:channelType/:channelId/:sectionId" element={
          <ProtectedRoute ws="ws:channels:manage">
            <ManageChannelPage />
          </ProtectedRoute>
        } />

        {/* Workspace settings — owner only for manage, manager for view */}
     

         <Route path="workspace/settings" element={
          <ProtectedRoute ws="ws:settings:view">
            <WorkspaceSettings />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="general-info" replace />} />
          <Route path="general-info" element={<WorkspaceGeneralInfo />} />
          <Route path="users-settings" element={
            <ProtectedRoute org="org:users:view">
              <OrgUsersSettings />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute org="org:workspaces:view">
              <WorkspaceUsers />
            </ProtectedRoute>
          } />
          <Route path="lifecycle" element={<Lifecycle />} />
          <Route path="tags" element={
              <Tags />
          } />
        </Route>

        {/* Profile — everyone */}
        <Route path="user/settings" element={<UserSettings />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        {/* Org routes — requires org permissions */}
        <Route path="organization" element={
          <ProtectedRoute org="org:settings:view">
            <Organization />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="account-info" replace />} />
          <Route path="account-info" element={<GeneralOrgInfo />} />
          <Route path="users-settings" element={
            <ProtectedRoute org="org:users:view">
              <OrgUsersSettings />
            </ProtectedRoute>
          } />
          <Route path="workspaces" element={
            <ProtectedRoute org="org:workspaces:view">
              <WorkspacesManage />
            </ProtectedRoute>
          } />
          <Route path="whatsapp-fees" element={<WhatsAppFees />} />
          <Route path="billing-usage" element={
            <ProtectedRoute org="org:billing:view">
              <BillingUsage />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="billing" element={
          <ProtectedRoute org="org:billing:view">
            <Billing />
          </ProtectedRoute>
        } />
        <Route path="billing/plans" element={
          <ProtectedRoute org="org:billing:manage">
            <BillingPlans />
          </ProtectedRoute>
        } />

        <Route path="sitemap" element={<AppSitemap />} />
      </Route>

      <Route path="*" element={<Navigate to="/inbox" replace />} />
    </Routes>
  );
};