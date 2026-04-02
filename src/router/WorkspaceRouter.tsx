import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AppSitemap } from "../pages/AppSitemap";
import { Billing } from "../pages/Billing";
import { Broadcast } from "../pages/Broadcast";
import { Channels } from "../pages/Channels";
import { Contacts } from "../pages/Contacts";
import { Dashboard } from "../pages/Dashboard";
import { InboxLayout, InboxPage } from "../pages/Inbox";
import { GeneralOrgInfo } from "../pages/organization/GeneralOrgInfo";
import { Reports } from "../pages/Reports";
import { WorkspaceSettings } from "../pages/workspace";
import { ManageChannelPage } from "../pages/channels/ManageChannelPage";
import { ConnectChannelPage } from "../pages/channels/ConnectChannelPage";
import { BillingPlans } from "../pages/BillingPlans";
import { Layout } from "../components/Layout";
import { Organization } from "../pages/Organization";
import { BillingUsage } from "../pages/organization/BillingUsage";
import { WhatsAppFees } from "../pages/organization/WhatsAppFees";
import { WorkspacesManage } from "../pages/organization/WorkspacesManage";
import { OrgUsersSettings } from "../pages/organization/OrgUsersSettings";
import InstagramCallback from "../pages/InstagramCallback";
import { ChannelCatalogView } from "../pages/ConnectChannel";
import { UserSettings } from "../pages/workspace/sections/UserSettings";
import { ResetPassword } from "../pages/auth/ResetPassword";
import { WorkflowCanvas } from "../pages/workflow/WorkflowCanvas";
import { TemplateGallery } from "../pages/workflow/TemplateGallery";
import { WorkflowList } from "../pages/workflow/WorkflowList";

export const WorkspaceRouter = () => {
  return (
    <Routes>
      {/* MAIN APP */}

      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/inbox" replace />} />
        <Route
          path="/meta/instagram/callback"
          element={<InstagramCallback />}
        />

        <Route path="inbox" element={<InboxLayout />}>
          <Route index element={<InboxPage />} />
          <Route path=":conversationId" element={<InboxPage />} />
        </Route>

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="broadcast" element={<Broadcast />} />
        <Route path="workflows" element={<WorkflowList />} />
        <Route path="workflows/:workflowId" element={<WorkflowCanvas />} />
        <Route path="workflows/templates" element={<TemplateGallery />} />
        <Route path="reports" element={<Reports />} />
        <Route path="channels" element={<Channels />} />
        <Route path="user/settings" element={<UserSettings />} />
        <Route path="channels/connect" element={<ChannelCatalogView />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        <Route
          path="channel/connect/:channelId"
          element={<ConnectChannelPage />}
        />
        <Route
          path="channel/manage/:channelType/:channelId"
          element={<ManageChannelPage />}
        />
        <Route
          path="channel/manage/:channelType/:channelId"
          element={<ManageChannelPage />}
        />
        <Route
          path="channel/manage/:channelType/:channelId/:sectionId"
          element={<ManageChannelPage />}
        />

        <Route path="organization" element={<Organization />}>
          <Route index element={<Navigate to="account-info" replace />} />

          <Route path="account-info" element={<GeneralOrgInfo />} />
          <Route path="users-settings" element={<OrgUsersSettings />} />
          {/* <Route path="security" element={<SecuritySection />} /> */}
          <Route path="workspaces" element={<WorkspacesManage />} />
          <Route path="whatsapp-fees" element={<WhatsAppFees />} />
          <Route path="billing-usage" element={<BillingUsage />} />
        </Route>
        <Route path="billing" element={<Billing />} />
        <Route path="billing/plans" element={<BillingPlans />} />
        <Route path="workspace-settings" element={<WorkspaceSettings />} />

        <Route path="sitemap" element={<AppSitemap />} />
      </Route>

      {/* FALLBACK */}

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
