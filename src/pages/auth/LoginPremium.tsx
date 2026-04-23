import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { DUMMY_MODE, MOCK_USERS } from "../../lib/authApi";
import {
  AuthDivider,
  AuthField,
  AuthNotice,
  AuthPrimaryButton,
  AuthShell,
} from "./components/AuthShell";

export const LoginPremium = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate("/inbox");
      return;
    }

    setError(result.error || "Login failed.");
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo123");
    setError("");
  };

  const roleColors: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700",
    admin: "bg-indigo-100 text-indigo-700",
    supervisor: "bg-amber-100 text-amber-700",
    agent: "bg-green-100 text-green-700",
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to AxoDesk"
      subtitle="Pick up where your team left off and keep customer conversations moving."
      footer={
        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            to="/auth/signup"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            Create one
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

        <AuthDivider label="or sign in with email" />

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

          <AuthField
            label="Password"
            icon={Lock}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
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
            helpText={
              <Link
                to="/auth/forgot-password"
                className="font-medium text-indigo-600 transition hover:text-indigo-700"
              >
                Forgot password?
              </Link>
            }
          />

          {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

          <AuthPrimaryButton type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </AuthPrimaryButton>
        </form>

        {DUMMY_MODE ? (
          <div className="overflow-hidden rounded-2xl border border-amber-200">
            <button
              type="button"
              onClick={() => setShowDemo((prev) => !prev)}
              className="flex w-full items-center justify-between bg-amber-50 px-4 py-3 text-left transition hover:bg-amber-100"
            >
              <span className="text-xs font-semibold text-amber-700">
                Demo mode test credentials
              </span>
              {showDemo ? (
                <ChevronUp size={15} className="text-amber-600" />
              ) : (
                <ChevronDown size={15} className="text-amber-600" />
              )}
            </button>

            {showDemo ? (
              <div className="space-y-2 border-t border-amber-200 bg-amber-50 px-4 py-3">
                {MOCK_USERS.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    onClick={() => fillDemo(user.email)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-amber-100"
                  >
                    <span className="font-mono text-xs text-amber-900">{user.email}</span>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                        roleColors[user.role] ?? "bg-gray-100 text-gray-600",
                      ].join(" ")}
                    >
                      {user.role}
                    </span>
                  </button>
                ))}

                <p className="text-xs leading-5 text-amber-600">
                  Password: <code className="rounded bg-amber-100 px-1">demo123</code>
                  {" · "}OTP: <code className="rounded bg-amber-100 px-1">123456</code>
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
};
