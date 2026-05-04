// LEGACY - still mounted from WorkspaceRouter for authenticated reset flows.
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Lock, ShieldAlert } from "@/components/ui/icons";
import { useAuth } from "../../context/AuthContext";
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

export const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const hashParams = parseHashParams();
  const getPasswordStrength = (value: string) => {
    if (!value) return { label: "", color: "", width: "0%" };
    if (value.length < 6) return { label: "Weak", color: "bg-red-400", width: "25%" };
    if (value.length < 8) return { label: "Fair", color: "bg-yellow-400", width: "50%" };
    if (/[A-Z]/.test(value) && /[0-9]/.test(value)) {
      return { label: "Strong", color: "bg-green-500", width: "100%" };
    }
    return { label: "Good", color: "bg-[var(--color-primary)]", width: "75%" };
  };

  const strength = getPasswordStrength(password);
  const requirements = [
    { label: "At least 6 characters", met: password.length >= 6 },
    { label: "Contains a number", met: /[0-9]/.test(password) },
  ];

  const handleSubmit = async (event: FormEvent) => {
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
            ? "This invitation link is no longer valid. It may have already been used or expired."
            : `${hashParams.error_description?.replace(/\+/g, " ") ?? "Please contact your administrator if you believe this is a mistake."}`
        }
        backHref="/auth/login"
        backLabel="Back to sign in"
        headerAlign="center"
      >
        <div className="space-y-4">
          <AuthNotice tone="warning" className="flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <span>
              Please contact your administrator to request a new invitation.
            </span>
          </AuthNotice>

          <AuthSecondaryButton
            type="button"
            onClick={() => navigate("/auth/login", { replace: true })}
          >
            Back to sign in
          </AuthSecondaryButton>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    navigate("/inbox");
  }

  return (
    <AuthShell
      eyebrow="Account security"
      title="Set new password"
      subtitle="Must be different from your previous password."
      backHref="/auth/login"
      backLabel="Back to sign in"
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
                  <div
                    key={requirement.label}
                    className="flex items-center gap-2 text-xs"
                  >
                    <CheckCircle
                      size={13}
                      className={
                        requirement.met ? "text-green-500" : "text-gray-300"
                      }
                    />
                    <span
                      className={
                        requirement.met ? "text-green-600" : "text-gray-400"
                      }
                    >
                      {requirement.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <AuthPasswordField
          label="Confirm new password"
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
