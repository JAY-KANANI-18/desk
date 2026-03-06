// src/pages/Onboarding.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  MessageSquare,
  Building2,
  Briefcase,
  Users,
  Globe,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOrganization } from "../context/OrganizationContext";

interface OrgData {
  orgName: string;
  role: string;
  companySize: string;
  industry: string;
  website: string;
}

// ─── Constants ────────────────────────────────────────────────
const ROLES = [
  "Founder / CEO",
  "Product Manager",
  "Customer Support Lead",
  "Sales Manager",
  "Marketing Manager",
  "Developer / Engineer",
  "Operations",
  "Other",
];

const COMPANY_SIZES = [
  "Just me",
  "2 – 10",
  "11 – 50",
  "51 – 200",
  "201 – 500",
  "500+",
];

const INDUSTRIES = [
  "E-commerce / Retail",
  "SaaS / Software",
  "Healthcare",
  "Finance / Fintech",
  "Education",
  "Travel & Hospitality",
  "Real Estate",
  "Agency / Consulting",
  "Other",
];

// ─── Step Indicator ───────────────────────────────────────────
const StepIndicator = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {Array.from({ length: total }).map((_, i) => {
      const step = i + 1;
      const done = step < current;
      const active = step === current;
      return (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              done
                ? "bg-blue-600 text-white"
                : active
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {done ? (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              step
            )}
          </div>
          {i < total - 1 && (
            <div
              className={`w-16 h-0.5 mx-1 transition-all ${done ? "bg-blue-600" : "bg-gray-200"}`}
            />
          )}
        </div>
      );
    })}
  </div>
);

// ─── Password strength ────────────────────────────────────────
const getPasswordStrength = (pw: string) => {
  if (!pw) return { label: "", color: "", width: "0%" };
  if (pw.length < 6)
    return { label: "Weak", color: "bg-red-400", width: "25%" };
  if (pw.length < 8)
    return { label: "Fair", color: "bg-yellow-400", width: "50%" };
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw))
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  return { label: "Good", color: "bg-blue-400", width: "75%" };
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
  `w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${extra}`;

const iconInputCls = (left = true) =>
  `w-full ${left ? "pl-10" : "pl-3"} pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`;

export const Onboarding = () => {
  const navigate = useNavigate();
  const { organizationSetup, refreshOrganizations } = useOrganization();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 2 state
  const [org, setOrg] = useState<OrgData>({
    orgName: "",
    role: "",
    companySize: "",
    industry: "",
    website: "",
  });

  // ── Step 2 validation ──────────────────────────────────────
  const validateStep2 = () => {
    if (!org.orgName.trim()) return "Please enter your organization name.";
    if (!org.role) return "Please select your role.";
    if (!org.companySize) return "Please select your company size.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError("");
    const result = await organizationSetup(org.orgName);
    console.log({ result });
    setLoading(false);
    await refreshOrganizations();
  };

  const setAcc =
    (key: keyof AccountData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setAccount((prev) => ({ ...prev, [key]: e.target.value }));
      setError("");
    };

  const setOrgField =
    (key: keyof OrgData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setOrg((prev) => ({ ...prev, [key]: e.target.value }));
      setError("");
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4 shadow-lg">
            <MessageSquare className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {"Set up your workspace"}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {"Tell us a bit about your organization"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* ── STEP 2 ── */}
          {
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Org name */}
              <Field label="Organization name">
                <div className="relative">
                  <Building2
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={org.orgName}
                    onChange={setOrgField("orgName")}
                    placeholder="Acme Inc."
                    className={iconInputCls()}
                  />
                </div>
              </Field>

              {/* Role */}
              <Field label="Your role">
                <div className="relative">
                  <Briefcase
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={16}
                  />
                  <select
                    value={org.role}
                    onChange={setOrgField("role")}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white text-gray-700"
                  >
                    <option value="">Select your role…</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>

              {/* Company size */}
              <Field label="Company size">
                <div className="relative">
                  <Users
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={16}
                  />
                  <select
                    value={org.companySize}
                    onChange={setOrgField("companySize")}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white text-gray-700"
                  >
                    <option value="">Select team size…</option>
                    {COMPANY_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s} employees
                      </option>
                    ))}
                  </select>
                </div>
              </Field>

              {/* Industry */}
              <Field label="Industry (optional)">
                <div className="relative">
                  <Building2
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={16}
                  />
                  <select
                    value={org.industry}
                    onChange={setOrgField("industry")}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white text-gray-700"
                  >
                    <option value="">Select industry…</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>

              {/* Website */}
              <Field label="Website (optional)">
                <div className="relative">
                  <Globe
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="url"
                    value={org.website}
                    onChange={setOrgField("website")}
                    placeholder="https://yourcompany.com"
                    className={iconInputCls()}
                  />
                </div>
              </Field>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating workspace…
                    </>
                  ) : (
                    "Create workspace"
                  )}
                </button>
              </div>
            </form>
          }
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Going back to{" "}
          <Link
            to="/auth/login"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
