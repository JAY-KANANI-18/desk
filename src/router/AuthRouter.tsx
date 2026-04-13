import { Routes, Route, Navigate } from "react-router-dom";

import { ForgotPasswordPremium } from "../pages/auth/ForgotPasswordPremium";
import { LoginPremium } from "../pages/auth/LoginPremium";
import { ResetPasswordPremium } from "../pages/auth/ResetPasswordPremium";
import { SignUpPremium } from "../pages/auth/SignUpPremium";
import { VerifyEmailPremium } from "../pages/auth/VerifyEmailPremium";

import InstagramCallback from "../pages/InstagramCallback";

export const AuthRouter = () => {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}

      <Route path="/auth/login" element={<LoginPremium />} />
      <Route path="/auth/signup" element={<SignUpPremium />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPremium />} />
      <Route path="/auth/verify-email" element={<VerifyEmailPremium />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPremium />} />
      <Route path="/auth/callback" element={<ResetPasswordPremium />} />
      
        {/* META CALLBACKS */}
      <Route path="/meta/instagram/callback" element={<InstagramCallback />} />
      {/* <Route path="/whatsapp/callback" element={<WhatsAppCallback />} /> */}

      {/* FALLBACK */}

      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
};
