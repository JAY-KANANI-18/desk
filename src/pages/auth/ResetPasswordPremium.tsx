import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getPasswordStrength } from "./auth.utils";
import {
  AuthField,
  AuthNotice,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const hashParams = parseHashParams();
  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!success) return;

    const timeout = window.setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [navigate, success]);

  const requirements = [
    { label: "At least 6 characters", met: password.length >= 6 },
    { label: "Contains a number", met: /[0-9]/.test(password) },
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

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
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
            ? "This invite link was already used or has expired. Ask your administrator for a fresh invite."
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
          <AuthField
            label="New password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            placeholder="Enter new password"
            autoComplete="new-password"
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-gray-400 transition hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
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

        <AuthField
          label="Confirm password"
          icon={Lock}
          type={showConfirm ? "text" : "password"}
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setError("");
          }}
          placeholder="Repeat new password"
          autoComplete="new-password"
          error={Boolean(confirmPassword && confirmPassword !== password)}
          trailing={
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="text-gray-400 transition hover:text-gray-600"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

        <AuthPrimaryButton type="submit" disabled={loading}>
          {loading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              Reset password
              <ArrowRight size={15} />
            </>
          )}
        </AuthPrimaryButton>
      </form>
    </AuthShell>
  );
};
