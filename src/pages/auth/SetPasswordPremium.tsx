import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getPasswordStrength } from "./auth.utils";
import {
  AuthField,
  AuthNotice,
  AuthPrimaryButton,
  AuthShell,
} from "./components/AuthShell";

export const SetPasswordPremium = () => {
  const { resetPassword, user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!success) return;

    const timeout = window.setTimeout(() => {
      window.location.href = "/";
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [success]);

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

    setError(result.error || "Failed to set password.");
  };

  if (success) {
    return (
      <AuthShell
        eyebrow="Almost done"
        progress={100}
        title="Password created"
        subtitle="Taking you into AxoDesk now."
        headerAlign="center"
      >
        <AuthNotice tone="success" className="text-center">
          Your invite is active and your workspace is ready for the next step.
        </AuthNotice>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Almost there"
      progress={84}
      title="Create your password"
      subtitle={
        <>
          Secure your seat for{" "}
          <span className="font-medium text-gray-900">{user?.email ?? "your account"}</span>.
        </>
      }
      headerAlign="center"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <AuthField
            label="Password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            placeholder="Create a password"
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
            <div className="flex items-center gap-2 px-1">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <span className="w-12 text-xs text-gray-500">{strength.label}</span>
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
          placeholder="Repeat password"
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
              Saving...
            </>
          ) : (
            <>
              Activate account
              <ArrowRight size={15} />
            </>
          )}
        </AuthPrimaryButton>
      </form>
    </AuthShell>
  );
};
