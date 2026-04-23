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

export const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } else {
      setError(result.error || "Login failed.");
    }
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

          {/* SSO */}
          {/* <button
            type="button"
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Use single sign-on (SSO)
          </button> */}

          {/* ── Demo credentials (only shown when DUMMY_MODE = true) ── */}
          {DUMMY_MODE ? (
            <div className="mt-5 border border-amber-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-amber-700">
                    🧪 Demo mode — test credentials
                  </span>
                </div>
                {showDemo ? (
                  <ChevronUp size={14} className="text-amber-600" />
                ) : (
                  <ChevronDown size={14} className="text-amber-600" />
                )}
              </button>

              {showDemo && (
                <div className="px-4 pb-3 pt-2 bg-amber-50 border-t border-amber-200">
                  <div className="space-y-1 mb-2">
                    {MOCK_USERS.map((u) => (
                      <button
                        key={u.email}
                        type="button"
                        onClick={() => fillDemo(u.email)}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors text-left"
                      >
                        <span className="text-xs text-amber-900 font-mono">
                          {u.email}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-amber-600">
                    Password:{" "}
                    <code className="font-mono bg-amber-100 px-1 rounded">
                      demo123
                    </code>
                    &nbsp;·&nbsp; OTP:{" "}
                    <code className="font-mono bg-amber-100 px-1 rounded">
                      123456
                    </code>
                  </p>
                  <p className="text-xs text-amber-500 mt-1">
                    Set <code className="font-mono">DUMMY_MODE = false</code> in{" "}
                    <code className="font-mono">src/lib/authApi.ts</code> to use
                    real auth.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link
            to="/auth/signup"
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};
