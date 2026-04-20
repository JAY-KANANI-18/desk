import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import { Layout } from "../components/Layout";
import { SettingsIndexRedirect } from "../components/settings/navigation";
import {
  organizationSettingsConfig,
  reportsSettingsConfig,
  userSettingsConfig,
  workspaceSettingsConfig,
} from "../config/settingsNavigation";
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
import ImportContactsPage from "../modules/import/ImportContactsPage";
import ImportJobsPage from "../modules/import/ImportJobsPageResponsive";
import { Dashboard } from "../pages/Dashboard";
import { InboxLayout, InboxPage } from "../pages/Inbox";
import { Organization } from "../pages/Organization";
import { BillingUsage } from "../pages/organization/BillingUsage";
import { GeneralOrgInfo } from "../pages/organization/GeneralOrgInfo";
import { OrgUsersSettings } from "../pages/organization/OrgUsersSettings";
import { WhatsAppFees } from "../pages/organization/WhatsAppFees";
import { WorkspacesManage } from "../pages/organization/WorkspacesManage";
import { ContactsReportSection } from "../pages/reports/ContactsReportSection";
import { ConversationsReportSection } from "../pages/reports/ConversationsReportSection";
import { LifecycleReportSection } from "../pages/reports/LifecycleReportSection";
import { MessagesReportSection } from "../pages/reports/MessagesReportSection";
import { ReportsLayout } from "../pages/reports/ReportsLayout";
import { TemplateGallery } from "../pages/workflow/TemplateGallery";
import { WorkflowCanvas } from "../pages/workflow/WorkflowCanvas";
import { WorkflowList } from "../pages/workflow/WorkflowList";
import { WorkspaceSettings } from "../pages/workspace";
import { UserSettings } from "../pages/workspace/sections/UserSettings";
import { UserSettingsLayout } from "../pages/user";
import { NotificationPreferences } from "../pages/user/sections/NotificationPreferences";
import { WorkspaceUsers } from "../pages/workspace/sections/WorkspaceUsers";
import Lifecycle from "../pages/workspace/sections/Lifecycle";
import { Tags } from "../pages/workspace/sections/Tags";
import { Integrations } from "../pages/workspace/sections/Integrations";
import { WorkspaceGeneralInfo } from "../pages/workspace/sections/GeneralInfo";
import { AIAssist } from "../pages/workspace/sections/AIAssist";
import { AIPrompts } from "../pages/workspace/sections/AIPrompts";
import MetaAdsCallback from "../pages/MetaAdsCallback";
import OnboardingPage from "../pages/GetStartedChecklist";
import { WorkspaceNotFound } from "../pages/WorkspaceNotFound";
import { useGetStarted } from "../context/GetStartedContext";
import { useAuth } from "../context/AuthContext";
import { AiAgentsFeatureRoute } from "../modules/ai-agents/components/AiAgentsFeatureRoute";
import { AiAgentsListPage } from "../modules/ai-agents/pages/AiAgentsListPage";
import { CreateAgentWizardPage } from "../modules/ai-agents/pages/CreateAgentWizardPage";
import { AgentDetailPage } from "../modules/ai-agents/pages/AgentDetailPage";
import { ApprovalQueuePage } from "../modules/ai-agents/pages/ApprovalQueuePage";
import { AiUsagePage } from "../modules/ai-agents/pages/AiUsagePage";

// ... all your existing imports ...

