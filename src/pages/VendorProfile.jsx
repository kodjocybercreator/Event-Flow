
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("eventflowUser") || "null");
  } catch {
    return null;
  }
}

function getAccounts() {
  try {
    const data = JSON.parse(localStorage.getItem("eventflowAccounts") || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function getVendorById(id) {
  if (!id) return null;

  return (
    getAccounts().find(
      (account) =>
        account.accountType === "vendor" &&
        [
          account.id,
          account.profileId,
          account.vendorId,
        ].some((value) => value != null && String(value) === String(id))
    ) || null
  );
}

function getVendorServices(email) {
  if (!email) return [];

  try {
    const services = JSON.parse(
      localStorage.getItem(`eventflowServices_${email.toLowerCase()}`) || "[]"
    );

    return Array.isArray(services) ? services : [];
  } catch {
    return [];
  }
}

function getVendorName(account) {
  if (!account) return "EventFlow Vendor";

  return (
    `${account.firstName || ""} ${account.lastName || ""}`.trim() ||
    account.businessName ||
    account.name ||
    "EventFlow Vendor"
  );
}

function getVendorIcon(account) {
  if (account?.icon) return account.icon;

  const type = String(account?.vendorType || "").toLowerCase();

  if (type.includes("photo")) return "📸";
  if (type.includes("video")) return "🎥";
  if (type.includes("decor")) return "🎨";
  if (type.includes("dj") || type.includes("music")) return "🎧";
  if (type.includes("cater")) return "🍽️";
  if (type.includes("transport")) return "🚗";
  if (type.includes("makeup") || type.includes("beauty")) return "💄";
  if (type.includes("planning")) return "📋";

  return "🎉";
}

function formatPrice(value) {
  const amount = Number(value);

  if (value == null || value === "" || !Number.isFinite(amount) || amount <= 0) {
    return "Price on request";
  }

  return `GH₵${amount.toLocaleString("en-GH")}`;
}

function getServiceImage(service) {
  return (
    service?.image ||
    service?.imageUrl ||
    service?.photo ||
    service?.coverImage ||
    service?.thumbnail ||
    ""
  );
}

/*
 * Public profiles should display approved services only.
 * Services created before the approval workflow may not have a status.
 * Those legacy services remain visible for compatibility.
 */
function isPublicService(service) {
  if (service?.available === false) return false;

  const status = String(
    service?.status || service?.approvalStatus || ""
  ).toLowerCase();

  if (status) {
    return status === "approved";
  }

  // Legacy services without an approval field.
  return true;
}

export default function VendorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [saved, setSaved] = useState(false);

  const loadVendor = useCallback(() => {
    const account = getVendorById(id);

    if (!account) {
      setVendor(null);
      setServices([]);
      return;
    }

    setVendor({
      ...account,
      name: getVendorName(account),
      icon: getVendorIcon(account),
      type: account.vendorType || "Event Vendor",
      location: account.location || "Ghana",
      email: account.email || "Email not provided",
      phone: account.phone || "Phone not provided",
      specialization:
        account.specialization || account.vendorType || "Event Services",
      bio:
        account.bio ||
        "This vendor provides professional event services through EventFlow.",
      status: account.status || "pending",
    });

    setServices(getVendorServices(account.email));
  }, [id]);

  useEffect(() => {
    loadVendor();

    const handleUpdate = () => loadVendor();

    const events = [
      "eventflow-services-updated",
      "eventflow-auth-changed",
      "eventflow-accounts-updated",
      "eventflow-vendor-services-updated",
      "storage",
    ];

    events.forEach((eventName) =>
      window.addEventListener(eventName, handleUpdate)
    );

    return () => {
      events.forEach((eventName) =>
        window.removeEventListener(eventName, handleUpdate)
      );
    };
  }, [loadVendor]);

  const availableServices = useMemo(
    () => services.filter(isPublicService),
    [services]
  );

  useEffect(() => {
    const user = getStoredUser();

    if (!user?.email || !vendor) {
      setSaved(false);
      return;
    }

    try {
      const key = `eventflowSavedItems_${user.email.toLowerCase()}`;
      const items = JSON.parse(localStorage.getItem(key) || "[]");

      setSaved(
        Array.isArray(items) &&
          items.some(
            (item) =>
              String(item.id) === String(vendor.id) &&
              item.type === "vendor"
          )
      );
    } catch {
      setSaved(false);
    }
  }, [vendor]);

  const startingPrice = useMemo(() => {
    const prices = availableServices
      .map((service) => Number(service.price))
      .filter((price) => Number.isFinite(price) && price > 0);

    return prices.length ? Math.min(...prices) : null;
  }, [availableServices]);

  const handleSaveProfile = () => {
    const user = getStoredUser();

    if (!user?.email) {
      navigate("/login");
      return;
    }

    if (!vendor) return;

    const key = `eventflowSavedItems_${user.email.toLowerCase()}`;

    try {
      const stored = JSON.parse(localStorage.getItem(key) || "[]");
      const items = Array.isArray(stored) ? stored : [];

      const alreadySaved = items.some(
        (item) =>
          String(item.id) === String(vendor.id) &&
          item.type === "vendor"
      );

      const updated = alreadySaved
        ? items.filter(
            (item) =>
              !(
                String(item.id) === String(vendor.id) &&
                item.type === "vendor"
              )
          )
        : [
            ...items,
            {
              id: vendor.id,
              type: "vendor",
              name: vendor.name,
              location: vendor.location,
              category: vendor.specialization,
              icon: vendor.icon,
              savedAt: new Date().toISOString(),
            },
          ];

      localStorage.setItem(key, JSON.stringify(updated));
      setSaved(!alreadySaved);
      window.dispatchEvent(new Event("eventflow-saved-items-updated"));
    } catch {
      alert("Unable to update saved profile.");
    }
  };

  const handleBookingRequest = (serviceId = "") => {
    const user = getStoredUser();

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.accountType !== "organizer") {
      alert("Only organizers can make booking requests.");
      return;
    }

    if (!vendor) {
      alert("Vendor information could not be found.");
      return;
    }

    if (vendor.status !== "approved") {
      alert("This vendor is not yet approved for bookings.");
      return;
    }

    if (serviceId) {
      const selectedService = availableServices.find(
        (service) => String(service.id) === String(serviceId)
      );

      if (!selectedService) {
        alert("This service is no longer available for booking.");
        return;
      }
    }

    const query = new URLSearchParams();
    query.set("vendorId", String(vendor.id));

    if (serviceId) {
      query.set("service", String(serviceId));
    }

    navigate(`/booking-request?${query.toString()}`);
  };

  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-5 py-16">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-3xl">
              🔍
            </div>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">
              EventFlow Marketplace
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Vendor not found
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              We could not find this vendor profile. It may have been removed
              or is no longer available.
            </p>
            <Link
              to="/discover"
              className="mt-7 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700"
            >
              ← Back to Discover
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (vendor.status !== "approved") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />

        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 sm:p-12 shadow-sm text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mb-6">
              <span className="text-4xl">🔒</span>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
              Profile pending approval
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              {vendor.name}
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {vendor.specialization}
            </p>
            <p className="mt-4 max-w-md mx-auto text-sm leading-6 text-slate-500">
              This vendor has not yet been approved by EventFlow. Their profile
              picture, cover photo and portfolio gallery are hidden until an
              admin approves their application.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2">
                  Profile picture
                </p>
                <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-amber-200 text-4xl mx-auto">
                  {vendor.icon}
                </div>
                <p className="mt-2 text-xs text-amber-500">
                  Hidden until approved
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700 mb-2">
                  Portfolio gallery
                </p>
                <div className="flex h-24 w-full items-center justify-center rounded-xl bg-amber-200 text-3xl">
                  📷
                </div>
                <p className="mt-2 text-xs text-amber-500">
                  Hidden until approved
                </p>
              </div>
            </div>

            <p className="mt-8 text-xs text-amber-500">
              Vendor location:{' '}
              <span className="font-medium text-slate-700">
                {vendor.location}
              </span>
            </p>

            <Link
              to="/discover"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              ← Explore other vendors
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/discover"
            className="font-semibold text-slate-500 hover:text-indigo-600"
          >
            Discover
          </Link>
          <span className="text-slate-300">/</span>
          <span className="truncate font-semibold text-slate-900">
            {vendor.name}
          </span>
        </div>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="relative h-48 overflow-hidden bg-slate-950 sm:h-64">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.5),_transparent_45%),linear-gradient(115deg,_#020617,_#1e1b4b,_#4338ca)]" />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
            <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full border border-white/10" />

            <div className="absolute left-5 top-5 sm:left-7 sm:top-7">
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/15"
              >
                ← Discover
              </Link>
            </div>

            <div className="absolute right-5 top-5 sm:right-7 sm:top-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                EventFlow Verified
              </span>
            </div>
          </div>

          <div className="px-5 pb-7 sm:px-8 lg:px-10">
            <div className="-mt-14 flex flex-col gap-6 sm:-mt-16 lg:-mt-20 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="relative z-10 flex h-28 w-28 shrink-0 items-center justify-center rounded-[1.75rem] border-[5px] border-white bg-gradient-to-br from-indigo-600 to-violet-700 text-5xl shadow-xl sm:h-36 sm:w-36 sm:text-6xl">
                  {vendor.icon}
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                      {vendor.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      ✓ Verified
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {vendor.specialization}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                    <span>📍 {vendor.location}</span>
                    <span>📋 {availableServices.length} available services</span>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold ${
                    saved
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-slate-300 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <span className="text-base">{saved ? "♥" : "♡"}</span>
                  {saved ? "Saved" : "Save profile"}
                </button>

                <button
                  type="button"
                  onClick={() => handleBookingRequest()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  Request booking →
                </button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 divide-x divide-y divide-slate-100 border-t border-slate-100 pt-6 sm:grid-cols-4 sm:divide-y-0">
              <ProfileStat value="New" label="Rating" icon="★" />
              <ProfileStat value="0" label="Events completed" icon="✓" />
              <ProfileStat value={availableServices.length} label="Services" icon="◈" />
              <ProfileStat value="New" label="Response rate" icon="↗" />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <div className="min-w-0 space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600">
                  ✦
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    About this vendor
                  </p>
                  <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                    Professional event services
                  </h2>
                </div>
              </div>
              <p className="mt-6 whitespace-pre-line text-sm leading-7 text-slate-600">
                {vendor.bio}
              </p>
            </section>

            <section>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    Services
                  </p>
                  <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    What they offer
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Choose a service and send a booking request with your event requirements.
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-500">
                  {availableServices.length} available
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {availableServices.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                      📦
                    </div>
                    <h3 className="mt-4 font-bold text-slate-950">
                      Services coming soon
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      This vendor has no approved, available services to display yet.
                    </p>
                  </div>
                )}

                {availableServices.map((service) => {
                  const image = getServiceImage(service);
                  const serviceName =
                    service.name || service.serviceName || "Unnamed service";

                  return (
                    <article
                      key={service.id}
                      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row">
                          {image ? (
                            <div className="h-24 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:w-28">
                              <img
                                src={image}
                                alt={serviceName}
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-3xl sm:h-24 sm:w-24">
                              {service.icon || "📦"}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
                                  {service.category || service.serviceCategory || "Event service"}
                                </span>
                                <h3 className="mt-2 text-lg font-bold text-slate-950 sm:text-xl">
                                  {serviceName}
                                </h3>
                              </div>

                              <div className="shrink-0 sm:text-right">
                                <p className="text-xs font-medium text-slate-400">
                                  {service.pricingType || "Starting from"}
                                </p>
                                <p className="mt-0.5 text-lg font-bold text-slate-950">
                                  {formatPrice(service.price)}
                                </p>
                              </div>
                            </div>

                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-500">
                              {service.description ||
                                "Professional service tailored to your event requirements."}
                            </p>

                            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-xs text-emerald-600">
                                  ✓
                                </span>
                                <span className="text-xs font-semibold text-slate-600">
                                  Available for booking
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleBookingRequest(service.id)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 sm:w-auto"
                              >
                                Request this service →
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {startingPrice !== null && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-600">
                    GH₵
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950">
                      Listed services start from {formatPrice(startingPrice)}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Listed prices are guides, not final quotations. The final price
                      is agreed with the vendor through EventFlow before payment.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-indigo-50">
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                      Simple booking process
                    </p>
                    <h2 className="mt-1.5 text-xl font-bold text-slate-950">
                      Plan with confidence
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Send your requirements, review the quotation, and agree on
                      the final price before moving to payment.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-5 sm:grid-cols-3">
                  <ProcessStep number="01" title="Send request" text="Tell the vendor about your event." />
                  <ProcessStep number="02" title="Agree on price" text="Review the quotation and negotiate if needed." />
                  <ProcessStep number="03" title="Confirm" text="Confirm your booking after both sides agree." />
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24">
              <div className="bg-slate-950 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300">
                  Work with this vendor
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Ready to plan your event?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Send your event details and let the vendor prepare a quotation.
                </p>
              </div>
              <div className="p-6">
                <button
                  type="button"
                  onClick={() => handleBookingRequest()}
                  className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-indigo-700"
                >
                  Request a booking →
                </button>
                <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                  No final price is locked until both sides agree.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Vendor information</h2>
              <div className="mt-5 space-y-4">
                <ContactRow icon="📍" label="Location" value={vendor.location} />
                <ContactRow icon="✉" label="Email" value={vendor.email} />
                <ContactRow icon="☎" label="Phone" value={vendor.phone} />
              </div>
            </section>

            <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                ✓
              </div>
              <h3 className="mt-4 font-bold text-slate-950">Verified by EventFlow</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This vendor has been approved by EventFlow and is available for public discovery.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-slate-950">Business information</h2>
              <div className="mt-5 space-y-4">
                <InfoRow label="Location" value={vendor.location} icon="📍" />
                <InfoRow label="Specialization" value={vendor.specialization} icon={vendor.icon} />
                <InfoRow label="Business type" value={vendor.type} icon="🏢" />
                <InfoRow label="Available services" value={String(availableServices.length)} icon="▦" />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-400">
                For event professionals
              </p>
              <h3 className="mt-3 text-xl font-bold">Manage your EventFlow business.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Manage services, review booking requests, and keep your business information up to date.
              </p>
              <Link
                to="/dashboard/vendor"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
              >
                Open vendor dashboard →
              </Link>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

function ProfileStat({ value, label, icon }) {
  return (
    <div className="px-3 py-4 text-center">
      <div className="text-sm font-bold text-indigo-600">{icon}</div>
      <p className="mt-1.5 text-lg font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function ProcessStep({ number, title, text }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white/80 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-[11px] font-bold text-white">
          {number}
        </span>
        <h3 className="text-sm font-bold text-slate-950">{title}</h3>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function ContactRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="break-words text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

