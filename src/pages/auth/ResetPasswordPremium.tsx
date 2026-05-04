import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, ShieldAlert } from "@/components/ui/icons";
import { useAuth } from "../../context/AuthContext";
import { getPasswordStrength } from "./auth.utils";
import {
  AuthNotice,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthSecondaryButton,
  AuthShell,
} from "./components/AuthShell";

const parseHashParams = (): Record<string, string> => {
  const hash = window.location.hash.slice(1);
  return Object.fromEntries(new URLSearchParams(hash));
};

export const ResetPasswordPremium = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const hashParams = parseHashParams();
  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!success) return;

    const timeout = window.setTimeout(() => {
      navigate("/inbox", { replace: true });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [navigate, success]);

  const requirements = [
    { label: "At least 12 characters", met: password.length >= 12 },
    { label: "Contains uppercase and lowercase", met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "Contains a number", met: /[0-9]/.test(password) },
    { label: "Contains a symbol", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Use 12+ characters with uppercase, lowercase, number, and symbol.");
      return;
    }

    setLoading(true);
    setError("");
    const result = await resetPassword(password);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      return;
    }

    setError(result.error || "Failed to reset password. Please try again.");
  };

  if (hashParams.error) {
    const isExpired = hashParams.error_code === "otp_expired";

    return (
      <AuthShell
        eyebrow="Access issue"
        title={isExpired ? "Invitation link expired" : "Access denied"}
        subtitle={
          isExpired
            ? "This invite link has expired. Ask your administrator for a fresh invite."
            : hashParams.error_description?.replace(/\+/g, " ") ||
              "Please contact your administrator if you believe this is a mistake."
        }
        backHref="/auth/login"
        backLabel="Back to sign in"
      >
        <div className="space-y-4">
          <AuthNotice tone="warning" className="flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <span>Need help getting back in? Reach out to your workspace administrator.</span>
          </AuthNotice>

          <AuthSecondaryButton
            type="button"
            onClick={() => navigate("/auth/login", { replace: true })}
            className="w-full"
          >
            Back to sign in
          </AuthSecondaryButton>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell
        eyebrow="All set"
        progress={100}
        title="Password updated"
        subtitle="Taking you back into your workspace now."
        headerAlign="center"
      >
        <AuthNotice tone="success" className="text-center">
          Your account is secure again.
        </AuthNotice>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Protect your account"
      progress={78}
      title="Choose a new password"
      subtitle="Use something you haven’t used before so your account stays secure."
      headerAlign="center"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <AuthPasswordField
            label="New password"
            icon={Lock}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            placeholder="Enter new password"
            autoComplete="new-password"
          />

          {password ? (
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <span className="w-12 text-xs text-gray-500">{strength.label}</span>
              </div>

              <div className="grid gap-1">
                {requirements.map((requirement) => (
                  <p
                    key={requirement.label}
                    className={[
                      "text-xs",
                      requirement.met ? "text-green-600" : "text-gray-400",
                    ].join(" ")}
                  >
                    {requirement.label}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <AuthPasswordField
          label="Confirm password"
          icon={Lock}
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setError("");
          }}
          placeholder="Repeat new password"
          autoComplete="new-password"
          error={Boolean(confirmPassword && confirmPassword !== password)}
        />

        {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

        <AuthPrimaryButton
          type="submit"
          disabled={loading}
          loading={loading}
          loadingLabel="Resetting..."
          rightIcon={!loading ? <ArrowRight size={15} /> : undefined}
        >
          Reset password
        </AuthPrimaryButton>
      </form>
    </AuthShell>
  );
};
