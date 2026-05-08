// Signed-in password change page. Public reset links use ResetPasswordPremium.
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle, Lock, ShieldAlert } from "@/components/ui/icons";
import { useAuth } from "../../context/AuthContext";
import {
  AuthNotice,
  AuthPasswordField,
  AuthPrimaryButton,
} from "./components/AuthShell";

const parseHashParams = (): Record<string, string> => {
  const hash = window.location.hash.slice(1);
  return Object.fromEntries(new URLSearchParams(hash));
};

export const ResetPassword = () => {
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
      setPassword("");
      setConfirmPassword("");
      setSuccess(true);
      return;
    }

    setError(result.error || "Failed to reset password. Please try again.");
  };

  if (hashParams.error) {
    const isExpired = hashParams.error_code === "otp_expired";

    return (
      <div className="w-full max-w-2xl space-y-5">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Account security
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            {isExpired ? "Reset link expired" : "Access denied"}
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            {isExpired
              ? "This link is no longer valid. You can start again from your profile."
              : hashParams.error_description?.replace(/\+/g, " ") ||
                "Please contact your administrator if you believe this is a mistake."}
          </p>
        </div>

        <AuthNotice tone="warning" className="flex items-start gap-3">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <span>Please request a fresh password reset before trying again.</span>
        </AuthNotice>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-5">


      <form onSubmit={handleSubmit} className="space-y-4">
        {success ? (
          <AuthNotice tone="success">
            Password updated.
          </AuthNotice>
        ) : null}

        <div className="space-y-2">
          <AuthPasswordField
            label="New password"
            icon={Lock}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
              setSuccess(false);
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
            setSuccess(false);
          }}
          placeholder="Repeat new password"
          autoComplete="new-password"
          error={Boolean(confirmPassword && confirmPassword !== password)}
        />

        {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

        <div className="w-full sm:w-auto">
          <AuthPrimaryButton
            type="submit"
            disabled={loading}
            loading={loading}
            loadingLabel="Updating..."
            rightIcon={!loading ? <ArrowRight size={15} /> : undefined}
          >
            Update password
          </AuthPrimaryButton>
        </div>
      </form>
    </div>
  );
};
