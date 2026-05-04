import type {
  ComponentProps,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import type { AppIcon } from "@/components/ui/icons";
import { ArrowLeft } from "@/components/ui/icons";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { BaseInput } from "../../../components/ui/inputs/BaseInput";
import { PasswordInput } from "../../../components/ui/inputs/PasswordInput";

const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  eyebrow?: string;
  progress?: number;
  children: ReactNode;
  footer?: ReactNode;
  backHref?: string;
  backLabel?: string;
  contentClassName?: string;
  headerAlign?: "left" | "center";
}

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  icon?: AppIcon;
  trailing?: ReactNode;
  helpText?: ReactNode;
  error?: boolean;
}

interface AuthButtonProps extends Omit<ComponentProps<typeof Button>, "children"> {
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: ReactNode;
}

interface AuthNoticeProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "default" | "success" | "warning" | "danger";
}

const progressWidth = (progress?: number) => {
  if (typeof progress !== "number") return "0%";
  const bounded = Math.max(0, Math.min(100, progress));
  return `${bounded}%`;
};

export const AuthShell = ({
  title,
  subtitle,
  eyebrow,
  progress,
  children,
  footer,
  backHref,
  backLabel = "Back",
  contentClassName,
  headerAlign = "left",
}: AuthShellProps) => (
  <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-[var(--color-primary-light)] via-white to-[var(--color-primary-light)]">
    <motion.div
      aria-hidden
      className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[var(--color-primary-light)] blur-3xl"
      animate={{ x: [0, 24, -10, 0], y: [0, -10, 18, 0] }}
      transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
    />
    <motion.div
      aria-hidden
      className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--color-primary-light)] blur-3xl"
      animate={{ x: [0, -18, 12, 0], y: [0, 18, -10, 0] }}
      transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
    />

    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-xl items-center justify-center px-3 py-3 sm:px-5 sm:py-5">
      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="w-full max-w-[29rem] overflow-hidden rounded-[30px] border border-white/80 bg-white/92 shadow-[0_24px_90px_-50px_rgba(15,23,42,0.28)] backdrop-blur"
      >
        <div className="max-h-[calc(100dvh-24px)] overflow-y-auto px-4 py-4 sm:px-7 sm:py-7">
          <div className="space-y-5">
            <div className="space-y-4">
              {backHref ? (
                <Link
                  to={backHref}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                >
                  <ArrowLeft size={15} />
                  {backLabel}
                </Link>
              ) : null}

              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src="/axodesk-logo.png"
                    alt="AxoDesk"
                    className="h-14 w-auto object-contain sm:h-16"
                  />
                </div>

                {(eyebrow || typeof progress === "number") && (
                  <div className="space-y-2 ">
                    {eyebrow ? (
                      <p
                        className={cx(
                          "text-xs font-semibold tracking-[0.12em] text-gray-500",
                          headerAlign === "center" ? "text-center" : "text-left",
                        )}
                      >
                        {eyebrow}
                      </p>
                    ) : null}
                    {typeof progress === "number" ? (
                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <motion.div
                          className="h-full rounded-full bg-[var(--color-primary)]"
                          initial={false}
                          animate={{ width: progressWidth(progress) }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                <div
                  className={cx(
                    "space-y-2",
                    headerAlign === "center" ? "text-center" : "text-left",
                  )}
                >
                  <h1 className="text-[clamp(1.8rem,5vw,2.35rem)] text-center font-semibold leading-[1.1] tracking-tight text-gray-950">
                    {title}
                  </h1>
                  {subtitle ? (
                    <div className="text-sm leading-6 text-gray-500">{subtitle}</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className={contentClassName}>{children}</div>

            {footer ? <div>{footer}</div> : null}
          </div>
        </div>
      </motion.section>
    </div>
  </div>
);

export const AuthField = ({
  label,
  icon: Icon,
  trailing,
  helpText,
  error,
  ...props
}: AuthFieldProps) => (
  <label className="block space-y-2">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <BaseInput
      {...props}
      appearance="auth"
      leftIcon={Icon ? <Icon size={16} className="shrink-0 text-gray-400" /> : undefined}
      rightIcon={trailing}
      invalid={Boolean(error)}
    />
    {helpText ? <div className="text-xs leading-5 text-gray-500">{helpText}</div> : null}
  </label>
);

export const AuthPasswordField = ({
  label,
  icon: Icon,
  helpText,
  error,
  ...props
}: Omit<AuthFieldProps, "trailing">) => (
  <label className="block space-y-2">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <PasswordInput
      {...props}
      appearance="auth"
      leftIcon={Icon ? <Icon size={16} className="shrink-0 text-gray-400" /> : undefined}
      invalid={Boolean(error)}
    />
    {helpText ? <div className="text-xs leading-5 text-gray-500">{helpText}</div> : null}
  </label>
);

export const AuthPrimaryButton = ({
  children,
  loading = false,
  loadingLabel,
  ...props
}: AuthButtonProps) => (
  <Button
    {...props}
    fullWidth
    
    loading={loading}
    loadingMode="inline"
    loadingLabel={loadingLabel}
  >
    {children}
  </Button>
);

export const AuthSecondaryButton = ({
  children,
  loading = false,
  loadingLabel,
  ...props
}: AuthButtonProps) => (
  <Button
    {...props}
    variant="secondary"
    fullWidth

    loading={loading}
    loadingMode="inline"
    loadingLabel={loadingLabel}
  >
    {children}
  </Button>
);

export const AuthDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3">
    <div className="h-px flex-1 bg-gray-200" />
    <span className="text-xs font-medium text-gray-400">{label}</span>
    <div className="h-px flex-1 bg-gray-200" />
  </div>
);

export const AuthNotice = ({
  tone = "default",
  className,
  children,
  ...props
}: AuthNoticeProps) => (
  <div
    {...props}
    className={cx(
      "rounded-2xl border px-4 py-3 text-sm leading-6",
      tone === "success" && "border-green-200 bg-green-50 text-green-700",
      tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
      tone === "danger" && "border-red-200 bg-red-50 text-red-600",
      tone === "default" && "border-gray-200 bg-gray-50 text-gray-600",
      className,
    )}
  >
    {children}
  </div>
);
