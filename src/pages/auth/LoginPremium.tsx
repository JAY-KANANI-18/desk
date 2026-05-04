import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "@/components/ui/icons";
import { Button } from "../../components/ui/Button";
import { DisclosureButton } from "../../components/ui/button/DisclosureButton";
import { useAuth } from "../../context/AuthContext";
import { DUMMY_MODE, MOCK_USERS } from "../../lib/authApi";
import {
  AuthDivider,
  AuthField,
  AuthNotice,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthSecondaryButton,
  AuthShell,
} from "./components/AuthShell";

export const LoginPremium = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    owner: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
    admin: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
    supervisor: "bg-amber-100 text-amber-700",
    agent: "bg-green-100 text-green-700",
  };

  return (
    <AuthShell
    headerAlign="center"
      eyebrow="Welcome back"
      title="Sign in to AxoDesk"
      subtitle="Pick up where your team left off and keep customer conversations moving."
      footer={
        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            to="/auth/signup"
            className="font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary)]"
          >
            Create one
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

          <AuthPasswordField
            label="Password"
            icon={Lock}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            helpText={
              <Link
                to="/auth/forgot-password"
                className="font-medium text-[var(--color-primary)] transition hover:text-[var(--color-primary)]"
              >
                Forgot password?
              </Link>
            }
          />

          {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

          <AuthPrimaryButton
            type="submit"
            disabled={loading}
            loading={loading}
            loadingLabel="Signing in..."
          >
            Sign in
          </AuthPrimaryButton>
        </form>

        {DUMMY_MODE ? (
          <div className="overflow-hidden rounded-2xl border border-amber-200">
            <DisclosureButton
              type="button"
              tone="warning"
              open={showDemo}
              onClick={() => setShowDemo((prev) => !prev)}
            >
              <span className="text-xs font-semibold text-amber-700">
                Demo mode test credentials
              </span>
            </DisclosureButton>

            {showDemo ? (
              <div className="space-y-2 border-t border-amber-200 bg-amber-50 px-4 py-3">
                {MOCK_USERS.map((user) => (
                  <Button
                    key={user.email}
                    type="button"
                    onClick={() => fillDemo(user.email)}
                    variant="soft-warning"
                    
                    fullWidth
                    contentAlign="start"
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="font-mono text-xs text-amber-900">{user.email}</span>
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                          roleColors[user.role] ?? "bg-gray-100 text-gray-600",
                        ].join(" ")}
                      >
                        {user.role}
                      </span>
                    </span>
                  </Button>
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