export const WorkspaceRouter = () => {
  const { steps, dismiss, complete } = useGetStarted();
  const { user } = useAuth();
  console.log("user");
  

 
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route
          path="get-started"
          element={
            <OnboardingPage
              completedSteps={steps} // from useOnboarding()
              userName={user?.firstName ?? "there"}
              onDismiss={dismiss}
              onComplete={complete}
            />
          }
        />
        <Route index element={<Navigate to="/inbox" replace />} />
        <Route path="/meta/ads/callback" element={<MetaAdsCallback />} />

        {/* Agents and above */}
        <Route
          path="inbox"
          element={
            <ProtectedRoute ws="ws:messages:view">
              <InboxLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<InboxPage />} />
          <Route path=":conversationId" element={<InboxPage />} />
        </Route>

        {/* Owner + Manager only */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute ws="ws:dashboard:view">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="contacts"
          element={
            <ProtectedRoute ws="ws:contacts:view">
              <Contacts />
            </ProtectedRoute>
          }
        />
        <Route
          path="contacts/import"
          element={
            <ProtectedRoute ws="ws:contacts:manage">
              <ImportContactsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="contacts/import-jobs"
          element={
            <ProtectedRoute ws="ws:contacts:manage">
              <ImportJobsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="broadcast"
          element={
            <ProtectedRoute ws="ws:broadcasts:view">
              <Broadcast />
            </ProtectedRoute>
          }
        />

        <Route
          path="workflows"
          element={
            <ProtectedRoute ws="ws:workflows:view">
              <WorkflowList />
            </ProtectedRoute>
          }
        />
        <Route
          path="workflows/:workflowId"
          element={
            <ProtectedRoute ws="ws:workflows:view">
              <WorkflowCanvas />
            </ProtectedRoute>
          }
        />
        <Route
          path="workflows/templates"
          element={
            <ProtectedRoute ws="ws:workflows:view">
              <TemplateGallery />
            </ProtectedRoute>
          }
        />

        <Route
          path="ai-agents"
          element={
            <ProtectedRoute ws="ws:ai-agents:view">
              <AiAgentsFeatureRoute>
                <AiAgentsListPage />
              </AiAgentsFeatureRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="ai-agents/new"
          element={
            <ProtectedRoute ws="ws:ai-agents:manage">
              <AiAgentsFeatureRoute>
                <CreateAgentWizardPage />
              </AiAgentsFeatureRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="ai-agents/approvals"
          element={
            <ProtectedRoute ws="ws:ai-agents:manage">
              <AiAgentsFeatureRoute>
                <ApprovalQueuePage />
              </AiAgentsFeatureRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="ai-agents/usage"
          element={
            <ProtectedRoute ws="ws:ai-agents:view">
              <AiAgentsFeatureRoute>
                <AiUsagePage />
              </AiAgentsFeatureRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="ai-agents/:agentId"
          element={
            <ProtectedRoute ws="ws:ai-agents:view">
              <AiAgentsFeatureRoute>
                <AgentDetailPage />
              </AiAgentsFeatureRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="reports"
          element={
            <ProtectedRoute ws="ws:reports:view">
              <ReportsLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<SettingsIndexRedirect config={reportsSettingsConfig} />}
          />
          <Route path="messages" element={<MessagesReportSection />} />
          <Route
            path="conversations"
            element={<ConversationsReportSection />}
          />
          <Route path="contacts" element={<ContactsReportSection />} />
          <Route path="lifecycle" element={<LifecycleReportSection />} />
        </Route>

        <Route
          path="channels"
          element={
            <ProtectedRoute ws="ws:settings:view">
              <Channels />
            </ProtectedRoute>
          }
        />
        <Route
          path="channels/connect"
          element={
            <ProtectedRoute ws="ws:channels:manage">
              <ChannelCatalogView />
            </ProtectedRoute>
          }
        />
        <Route
          path="channels/connect/:channelId"
          element={
            <ProtectedRoute ws="ws:channels:manage">
              <ConnectChannelPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="channels/manage/:channelType/:channelId"
          element={
            <ProtectedRoute ws="ws:channels:manage">
              <ManageChannelPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="channels/manage/:channelType/:channelId/:sectionId"
          element={
            <ProtectedRoute ws="ws:channels:manage">
              <ManageChannelPage />
            </ProtectedRoute>
          }
        />

        {/* Workspace settings — owner only for manage, manager for view */}

        <Route
          path="workspace/settings"
          element={
            <ProtectedRoute ws="ws:settings:view">
              <WorkspaceSettings />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<SettingsIndexRedirect config={workspaceSettingsConfig} />}
          />
          <Route path="general-info" element={<WorkspaceGeneralInfo />} />

          <Route
            path="users"
            element={
              <ProtectedRoute org="org:workspaces:view">
                <WorkspaceUsers />
              </ProtectedRoute>
            }
          />
          <Route path="lifecycle" element={<Lifecycle />} />
          <Route path="tags" element={<Tags />} />
          <Route path="ai-assist" element={<AIAssist />} />
          <Route path="ai-prompts" element={<AIPrompts />} />
          <Route
            path="integrations"
            element={
              <ProtectedRoute ws="ws:channels:manage">
                <Integrations />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Profile — everyone */}
        <Route path="user/settings" element={<UserSettingsLayout />}>
          <Route
            index
            element={<SettingsIndexRedirect config={userSettingsConfig} />}
          />
          <Route path="profile" element={<UserSettings />} />
          <Route path="notifications" element={<NotificationPreferences />} />
        </Route>
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        {/* Org routes — requires org permissions */}
        <Route
          path="organization"
          element={
            <ProtectedRoute org="org:settings:view">
              <Organization />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<SettingsIndexRedirect config={organizationSettingsConfig} />}
          />
          <Route path="account-info" element={<GeneralOrgInfo />} />
          <Route
            path="users-settings"
            element={
              <ProtectedRoute org="org:users:view">
                <OrgUsersSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="workspaces"
            element={
              <ProtectedRoute org="org:workspaces:view">
                <WorkspacesManage />
              </ProtectedRoute>
            }
          />
          <Route path="whatsapp-fees" element={<WhatsAppFees />} />
          <Route
            path="billing-usage"
            element={
              <ProtectedRoute org="org:billing:view">
                <BillingUsage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="billing"
          element={
            <ProtectedRoute org="org:billing:view">
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route
          path="billing/plans"
          element={
            <ProtectedRoute org="org:billing:manage">
              <BillingPlans />
            </ProtectedRoute>
          }
        />

        <Route path="sitemap" element={<AppSitemap />} />
        {/* <Route path="*" element={<WorkspaceNotFound />} /> */}
      </Route>
            <Route path="*" element={<Navigate to="/inbox" replace />} />
    </Routes>
  );
};
