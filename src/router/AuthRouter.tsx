import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { ForgotPassword } from "../pages/auth/ForgotPassword";
import { Login } from "../pages/auth/Login";
import { ResetPassword } from "../pages/auth/ResetPassword";
import { SignUp } from "../pages/auth/SignUp";
import { VerifyEmail } from "../pages/auth/VerifyEmail";

import InstagramCallback from "../pages/InstagramCallback";

export const AuthRouter = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}

      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<ResetPassword />} />
      
        {/* META CALLBACKS */}
      <Route path="/meta/instagram/callback" element={<InstagramCallback />} />
      {/* <Route path="/whatsapp/callback" element={<WhatsAppCallback />} /> */}

      {/* FALLBACK */}

      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
};
