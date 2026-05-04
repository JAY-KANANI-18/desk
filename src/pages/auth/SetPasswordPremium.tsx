import { useEffect, useState } from "react";
import { ArrowRight, Lock } from "@/components/ui/icons";
import { useAuth } from "../../context/AuthContext";
import { getPasswordStrength } from "./auth.utils";
import {
  AuthNotice,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthShell,
} from "./components/AuthShell";

export const SetPasswordPremium = () => {
  const { resetPassword, user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
          <AuthPasswordField
            label="Password"
            icon={Lock}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            placeholder="Create a password"
            autoComplete="new-password"
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

        <AuthPasswordField
          label="Confirm password"
          icon={Lock}
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setError("");
          }}
          placeholder="Repeat password"
          autoComplete="new-password"
          error={Boolean(confirmPassword && confirmPassword !== password)}
        />

        {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

        <AuthPrimaryButton
          type="submit"
          disabled={loading}
          loading={loading}
          loadingLabel="Saving..."
          rightIcon={!loading ? <ArrowRight size={15} /> : undefined}
        >
          Activate account
        </AuthPrimaryButton>
      </form>
    </AuthShell>
  );
};
