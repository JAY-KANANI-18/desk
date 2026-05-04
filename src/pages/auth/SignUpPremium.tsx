import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getPasswordStrength } from "./auth.utils";
import {
  AuthDivider,
  AuthField,
  AuthNotice,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthSecondaryButton,
  AuthShell,
} from "./components/AuthShell";

export const SignUpPremium = () => {
  const navigate = useNavigate();
  const { signup, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = getPasswordStrength(password);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Use 12+ characters with uppercase, lowercase, number, and symbol.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    const result = await signup(email, password);
    setLoading(false);

    if (result.success) {
      navigate("/auth/verify-email");
      return;
    }

    setError(result.error || "Sign up failed.");
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      headerAlign="center"
      eyebrow="Create your account"
      title="Start with a calm inbox"
      subtitle="Set up your account and we&apos;ll guide the rest in a few quick steps."
      footer={
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary)]"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <AuthSecondaryButton
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          loading={googleLoading}
          loadingLabel="Connecting Google..."
          leftIcon={
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              aria-hidden="true"
              className="h-5 w-5"
            />
          }
        >
          Continue with Google
        </AuthSecondaryButton>

        <AuthDivider label="OR" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            label="Work email"
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

          <div className="space-y-2">
            <AuthPasswordField
              label="Password"
              icon={Lock}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="12+ chars, mixed case, number, symbol"
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
            placeholder="Repeat your password"
            autoComplete="new-password"
            error={Boolean(confirmPassword && confirmPassword !== password)}
          />

          {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

          <p className="text-xs leading-5 text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy
            Policy.
          </p>

          <AuthPrimaryButton
            type="submit"
            disabled={loading}
            loading={loading}
            loadingLabel="Creating account..."
          >
            Create account
          </AuthPrimaryButton>
        </form>
      </div>
    </AuthShell>
  );
};
