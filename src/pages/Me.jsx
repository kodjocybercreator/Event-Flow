import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("eventflowUser") || "null");
  } catch {
    return null;
  }
}

function getInitials(user) {
  const name =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.name ||
    "EF";

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatDate(date) {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Unable to read this image."));

    reader.onload = () => {
      const image = new Image();

      image.onerror = () =>
        reject(new Error("Please select a valid image file."));

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 600;

        let width = image.width;
        let height = image.height;

        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Unable to process this image."));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

function persistProfileImage(email, profileImage) {
  const currentUser = getStoredUser();

  if (!currentUser) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const updatedUser = {
    ...currentUser,
    profileImage,
  };

  // Save the signed-in user's profile.
  localStorage.setItem("eventflowUser", JSON.stringify(updatedUser));

  // Keep the matching registered account in sync.
  try {
    const accounts = JSON.parse(
      localStorage.getItem("eventflowAccounts") || "[]"
    );

    if (Array.isArray(accounts)) {
      const updatedAccounts = accounts.map((account) =>
        account.email?.toLowerCase() === email?.toLowerCase()
          ? { ...account, profileImage }
          : account
      );

      localStorage.setItem(
        "eventflowAccounts",
        JSON.stringify(updatedAccounts)
      );
    }
  } catch {
    // The signed-in profile has already been saved.
  }

  window.dispatchEvent(new Event("eventflow-auth-changed"));

  return updatedUser;
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="flex min-w-0 gap-4 py-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

export default function Me() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(getStoredUser);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const refreshUser = () => {
      const currentUser = getStoredUser();
      setUser(currentUser);

      if (!currentUser) navigate("/login");
    };

    if (!getStoredUser()) navigate("/login");

    window.addEventListener("storage", refreshUser);
    window.addEventListener("eventflow-auth-changed", refreshUser);

    return () => {
      window.removeEventListener("storage", refreshUser);
      window.removeEventListener("eventflow-auth-changed", refreshUser);
    };
  }, [navigate]);

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setMessage("");
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Your image must be smaller than 5 MB.");
      return;
    }

    setUploading(true);

    try {
      const imageData = await compressImage(file);
      const updatedUser = persistProfileImage(user?.email, imageData);

      setUser(updatedUser);
      setMessage("Your profile photo has been updated successfully.");
    } catch (err) {
      setError(
        err?.name === "QuotaExceededError"
          ? "Browser storage is full. Try a smaller image."
          : err.message || "Unable to save your profile photo."
      );
    } finally {
      setUploading(false);
    }
  }

  function handleRemovePhoto() {
    setMessage("");
    setError("");

    try {
      const updatedUser = persistProfileImage(user?.email, "");
      setUser(updatedUser);
      setMessage("Your profile photo has been removed.");
    } catch (err) {
      setError(err.message || "Unable to remove your photo.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("eventflowUser");
    localStorage.removeItem("eventflowLoggedIn");

    window.dispatchEvent(new Event("eventflow-auth-changed"));
    navigate("/");
  }

  if (!user) return null;

  const fullName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.name ||
    "EventFlow Member";

  const accountType = (
    user.accountType || user.role || "organizer"
  )
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const isOrganizer = user.accountType === "organizer";

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">

        {/* PAGE HEADING */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Link
                to={isOrganizer ? "/dashboard/organizer" : "/"}
                className="transition hover:text-violet-700"
              >
                Home
              </Link>
              <span>/</span>
              <span className="text-slate-600">My Profile</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              My Profile
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
              Manage your personal information and customize your
              EventFlow account.
            </p>
          </div>

          <Link
            to={
              user.accountType === "vendor"
                ? "/dashboard/vendor"
                : user.accountType === "venue"
                  ? "/dashboard/venue"
                  : "/dashboard/organizer"
            }
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-violet-200 hover:text-violet-700"
          >
            <span>←</span>
            Back to Dashboard
          </Link>
        </div>

        {/* PROFILE HERO */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="relative h-36 overflow-hidden bg-gradient-to-r from-[#30205d] via-[#5835a0] to-[#7455cb] sm:h-44">
            <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -right-1 -top-12 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-white/5" />

            <div className="absolute bottom-5 left-6 text-white/80 sm:left-9">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em]">
                EVENTFLOW ACCOUNT
              </p>
            </div>
          </div>

          <div className="px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="-mt-12 flex min-w-0 flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
                {/* AVATAR */}
                <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={`${fullName}'s profile`}
                      className="h-28 w-28 rounded-3xl border-4 border-white bg-white object-cover shadow-lg sm:h-32 sm:w-32"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-white bg-violet-100 text-3xl font-extrabold text-violet-800 shadow-lg sm:h-32 sm:w-32 sm:text-4xl">
                      {getInitials(user)}
                    </div>
                  )}

                  <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-white bg-emerald-500" />
                </div>

                <div className="min-w-0 pb-1">
                  <h2 className="break-words text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                    {fullName}
                  </h2>

                  <p className="mt-1 break-all text-sm text-slate-500">
                    {user.email || "No email address"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                      {accountType}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <span>✓</span>
                      Account active
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3 sm:pb-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>↥</span>
                  {uploading
                    ? "Uploading..."
                    : user.profileImage
                      ? "Change Photo"
                      : "Upload Photo"}
                </button>

                {user.profileImage && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Remove
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="mt-7 border-t border-slate-100 pt-5">
              <p className="text-xs leading-5 text-slate-400">
                JPG, PNG or another browser-supported image · Maximum 5 MB
                · Your image is resized before saving.
              </p>

              {message && (
                <p
                  role="status"
                  className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                >
                  {message}
                </p>
              )}

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {error}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* MAIN CONTENT GRID */}
        <div className="mt-7 grid grid-cols-1 items-start gap-7 lg:grid-cols-3">

          {/* PERSONAL DETAILS */}
          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
              <div>
                <h3 className="text-lg font-extrabold text-slate-950">
                  Personal Information
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Your registered account details
                </p>
              </div>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-lg">
                ♙
              </span>
            </div>

            <div className="grid gap-x-8 px-5 sm:grid-cols-2 sm:px-7">
              <DetailItem
                icon="♙"
                label="First Name"
                value={user.firstName}
              />

              <DetailItem
                icon="♙"
                label="Last Name"
                value={user.lastName}
              />

              <DetailItem
                icon="✉"
                label="Email Address"
                value={user.email}
              />

              <DetailItem
                icon="☎"
                label="Phone Number"
                value={user.phone}
              />

              <DetailItem
                icon="▤"
                label="Account Type"
                value={accountType}
              />

              <DetailItem
                icon="▦"
                label="Member Since"
                value={formatDate(user.createdAt)}
              />
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
              <p className="text-xs leading-5 text-slate-500">
                Your personal details are displayed from your saved account.
                Profile editing can be added separately.
              </p>
            </div>
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-6">

            {/* ACCOUNT SUMMARY */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-xl">
                  ✦
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950">
                    Account Overview
                  </h3>
                  <p className="text-xs text-slate-500">
                    Your EventFlow membership
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">
                    Account type
                  </span>
                  <span className="text-right text-sm font-bold text-slate-800">
                    {accountType}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">
                    Profile photo
                  </span>
                  <span
                    className={`text-right text-sm font-bold ${
                      user.profileImage
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {user.profileImage ? "Added" : "Not added"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">
                    Member since
                  </span>
                  <span className="text-right text-sm font-semibold text-slate-800">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </section>

            {/* QUICK LINKS */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-950">
                Quick Access
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Continue where you left off.
              </p>

              <div className="mt-5 space-y-2">
                {isOrganizer && (
                  <>
                    <Link
                      to="/dashboard/organizer"
                      className="group flex items-center justify-between rounded-xl border border-slate-100 p-3.5 transition hover:border-violet-100 hover:bg-violet-50/70"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                          ▦
                        </span>
                        <span className="text-sm font-semibold text-slate-700">
                          Organizer Dashboard
                        </span>
                      </span>
                      <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-violet-700">
                        →
                      </span>
                    </Link>

                    <Link
                      to="/discover"
                      className="group flex items-center justify-between rounded-xl border border-slate-100 p-3.5 transition hover:border-violet-100 hover:bg-violet-50/70"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                          ⌕
                        </span>
                        <span className="text-sm font-semibold text-slate-700">
                          Discover Vendors
                        </span>
                      </span>
                      <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-violet-700">
                        →
                      </span>
                    </Link>
                  </>
                )}

                {user.accountType === "vendor" && (
                  <>
                    <Link
                      to="/dashboard/vendor"
                      className="group flex items-center justify-between rounded-xl border border-slate-100 p-3.5 transition hover:border-violet-100 hover:bg-violet-50/70"
                    >
                      <span className="text-sm font-semibold text-slate-700">
                        Vendor Dashboard
                      </span>
                      <span>→</span>
                    </Link>

                    <Link
                      to="/dashboard/vendor/services"
                      className="group flex items-center justify-between rounded-xl border border-slate-100 p-3.5 transition hover:border-violet-100 hover:bg-violet-50/70"
                    >
                      <span className="text-sm font-semibold text-slate-700">
                        Manage Services
                      </span>
                      <span>→</span>
                    </Link>
                  </>
                )}

                {user.accountType === "venue" && (
                  <>
                    <Link
                      to="/dashboard/venue"
                      className="group flex items-center justify-between rounded-xl border border-slate-100 p-3.5 transition hover:border-violet-100 hover:bg-violet-50/70"
                    >
                      <span className="text-sm font-semibold text-slate-700">
                        Venue Dashboard
                      </span>
                      <span>→</span>
                    </Link>

                    <Link
                      to="/venues"
                      className="group flex items-center justify-between rounded-xl border border-slate-100 p-3.5 transition hover:border-violet-100 hover:bg-violet-50/70"
                    >
                      <span className="text-sm font-semibold text-slate-700">
                        Explore Venues
                      </span>
                      <span>→</span>
                    </Link>
                  </>
                )}
              </div>
            </section>

            {/* SECURITY / LOGOUT */}
            <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg">
                  ↪
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">
                    Sign Out
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    End your current session on this device.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition hover:border-red-300 hover:bg-red-50"
              >
                Log Out of EventFlow
              </button>
            </section>
          </aside>
        </div>

        {/* FOOTER NOTE */}
        <div className="mt-8 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EventFlow. Plan something memorable.</p>
          <p>Your events. Your people. Your moments.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

