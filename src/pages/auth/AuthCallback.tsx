import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { authApi } from "../../lib/authApi";
import {
  AuthNotice,
  AuthPrimaryButton,
  AuthShell,
} from "./components/AuthShell";

const SUCCESS_COPY: Record<string, { title: string; subtitle: string }> = {
  google: {
    title: "Finishing Google sign-in",
    subtitle: "We're securing your session and taking you into AxoDesk.",
  },
  invite: {
    title: "Opening your invitation",
    subtitle: "We're preparing your account and loading the next step.",
  },
  "verify-email": {
    title: "Verifying your email",
    subtitle: "We're confirming your address and preparing your account.",
  },
  "password-reset": {
    title: "Opening your reset flow",
    subtitle: "We're verifying your reset link and opening the password screen.",
  },
  "magic-link": {
    title: "Signing you in",
    subtitle: "We're verifying your link and opening your workspace.",
  },
};

const ERROR_COPY: Record<string, { title: string; subtitle: string }> = {
  google: {
    title: "Google sign-in failed",
    subtitle: "We couldn't complete the Google sign-in flow this time.",
  },
  invite: {
    title: "Invitation unavailable",
    subtitle: "This invitation could not be opened.",
  },
  "verify-email": {
    title: "Verification link unavailable",
    subtitle: "We couldn't verify that email link.",
  },
  "password-reset": {
    title: "Reset link unavailable",
    subtitle: "We couldn't verify that password reset link.",
  },
  "magic-link": {
    title: "Magic link unavailable",
    subtitle: "We couldn't verify that sign-in link.",
  },
};

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [working, setWorking] = useState(true);
  const [error, setError] = useState("");

  const status = searchParams.get("status") ?? "success";
  const flow = searchParams.get("flow") ?? "magic-link";
  const next = searchParams.get("next") ?? "/dashboard";
  const message = searchParams.get("message") ?? "";

  const copy = useMemo(() => {
    return status === "error"
      ? ERROR_COPY[flow] ?? ERROR_COPY["magic-link"]
      : SUCCESS_COPY[flow] ?? SUCCESS_COPY["magic-link"];
  }, [flow, status]);

  useEffect(() => {
    if (status === "error") {
      setError(message || copy.subtitle);
      setWorking(false);
      return;
    }

    let cancelled = false;

    const finish = async () => {
      try {
        const { session } = await authApi.getSession();
        if (!session) {
          throw new Error("Your session could not be restored.");
        }

        const target =
          flow === "invite" && !session.user.user_metadata?.passwordSet
            ? "/auth/set-password"
            : next;

        if (!cancelled) {
          navigate(target, { replace: true });
        }
      } catch (callbackError) {
        if (!cancelled) {
          setError(
            callbackError instanceof Error
              ? callbackError.message
              : "We couldn't finish signing you in.",
          );
          setWorking(false);
        }
      }
    };

    void finish();

    return () => {
      cancelled = true;
    };
  }, [copy.subtitle, flow, message, navigate, next, status]);

  if (working) {
    return (
      <AuthShell
        eyebrow="Just a moment"
        title={copy.title}
        subtitle={copy.subtitle}
        headerAlign="center"
      >
        <AuthNotice tone="default" className="flex items-center justify-center gap-3 text-center">
          <Loader2 size={18} className="animate-spin" />
          Securing your session...
        </AuthNotice>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Authentication issue"
      title={copy.title}
      subtitle={copy.subtitle}
      backHref="/auth/login"
      backLabel="Back to sign in"
      headerAlign="center"
    >
      <div className="space-y-4">
        <AuthNotice tone="warning" className="flex items-start gap-3">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <span>{error || "Please try again or request a fresh link."}</span>
        </AuthNotice>

        <AuthPrimaryButton
          type="button"
          onClick={() => navigate("/auth/login", { replace: true })}
        >
          Back to sign in
          <ArrowRight size={15} />
        </AuthPrimaryButton>

        <p className="text-center text-sm text-gray-500">
          Need another link?{" "}
          <Link
            to="/auth/forgot-password"
            className="font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            Request a new one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};
