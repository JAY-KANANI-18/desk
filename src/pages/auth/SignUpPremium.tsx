import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getPasswordStrength } from "./auth.utils";
import {
  AuthDivider,
  AuthField,
  AuthNotice,
  AuthPrimaryButton,
  AuthShell,
} from "./components/AuthShell";

export const SignUpPremium = () => {
  const navigate = useNavigate();
  const { signup, loginWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = getPasswordStrength(password);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    const result = await signup(name, email, password);
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
      eyebrow="Create your account"
      title="Start with a calm inbox"
      subtitle="Set up your account and we&apos;ll guide the rest in a few quick steps."
      footer={
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleLoading ? (
            <div className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
          ) : (
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="h-5 w-5"
            />
          )}
          Continue with Google
        </button>

        <AuthDivider label="or continue with email" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            label="Full name"
            icon={User}
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            placeholder="John Wilson"
            autoComplete="name"
          />

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
            <AuthField
              label="Password"
              icon={Lock}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="At least 6 characters"
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
            placeholder="Repeat your password"
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

          <p className="text-xs leading-5 text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy
            Policy.
          </p>

          <AuthPrimaryButton type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </AuthPrimaryButton>
        </form>
      </div>
    </AuthShell>
  );
};
