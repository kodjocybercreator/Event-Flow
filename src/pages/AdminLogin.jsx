import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_EMAIL = "admin@eventflow.com";
const ADMIN_PASSWORD = "Admin@123";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 10;
const SESSION_HOURS = 8;

function getJson(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix = "EF") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

function getSecurityState() {
  const stored = getJson("eventflowAdminSecurity", null);

  return (
    stored || {
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      lastLoginEmail: null,
    }
  );
}

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null);

  useEffect(() => {
    const existingAdmin = getJson("eventflowAdmin", null);

    if (
      existingAdmin &&
      existingAdmin.role === "admin" &&
      existingAdmin.sessionExpiresAt &&
      new Date(existingAdmin.sessionExpiresAt).getTime() > Date.now()
    ) {
      navigate("/admin", { replace: true });
      return;
    }

    if (existingAdmin) {
      localStorage.removeItem("eventflowAdmin");
    }

    const security = getSecurityState();

    if (
      security.lockedUntil &&
      new Date(security.lockedUntil).getTime() > Date.now()
    ) {
      setLockedUntil(security.lockedUntil);
    }
  }, [navigate]);

  const isLocked =
    lockedUntil && new Date(lockedUntil).getTime() > Date.now();

  const getRemainingLockTime = () => {
    if (!lockedUntil) return "";

    const difference =
      new Date(lockedUntil).getTime() - Date.now();

    if (difference <= 0) return "";

    const minutes = Math.ceil(difference / 60000);

    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  };

  const recordSecurityEvent = (event) => {
    const logs = getJson("eventflowSecurityLogs", []);

    logs.unshift({
      id: createId("EF-SEC"),
      timestamp: new Date().toISOString(),
      actor: "Admin Authentication",
      type: event.type,
      description: event.description,
      email: event.email || email.trim().toLowerCase(),
      severity: event.severity || "info",
    });

    localStorage.setItem(
      "eventflowSecurityLogs",
      JSON.stringify(logs.slice(0, 300))
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");

    if (isLocked) {
      setError(
        `Too many failed attempts. Try again in ${getRemainingLockTime()}.`
      );
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Enter your admin email and password.");
      return;
    }

    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (
      cleanEmail === ADMIN_EMAIL &&
      password === ADMIN_PASSWORD
    ) {
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + SESSION_HOURS * 60 * 60 * 1000
      );

      const adminSession = {
        id: "eventflow-admin-001",
        email: ADMIN_EMAIL,
        name: "EventFlow Administrator",
        role: "admin",

        loginAt: now.toISOString(),
        lastActivityAt: now.toISOString(),
        sessionExpiresAt: expiresAt.toISOString(),
      };

      saveJson("eventflowAdmin", adminSession);

      saveJson("eventflowAdminSecurity", {
        failedAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now.toISOString(),
        lastLoginEmail: cleanEmail,
      });

      recordSecurityEvent({
        type: "ADMIN_LOGIN_SUCCESS",
        description: "Administrator signed into the EventFlow admin console.",
        email: cleanEmail,
        severity: "info",
      });

      window.dispatchEvent(
        new Event("eventflow-admin-auth-changed")
      );

      navigate("/admin", { replace: true });

      setLoading(false);
      return;
    }

    const security = getSecurityState();

    const failedAttempts = Number(security.failedAttempts || 0) + 1;

    if (failedAttempts >= MAX_ATTEMPTS) {
      const lockDate = new Date(
        Date.now() + LOCKOUT_MINUTES * 60 * 1000
      );

      const newSecurityState = {
        ...security,
        failedAttempts,
        lockedUntil: lockDate.toISOString(),
        lastLoginEmail: cleanEmail,
      };

      saveJson(
        "eventflowAdminSecurity",
        newSecurityState
      );

      setLockedUntil(lockDate.toISOString());

      recordSecurityEvent({
        type: "ADMIN_ACCOUNT_LOCKED",
        description:
          "Administrator login was temporarily locked after repeated failed attempts.",
        email: cleanEmail,
        severity: "high",
      });

      setError(
        `Too many failed attempts. Admin access is locked for ${LOCKOUT_MINUTES} minutes.`
      );
    } else {
      saveJson("eventflowAdminSecurity", {
        ...security,
        failedAttempts,
        lastLoginEmail: cleanEmail,
      });

      recordSecurityEvent({
        type: "ADMIN_LOGIN_FAILED",
        description: "A failed administrator login attempt was detected.",
        email: cleanEmail,
        severity: "warning",
      });

      setError(
        `Invalid administrator credentials. Attempt ${failedAttempts} of ${MAX_ATTEMPTS}.`
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden bg-[#4f39f6] lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.2),transparent_40%)]" />

          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-[#4f39f6] shadow-lg">
                  E
                </div>

                <div>
                  <p className="text-lg font-bold text-white">
                    EventFlow
                  </p>

                  <p className="text-xs text-white/70">
                    Administration Console
                  </p>
                </div>
              </div>

              <div className="mt-24 max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                  Secure Operations
                </p>

                <h1 className="mt-4 text-5xl font-black leading-tight text-white">
                  Manage your event marketplace with confidence.
                </h1>

                <p className="mt-6 max-w-lg text-lg leading-8 text-white/75">
                  Review providers, monitor bookings, track transactions,
                  respond to platform activity and maintain operational
                  oversight from one secure workspace.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                ["01", "Approvals"],
                ["02", "Transactions"],
                ["03", "Security"],
              ].map(([number, label]) => (
                <div
                  key={number}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
                >
                  <p className="text-xs font-bold text-white/50">
                    {number}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Login panel */}
        <div className="flex items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4f39f6] text-xl font-black text-white">
                  E
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    EventFlow
                  </p>

                  <p className="text-xs text-slate-500">
                    Administration Console
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
              <div className="mb-8">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                  🔐
                </div>

                <p className="text-sm font-semibold text-[#4f39f6]">
                  Restricted Access
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-900">
                  Admin sign in
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Authorized EventFlow administrators only.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {error}
                </div>
              )}

              {notice && (
                <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {notice}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Administrator email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@eventflow.com"
                    autoComplete="username"
                    disabled={isLocked || loading}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4f39f6] focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isLocked || loading}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4f39f6] focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      disabled={isLocked || loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLocked || loading}
                  className="w-full rounded-2xl bg-[#4f39f6] px-5 py-3.5 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-[#4330dc] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Verifying access..."
                    : isLocked
                    ? "Temporarily locked"
                    : "Sign in securely"}
                </button>
              </form>

              <div className="mt-7 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <span className="text-lg">🛡️</span>

                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Protected administration area
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Failed login attempts are monitored and repeated
                    failures temporarily lock the admin sign-in.
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5 text-center">
                <p className="text-xs text-slate-400">
                  EventFlow Administration · Authorized personnel only
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;