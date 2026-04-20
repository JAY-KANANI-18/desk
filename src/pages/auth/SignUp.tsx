import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────
interface AccountData {
  email: string;
  password: string;
  confirmPassword: string;
}

// ─── Password strength ────────────────────────────────────────
const getPasswordStrength = (pw: string) => {
  if (!pw) return { label: "", color: "", width: "0%" };
  if (pw.length < 6)
    return { label: "Weak", color: "bg-red-400", width: "25%" };
  if (pw.length < 8)
    return { label: "Fair", color: "bg-yellow-400", width: "50%" };
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw))
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  return { label: "Good", color: "bg-indigo-400", width: "75%" };
};

// ─── Field wrapper ────────────────────────────────────────────
const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const inputCls = (extra = "") =>
  `w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${extra}`;

const iconInputCls = (left = true) =>
  `w-full ${left ? "pl-10" : "pl-3"} pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`;

// ─── Main Component ───────────────────────────────────────────
export const SignUp = () => {
  const navigate = useNavigate();
  const { signup, loginWithGoogle } = useAuth();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 state
  const [account, setAccount] = useState<AccountData>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getPasswordStrength(account.password);

  // ── Step 1 validation ──────────────────────────────────────
  const validateStep1 = () => {
    if (!account.email.trim()) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email))
      return "Please enter a valid email address.";
    if (!account.password) return "Please enter a password.";
    if (account.password.length < 6)
      return "Password must be at least 6 characters.";
    if (account.password !== account.confirmPassword)
      return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError("");

    setLoading(true);
    setError("");
    const result = await signup(account.email, account.password);
    setLoading(false);
    if (result.success) {
      navigate("/auth/verify-email");
    } else {
      setError(result.error || "Sign up failed.");
    }
  };

  const handleGoogle = async () => {
    // setGoogleLoading(true);
    await loginWithGoogle();
  };

  const setAcc =
    (key: keyof AccountData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setAccount((prev) => ({ ...prev, [key]: e.target.value }));
      setError("");
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
      
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {
            <>
              <div className="flex flex-col justify-center text-center mb-8">
            {/* logo */}
            <div className="flex items-center justify-center ">

            <img
              src="/axodesk-full.png"
              alt="logo"
              className={`w-32 h-24 `}
              />
              </div>
            
          </div>
              {/* Google SSO */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors mb-6"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                )}
                Sign up with Google
              </button>

              {/* <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">
                  or sign up with email
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div> */}

              <div className="space-y-4">
                {/* Email */}
                <Field label="Work email">
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type="email"
                            autoComplete="new-password"

                      value={account.email}
                      onChange={setAcc("email")}
                      placeholder="you@company.com"
                      className={iconInputCls()}
                    />
                  </div>
                </Field>

                {/* Password */}
                <Field label="Password">
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={account.password}
                              autoComplete="new-password"

                      onChange={setAcc("password")}
                      placeholder="Min. 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {account.password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${strength.color}`}
                          style={{ width: strength.width }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12">
                        {strength.label}
                      </span>
                    </div>
                  )}
                </Field>

                {/* Confirm Password */}
                <Field label="Confirm password">
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={account.confirmPassword}
                      onChange={setAcc("confirmPassword")}
                      placeholder="Repeat your password"
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        account.confirmPassword &&
                        account.confirmPassword !== account.password
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Terms */}
                <p className="text-xs text-gray-500">
                  By creating an account, you agree to our{" "}
                  <span className="text-indigo-600 cursor-pointer hover:underline">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-indigo-600 cursor-pointer hover:underline">
                    Privacy Policy
                  </span>
                  .
                </p>

                {/* Next */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  Register
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          }
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
