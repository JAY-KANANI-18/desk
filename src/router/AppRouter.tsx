import { Layout } from "lucide-react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { PublicOnlyRoute } from "../components/PublicOnlyRoute";
import { AppSitemap } from "../pages/AppSitemap";
import { ForgotPassword } from "../pages/auth/ForgotPassword";
import { Login } from "../pages/auth/Login";
import { ResetPassword } from "../pages/auth/ResetPassword";
import { SignUp } from "../pages/auth/SignUp";
import { VerifyEmail } from "../pages/auth/VerifyEmail";
import { Billing } from "../pages/Billing";
import { Broadcast } from "../pages/Broadcast";
import { Channels } from "../pages/Channels";
import { Contacts } from "../pages/Contacts";
import { Dashboard } from "../pages/Dashboard";
import { InboxLayout, InboxPage } from "../pages/Inbox";
import { Onboarding } from "../pages/Onboarding";
import { Organization } from "../pages/organization/GeneralOrgInfo";
import { Reports } from "../pages/Reports";
import { Team } from "../pages/Team";
import { Workflows } from "../pages/Workflows";
import { WorkspaceSettings } from "../pages/workspace";
import { ManageChannelPage } from "../pages/channels/ManageChannelPage";
import { ConnectChannelPage } from "../pages/channels/ConnectChannelPage";
import { BillingPlans } from "../pages/BillingPlans";
import InstagramCallback from "../pages/InstagramCallback";

export const AppRouter = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}

      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
        {/* META CALLBACKS */}
      <Route path="/meta/instagram/callback" element={<InstagramCallback />} />
      {/* <Route path="/whatsapp/callback" element={<WhatsAppCallback />} /> */}

      {/* FALLBACK */}

      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
};
