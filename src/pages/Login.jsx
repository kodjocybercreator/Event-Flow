import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ============================================================
  // REDIRECT USER
  // ============================================================

  const redirectUser = (user) => {
    const role = user.accountType || user.role;

    if (role === "vendor") {
      navigate("/dashboard/vendor", {
        replace: true,
      });
      return;
    }

    if (role === "organizer") {
      navigate("/dashboard/organizer", {
        replace: true,
      });
      return;
    }

    if (role === "venue") {
      navigate("/dashboard/venue", {
        replace: true,
      });
      return;
    }

    navigate("/discover", {
      replace: true,
    });
  };

  // ============================================================
  // LOGIN
  // ============================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      let accounts = [];

      const savedAccounts =
        localStorage.getItem("eventflowAccounts");

      if (savedAccounts) {
        try {
          const parsedAccounts = JSON.parse(savedAccounts);

          if (Array.isArray(parsedAccounts)) {
            accounts = parsedAccounts;
          }
        } catch (error) {
          console.error(
            "Unable to read EventFlow accounts:",
            error
          );
        }
      }

      // --------------------------------------------------------
      // Backward compatibility
      // --------------------------------------------------------

      if (accounts.length === 0) {
        const oldUser =
          localStorage.getItem("eventflowUser");

        if (oldUser) {
          try {
            const oldAccount = JSON.parse(oldUser);

            if (
              oldAccount &&
              oldAccount.email
            ) {
              accounts = [oldAccount];

              localStorage.setItem(
                "eventflowAccounts",
                JSON.stringify(accounts)
              );
            }
          } catch (error) {
            console.error(
              "Unable to migrate old account:",
              error
            );
          }
        }
      }

      // --------------------------------------------------------
      // No accounts
      // --------------------------------------------------------

      if (accounts.length === 0) {
        setError(
          "No EventFlow account was found. Please create an account first."
        );

        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // Find account
      // --------------------------------------------------------

      const user = accounts.find(
        (account) =>
          String(account.email || "")
            .trim()
            .toLowerCase() === email
      );

      if (!user) {
        setError(
          "No EventFlow account was found with this email address."
        );

        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // Password
      // --------------------------------------------------------

      if (
        String(user.password || "") !== password
      ) {
        setError(
          "Incorrect email or password."
        );

        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // Login successful
      // --------------------------------------------------------

      localStorage.setItem(
        "eventflowUser",
        JSON.stringify(user)
      );

      localStorage.setItem(
        "eventflowLoggedIn",
        "true"
      );

      window.dispatchEvent(
        new Event("eventflow-auth-changed")
      );

      // --------------------------------------------------------
      // Return to protected page
      // --------------------------------------------------------

      const from = location.state?.from;

      if (
        from &&
        typeof from === "string" &&
        from !== "/login"
      ) {
        navigate(from, {
          replace: true,
        });

        setLoading(false);
        return;
      }

      // --------------------------------------------------------
      // Dashboard
      // --------------------------------------------------------

      redirectUser(user);
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        "Something went wrong while logging in. Please try again."
      );

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Navbar />

      <main className="relative flex min-h-[calc(100vh-80px)] items-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-purple-100/60 blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:grid-cols-2">
          {/* Left panel */}
          <div className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold">
                  E
                </div>

                <span className="text-lg font-bold tracking-tight">
                  EventFlow
                </span>
              </Link>

              <div className="mt-20 max-w-md">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">
                  Your event marketplace
                </p>

                <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                  Bring your event together in one place.
                </h1>

                <p className="mt-6 text-base leading-7 text-slate-400">
                  Discover trusted event vendors and venues,
                  manage your bookings and keep your event
                  planning organized with EventFlow.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <LoginFeature
                icon="✓"
                title="Discover event providers"
                description="Find services and venues for your next event."
              />

              <LoginFeature
                icon="✓"
                title="Manage your bookings"
                description="Keep your requests, quotations and agreements together."
              />

              <LoginFeature
                icon="✓"
                title="Plan with confidence"
                description="Compare requirements and communicate with providers."
              />
            </div>
          </div>

          {/* Right panel */}
          <div className="p-6 sm:p-10 lg:p-12 xl:p-14">
            {/* Mobile logo */}
            <div className="mb-8 lg:hidden">
              <Link
                to="/"
                className="inline-flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
                  E
                </div>

                <span className="text-lg font-bold tracking-tight text-slate-900">
                  EventFlow
                </span>
              </Link>
            </div>

            {/* Heading */}
            <div className="max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Account access
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                Welcome back
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sign in to continue managing your EventFlow
                activity.
              </p>
            </div>

            {/* Form card */}
            <div className="mt-8">
              {error && (
                <div
                  role="alert"
                  className="mb-5 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
                >
                  <span className="font-bold">
                    !
                  </span>

                  <p className="leading-5">
                    {error}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-800"
                  >
                    Email address
                  </label>

                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      @
                    </span>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          "Password reset will be available when EventFlow has a backend."
                        )
                      }
                      className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      •••
                    </span>

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (previous) => !previous
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>
                </div>

                {/* Remember */}
                <label className="flex cursor-pointer items-center gap-3 select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />

                  <span className="text-sm text-slate-500">
                    Keep me signed in
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <span className="transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Register */}
              <div className="mt-7 border-t border-slate-100 pt-7 text-center">
                <p className="text-sm text-slate-500">
                  Don't have an EventFlow account?
                </p>

                <Link
                  to="/register"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                >
                  Create your account
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
              <Link
                to="/"
                className="text-sm font-medium text-slate-400 transition hover:text-indigo-600"
              >
                ← Back to EventFlow
              </Link>

              <span className="text-xs text-slate-400">
                Ghana's event marketplace
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoginFeature({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-indigo-300">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}