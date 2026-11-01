import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Register() {
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState("organizer");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!accountType) {
      setError("Please select an account type.");
      return;
    }

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const password = formData.password;

    if (!firstName) {
      setError("Please enter your first name.");
      return;
    }

    if (!lastName) {
      setError("Please enter your last name.");
      return;
    }

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!phone) {
      setError("Please enter your phone number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      // ============================================================
      // GET EXISTING ACCOUNTS
      // ============================================================

      let accounts = [];

      const savedAccounts =
        localStorage.getItem("eventflowAccounts");

      if (savedAccounts) {
        try {
          const parsedAccounts = JSON.parse(savedAccounts);

          if (Array.isArray(parsedAccounts)) {
            accounts = parsedAccounts;
          }
        } catch (storageError) {
          console.error(
            "Unable to read EventFlow accounts:",
            storageError
          );
        }
      }

      // ============================================================
      // BACKWARD COMPATIBILITY
      // ============================================================

      const oldUser =
        localStorage.getItem("eventflowUser");

      if (oldUser) {
        try {
          const oldAccount = JSON.parse(oldUser);

          if (
            oldAccount &&
            oldAccount.email &&
            !accounts.some(
              (account) =>
                String(account.email || "")
                  .trim()
                  .toLowerCase() ===
                String(oldAccount.email)
                  .trim()
                  .toLowerCase()
            )
          ) {
            accounts.push(oldAccount);
          }
        } catch (migrationError) {
          console.error(
            "Unable to migrate old EventFlow account:",
            migrationError
          );
        }
      }

      // ============================================================
      // CHECK EMAIL
      // ============================================================

      const emailAlreadyExists = accounts.some(
        (account) =>
          String(account.email || "")
            .trim()
            .toLowerCase() === email
      );

      if (emailAlreadyExists) {
        setError(
          "An EventFlow account with this email already exists. Please log in instead."
        );
        return;
      }

      // ============================================================
      // VENDOR FLOW
      // ============================================================
      //
      // Vendors need additional information and portfolio
      // photos, so we DO NOT create their account here.
      // We pass their personal details to VendorRegistration.jsx.
      //
      // ============================================================

      if (accountType === "vendor") {
        navigate("/vendor-registration", {
          replace: true,
          state: {
            firstName,
            lastName,
            email,
            phone,
            password,
          },
        });

        return;
      }

      // ============================================================
      // CREATE ORGANIZER / VENUE ACCOUNT
      // ============================================================

      const now = new Date().toISOString();

      const user = {
        id: Date.now(),
        firstName,
        lastName,
        email,
        phone,
        password,
        accountType,
        status: "active",
        approvalStatus:
          accountType === "venue"
            ? "pending"
            : "approved",
        approved:
          accountType === "venue"
            ? false
            : true,
        createdAt: now,
        updatedAt: now,
      };

      accounts.push(user);

      localStorage.setItem(
        "eventflowAccounts",
        JSON.stringify(accounts)
      );

      // ============================================================
      // CREATE LOGIN SESSION
      // ============================================================

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

      // ============================================================
      // REDIRECT
      // ============================================================

      switch (accountType) {
        case "organizer":
          navigate("/dashboard/organizer", {
            replace: true,
          });
          break;

        case "venue":
          navigate("/dashboard/venue", {
            replace: true,
          });
          break;

        default:
          navigate("/discover", {
            replace: true,
          });
      }
    } catch (registrationError) {
      console.error(
        "Registration error:",
        registrationError
      );

      setError(
        "Something went wrong while creating your account. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Navbar />

      <main className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-purple-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[0.8fr_1.2fr]">
          {/* ======================================================
              LEFT INFORMATION PANEL
          ====================================================== */}

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

              <div className="mt-20">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">
                  Get started
                </p>

                <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                  Everything you need for your event.
                </h1>

                <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
                  Create your EventFlow account and connect
                  with event service providers and venues in
                  one place.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <SideFeature
                number="01"
                title="Plan your event"
                description="Create and manage events from your organizer account."
              />

              <SideFeature
                number="02"
                title="Offer your services"
                description="Build your provider profile and connect with organizers."
              />

              <SideFeature
                number="03"
                title="List your venue"
                description="Showcase your venue and manage booking requests."
              />
            </div>
          </div>

          {/* ======================================================
              RIGHT REGISTRATION AREA
          ====================================================== */}

          <div className="p-6 sm:p-10 lg:p-12 xl:p-14">
            {/* Mobile brand */}
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

            {/* Header */}
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                Create an account
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Join EventFlow
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Choose how you want to use EventFlow, then
                create your account.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-7 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
                  !
                </span>

                <p className="leading-5">{error}</p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6"
            >
              {/* ACCOUNT TYPE */}

              <div>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-slate-800">
                    Account type
                  </label>

                  <p className="mt-1 text-xs text-slate-400">
                    Choose the account that matches your role.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <AccountTypeCard
                    active={accountType === "organizer"}
                    onClick={() => {
                      setAccountType("organizer");
                      setError("");
                    }}
                    icon="O"
                    title="Organizer"
                    description="Plan events"
                  />

                  <AccountTypeCard
                    active={accountType === "vendor"}
                    onClick={() => {
                      setAccountType("vendor");
                      setError("");
                    }}
                    icon="V"
                    title="Vendor"
                    description="Offer services"
                  />

                  <AccountTypeCard
                    active={accountType === "venue"}
                    onClick={() => {
                      setAccountType("venue");
                      setError("");
                    }}
                    icon="L"
                    title="Venue owner"
                    description="List a venue"
                  />
                </div>
              </div>

              {/* PERSONAL DETAILS */}

              <div className="border-t border-slate-100 pt-6">
                <p className="mb-4 text-sm font-semibold text-slate-800">
                  Your details
                </p>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      First name
                    </label>

                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="First name"
                      autoComplete="given-name"
                      required
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Last name
                    </label>

                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Last name"
                      autoComplete="family-name"
                      required
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                    />
                  </div>
                </div>
              </div>

              {/* CONTACT DETAILS */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Phone number
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+233 XX XXX XXXX"
                    autoComplete="tel"
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  minLength={6}
                  autoComplete="new-password"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />

                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Use at least 6 characters.
                  </p>

                  <span
                    className={`text-xs font-semibold ${
                      formData.password.length >= 6
                        ? "text-emerald-600"
                        : "text-slate-400"
                    }`}
                  >
                    {formData.password.length >= 6
                      ? "Password ready"
                      : "6+ characters"}
                  </span>
                </div>
              </div>

              {/* TERMS */}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />

                <span className="text-xs leading-5 text-slate-500">
                  I agree to EventFlow's terms and conditions
                  and privacy policy.
                </span>
              </label>

              {/* SUBMIT */}

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
              >
                {accountType === "vendor"
                  ? "Continue to vendor registration"
                  : "Create your account"}

                <span className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </form>

            {/* LOGIN */}

            <div className="mt-7 border-t border-slate-100 pt-7 text-center">
              <p className="text-sm text-slate-500">
                Already have an EventFlow account?
              </p>

              <Link
                to="/login"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
              >
                Sign in
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ============================================================
// ACCOUNT TYPE CARD
// ============================================================

function AccountTypeCard({
  active,
  onClick,
  icon,
  title,
  description,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative rounded-2xl border p-4 text-left transition ${
        active
          ? "border-indigo-500 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-100"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${
            active
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {icon}
        </div>

        {active && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
            ✓
          </div>
        )}
      </div>

      <p className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </button>
  );
}

// ============================================================
// SIDE FEATURE
// ============================================================

function SideFeature({
  number,
  title,
  description,
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-bold text-indigo-300">
        {number}
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
