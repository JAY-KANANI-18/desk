import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timeout = window.setTimeout(() => {
      setResendCooldown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const nextCode = [...code];
    nextCode[index] = value.slice(-1);
    setCode(nextCode);
    setError("");

    if (value && index < nextCode.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const nextCode = [...code];

    pasted.split("").forEach((character, index) => {
      nextCode[index] = character;
    });

    setCode(nextCode);
    setError("");
    const nextEmptyIndex = nextCode.findIndex((value) => !value);
    inputRefs.current[nextEmptyIndex === -1 ? 5 : nextEmptyIndex]?.focus();
  };

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
    inputRefs.current[0]?.focus();
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
          <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <motion.input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                whileFocus={{ scale: 1.03 }}
                className={[
                  "h-14 w-full rounded-2xl border text-center text-lg font-semibold outline-none transition",
                  digit
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100",
                  error ? "border-red-300 bg-red-50" : "",
                ].join(" ")}
              />
            ))}
          </div>

          {error ? <AuthNotice tone="danger">{error}</AuthNotice> : null}

          <AuthPrimaryButton type="submit" disabled={loading || code.join("").length < 6}>
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify email"
            )}
          </AuthPrimaryButton>
        </form>

        <div className="text-center text-sm text-gray-500">
          Didn&apos;t get the code?{" "}
          {resendCooldown > 0 ? (
            <span>Resend in {resendCooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="inline-flex items-center gap-1 font-medium text-indigo-600 transition hover:text-indigo-700 disabled:opacity-60"
            >
              <RefreshCw size={13} className={resendLoading ? "animate-spin" : ""} />
              Resend
            </button>
          )}
        </div>

        <p className="text-center text-xs leading-5 text-gray-500">
          Wrong address?{" "}
          <Link
            to="/auth/login"
            className="font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            Go back and start again
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};
