import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { VerificationCodeInput } from "../../components/ui/inputs/VerificationCodeInput";
import { useAuth } from "../../context/AuthContext";
import {
  AuthNotice,
  AuthPrimaryButton,
  AuthShell,
} from "./components/AuthShell";

export const VerifyEmailPremium = () => {
  const navigate = useNavigate();
  const { verifyCode, resendCode, pendingEmail, authFlow } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timeout = window.setTimeout(() => {
      setResendCooldown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [resendCooldown]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");
    const result = await verifyCode(fullCode);
    setLoading(false);

    if (result.success) {
      if (authFlow === "forgot-password") {
        navigate("/auth/reset-password");
        return;
      }

      navigate("/inbox");
      return;
    }

    setError(result.error || "Invalid code. Please try again.");
    setCode(["", "", "", "", "", ""]);
  };

  const handleResend = async () => {
    setResendLoading(true);
    await resendCode();
    setResendLoading(false);
    setResendCooldown(60);
    setError("");
  };

  return (
    <AuthShell
      eyebrow="One quick check"
      progress={58}
      title="Enter your 6-digit code"
      subtitle={
        <>
          We sent it to{" "}
          <span className="font-medium text-gray-900">{pendingEmail || "your email"}</span>.
        </>
      }
      backHref="/auth/login"
      backLabel="Back"
      headerAlign="center"
    >
      <div className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <VerificationCodeInput
            value={code}
            onChange={(nextCode) => {
              setCode(nextCode);
              setError("");
            }}
            invalid={Boolean(error)}
            autoFocus
            ariaLabelPrefix="Verification code digit"
          />

          {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

          <AuthPrimaryButton
            type="submit"
            disabled={loading || code.join("").length < 6}
            loading={loading}
            loadingLabel="Verifying..."
          >
            Verify email
          </AuthPrimaryButton>
        </form>

        <div className="text-center text-sm text-gray-500">
          Didn&apos;t get the code?{" "}
          {resendCooldown > 0 ? (
            <span>Resend in {resendCooldown}s</span>
          ) : (
            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={handleResend}
              disabled={resendLoading}
              loading={resendLoading}
              loadingMode="inline"
              loadingLabel="Resending..."
              leftIcon={<RefreshCw size={13} />}
            >
              Resend
            </Button>
          )}
        </div>

        <p className="text-center text-xs leading-5 text-gray-500">
          Wrong address?{" "}
          <Link
            to="/auth/login"
            className="font-medium text-[var(--color-primary)] transition hover:text-[var(--color-primary)]"
          >
            Go back and start again
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};
