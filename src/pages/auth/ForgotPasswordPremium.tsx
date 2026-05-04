import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "@/components/ui/icons";
import { useAuth } from "../../context/AuthContext";
import {
  AuthField,
  AuthNotice,
  AuthPrimaryButton,
  AuthSecondaryButton,
  AuthShell,
} from "./components/AuthShell";

export const ForgotPasswordPremium = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      setSent(true);
      return;
    }

    setError(result.error || "Failed to send reset email.");
  };

  if (sent) {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title="Reset link sent"
        subtitle={
          <>
            We sent recovery instructions to{" "}
            <span className="font-medium text-gray-900">{email}</span>.
          </>
        }
        backHref="/auth/login"
        backLabel="Back to sign in"
      >
        <div className="space-y-4">
          <AuthNotice tone="success">
            If you don&apos;t see the email in a minute, check spam or request a
            fresh link.
          </AuthNotice>

          <div className="grid gap-3 sm:grid-cols-2">
            <AuthPrimaryButton type="button" onClick={() => navigate("/auth/verify-email")}>
              Enter code
            </AuthPrimaryButton>
            <AuthSecondaryButton type="button" onClick={() => setSent(false)}>
              Try another email
            </AuthSecondaryButton>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Secure your access"
      title="Reset your password"
      subtitle="Enter your work email and we’ll send the recovery link right away."
      backHref="/auth/login"
      backLabel="Back"
      footer={
        <p className="text-center text-sm text-gray-500">
          Remembered it?{" "}
          <Link
            to="/auth/login"
            className="font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary)]"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email address"
          icon={Mail}
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
          }}
          placeholder="you@company.com"
          autoComplete="email"
        />

        {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

        <AuthPrimaryButton
          type="submit"
          disabled={loading}
          loading={loading}
          loadingLabel="Sending..."
        >
          Send reset instructions
        </AuthPrimaryButton>
      </form>
    </AuthShell>
  );
};
