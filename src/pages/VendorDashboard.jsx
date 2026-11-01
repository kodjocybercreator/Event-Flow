import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const BOOKINGS_KEY = "eventflowBookings";
const SERVICES_PREFIX = "eventflowServices_";
const VENDOR_NOTIFICATIONS_PREFIX = "eventflowVendorNotifications_";

const BOOKINGS_UPDATED_EVENT = "eventflow-bookings-updated";
const BOOKING_UPDATED_EVENT = "eventflow-booking-updated";
const QUOTATIONS_UPDATED_EVENT = "eventflow-quotations-updated";
const PAYMENT_UPDATED_EVENT = "eventflow-payment-updated";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("eventflowUser") || "null");
  } catch {
    return null;
  }
}

function getArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getBookings() {
  return getArray(BOOKINGS_KEY);
}

function getVendorBookingsFromOwnStorage(email) {
  if (!email) return [];

  return getArray(
    `eventflowVendorBookings_${email.toLowerCase()}`
  );
}

function getVendorNotifications(email) {
  if (!email) return [];

  return getArray(
    `${VENDOR_NOTIFICATIONS_PREFIX}${email.toLowerCase()}`
  );
}

function getVendorEmail(user) {
  return String(
    user?.email ||
      user?.businessEmail ||
      user?.contactEmail ||
      ""
  )
    .trim()
    .toLowerCase();
}

function getVendorId(user) {
  return String(
    user?.id ||
      user?.userId ||
      user?.vendorId ||
      user?.accountId ||
      ""
  ).trim();
}

function getVendorName(user) {
  if (!user) return "Your Business";

  return (
    user.businessName ||
    user.companyName ||
    user.vendorName ||
    user.firstName ||
    user.name ||
    "Your Business"
  );
}

function money(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "GH₵0";
  }

  return `GH₵${number.toLocaleString("en-GH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "Date not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleString("en-GH", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatus(booking) {
  return String(
    booking?.status ||
      booking?.bookingStatus ||
      "pending"
  ).toLowerCase();
}

function getPaymentStatus(booking) {
  return String(
    booking?.paymentStatus || "unpaid"
  ).toLowerCase();
}

function getAgreedPrice(booking) {
  const values = [
    booking?.agreedPrice,
    booking?.finalPrice,
    booking?.acceptedPrice,
    booking?.confirmedPrice,
  ];

  for (const value of values) {
    const number = Number(value);

    if (Number.isFinite(number) && number > 0) {
      return number;
    }
  }

  return 0;
}

function getAmountPaid(booking) {
  const amount = Number(booking?.amountPaid);

  return Number.isFinite(amount) && amount > 0
    ? amount
    : 0;
}

function getRemainingBalance(booking) {
  const explicit = Number(booking?.remainingBalance);

  if (Number.isFinite(explicit) && explicit >= 0) {
    return explicit;
  }

  const agreed = getAgreedPrice(booking);
  const paid = getAmountPaid(booking);

  if (agreed > 0) {
    return Math.max(agreed - paid, 0);
  }

  return 0;
}

function getOrganizerName(booking) {
  return (
    booking?.organizerName ||
    booking?.organizer?.name ||
    booking?.customerName ||
    booking?.userName ||
    "Event Organizer"
  );
}

function getBookingService(booking) {
  return (
    booking?.serviceName ||
    booking?.service ||
    booking?.serviceType ||
    booking?.category ||
    "Event Service"
  );
}

function getEventName(booking) {
  return (
    booking?.eventName ||
    booking?.eventTitle ||
    "Event Booking"
  );
}

function getVendorMatch(booking, user) {
  if (!booking || !user) return false;

  const vendorEmail = getVendorEmail(user);
  const vendorId = getVendorId(user);

  const bookingVendorEmail = String(
    booking?.vendorEmail ||
      booking?.providerEmail ||
      booking?.businessEmail ||
      ""
  )
    .trim()
    .toLowerCase();

  const bookingVendorId = String(
    booking?.vendorId ||
      booking?.providerId ||
      booking?.providerUserId ||
      ""
  ).trim();

  const providerType = String(
    booking?.providerType ||
      booking?.vendorType ||
      ""
  ).toLowerCase();

  const emailMatch =
    vendorEmail &&
    bookingVendorEmail &&
    vendorEmail === bookingVendorEmail;

  const idMatch =
    vendorId &&
    bookingVendorId &&
    vendorId === bookingVendorId;

  const explicitlyVendor = providerType === "vendor";

  return emailMatch || idMatch || explicitlyVendor;
}

function getStatusLabel(booking) {
  const status = getStatus(booking);

  switch (status) {
    case "accepted":
      return "Confirmed";

    case "rejected":
    case "declined":
      return "Declined";

    case "cancelled":
      return "Cancelled";

    case "counter":
    case "counter_offer":
    case "organizer_counter":
    case "organizer_countered":
      return "Counter offer";

    case "vendor_counter":
    case "vendor_countered":
    case "provider_counter":
    case "provider_countered":
    case "quotation_sent":
    case "quoted":
      return "Quotation sent";

    case "pending":
    case "new":
    default:
      return "New request";
  }
}

function getStatusClasses(booking) {
  const status = getStatus(booking);

  if (status === "accepted") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
  }

  if (
    status === "rejected" ||
    status === "declined" ||
    status === "cancelled"
  ) {
    return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
  }

  if (
    status === "counter" ||
    status === "counter_offer" ||
    status === "organizer_counter" ||
    status === "organizer_countered"
  ) {
    return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  }

  if (
    status === "vendor_counter" ||
    status === "vendor_countered" ||
    status === "provider_counter" ||
    status === "provider_countered" ||
    status === "quotation_sent" ||
    status === "quoted"
  ) {
    return "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200";
  }

  return "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200";
}

function getInitials(name) {
  if (!name) return "EF";

  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

function getPaymentLabel(status) {
  if (status === "paid") return "Paid in full";
  if (status === "deposit_paid") return "50% deposit";
  return "Payment pending";
}

function getPaymentClasses(status) {
  if (status === "paid") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "deposit_paid") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-gray-100 text-gray-600";
}

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };

  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (name === "location") {
    return (
      <svg {...common}>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (name === "briefcase") {
    return (
      <svg {...common}>
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M3 12h18" />
      </svg>
    );
  }

  if (name === "wallet") {
    return (
      <svg {...common}>
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" />
        <path d="M4 8h15" />
        <path d="M16 13h3" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (name === "bell") {
    return (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function VendorDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() =>
    getCurrentUser()
  );

  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const loadDashboard = () => {
    const currentUser = getCurrentUser();

    setUser(currentUser);

    if (!currentUser) {
      setLoading(false);
      return;
    }

    const email = getVendorEmail(currentUser);

    const canonicalBookings = getBookings();

    const matchedCanonicalBookings =
      canonicalBookings.filter((booking) =>
        getVendorMatch(booking, currentUser)
      );

    const ownBookings =
      getVendorBookingsFromOwnStorage(email);

    const merged = [
      ...matchedCanonicalBookings,
      ...ownBookings,
    ];

    const uniqueBookings = Array.from(
      new Map(
        merged.map((booking, index) => [
          String(
            booking?.id ||
              booking?.bookingId ||
              `booking-${index}`
          ),
          booking,
        ])
      ).values()
    );

    uniqueBookings.sort((a, b) => {
      const first = new Date(
        a?.updatedAt ||
          a?.createdAt ||
          a?.eventDate ||
          0
      ).getTime();

      const second = new Date(
        b?.updatedAt ||
          b?.createdAt ||
          b?.eventDate ||
          0
      ).getTime();

      return second - first;
    });

    setBookings(uniqueBookings);

    const serviceKeys = [
      `${SERVICES_PREFIX}${email}`,
      `${SERVICES_PREFIX}${currentUser?.id || ""}`,
    ].filter(Boolean);

    let loadedServices = [];

    serviceKeys.forEach((key) => {
      loadedServices = [
        ...loadedServices,
        ...getArray(key),
      ];
    });

    const uniqueServices = Array.from(
      new Map(
        loadedServices.map((service, index) => [
          String(
            service?.id ||
              service?.serviceId ||
              `${service?.name || "service"}-${index}`
          ),
          service,
        ])
      ).values()
    );

    setServices(uniqueServices);

    setNotifications(
      getVendorNotifications(email)
    );

    setLoading(false);
  };

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (
      currentUser.accountType &&
      currentUser.accountType !== "vendor"
    ) {
      navigate("/");
      return;
    }

    loadDashboard();

    const events = [
      BOOKINGS_UPDATED_EVENT,
      BOOKING_UPDATED_EVENT,
      QUOTATIONS_UPDATED_EVENT,
      PAYMENT_UPDATED_EVENT,
      "eventflow-auth-changed",
      "eventflow-services-updated",
    ];

    events.forEach((eventName) => {
      window.addEventListener(
        eventName,
        loadDashboard
      );
    });

    const handleStorage = (event) => {
      if (
        !event.key ||
        event.key.startsWith("eventflow")
      ) {
        loadDashboard();
      }
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          loadDashboard
        );
      });

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [navigate]);

  const stats = useMemo(() => {
    const activeBookings = bookings.filter(
      (booking) =>
        ![
          "rejected",
          "declined",
          "cancelled",
        ].includes(getStatus(booking))
    );

    const pendingRequests = bookings.filter(
      (booking) => {
        const status = getStatus(booking);

        return (
          status === "pending" ||
          status === "new" ||
          !status
        );
      }
    );

    const counterOffers = bookings.filter(
      (booking) =>
        [
          "counter",
          "counter_offer",
          "organizer_counter",
          "organizer_countered",
        ].includes(getStatus(booking))
    );

    const confirmedBookings = bookings.filter(
      (booking) =>
        getStatus(booking) === "accepted"
    );

    const paidBookings = confirmedBookings.filter(
      (booking) =>
        getPaymentStatus(booking) === "paid"
    );

    const depositBookings = confirmedBookings.filter(
      (booking) =>
        getPaymentStatus(booking) === "deposit_paid"
    );

    const totalRevenue = confirmedBookings.reduce(
      (sum, booking) =>
        sum + getAgreedPrice(booking),
      0
    );

    const receivedPayments = confirmedBookings.reduce(
      (sum, booking) =>
        sum + getAmountPaid(booking),
      0
    );

    const outstandingBalance =
      confirmedBookings.reduce(
        (sum, booking) =>
          sum + getRemainingBalance(booking),
        0
      );

    return {
      activeBookings: activeBookings.length,
      pendingRequests: pendingRequests.length,
      counterOffers: counterOffers.length,
      confirmedBookings: confirmedBookings.length,
      paidBookings: paidBookings.length,
      depositBookings: depositBookings.length,
      totalRevenue,
      receivedPayments,
      outstandingBalance,
    };
  }, [bookings]);

  const recentBookings = useMemo(
    () => bookings.slice(0, 6),
    [bookings]
  );

  const pendingRequests = useMemo(
    () =>
      bookings.filter((booking) => {
        const status = getStatus(booking);

        return (
          status === "pending" ||
          status === "new"
        );
      }),
    [bookings]
  );

  const counterOffers = useMemo(
    () =>
      bookings.filter((booking) =>
        [
          "counter",
          "counter_offer",
          "organizer_counter",
          "organizer_countered",
        ].includes(getStatus(booking))
      ),
    [bookings]
  );

  const confirmedBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          getStatus(booking) === "accepted"
      ),
    [bookings]
  );

  if (!user) {
    return null;
  }

  const vendorName = getVendorName(user);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-48 rounded-3xl bg-white" />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl bg-white"
                />
              ))}
            </div>

            <div className="h-96 rounded-3xl bg-white" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-gray-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* HERO / BUSINESS HEADER */}
        <section className="relative mb-6 overflow-hidden rounded-3xl bg-gray-950 shadow-xl">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

          <div className="relative px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-4 sm:gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-base font-extrabold text-indigo-700 shadow-lg sm:h-16 sm:w-16 sm:text-lg">
                  {getInitials(vendorName)}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
                      Vendor workspace
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </div>

                  <h1 className="mt-3 truncate text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    {vendorName}
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                    Manage your event services, respond to
                    organizers, track agreements and monitor
                    payments from one workspace.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                <Link
                  to="/dashboard/vendor/services"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <Icon name="briefcase" className="h-4 w-4" />
                  Manage services
                </Link>

                <Link
                  to="/dashboard/vendor/bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/20 transition hover:bg-indigo-500"
                >
                  View bookings
                  <Icon name="arrow" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PENDING APPROVAL BANNER */}
        {(function () {
          const cu = getCurrentUser();
          if (
            cu &&
            (String(cu.status || cu.approvalStatus || 'pending').toLowerCase() !== 'approved')
          ) {
            return (
              <section className="mb-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-700">
                        ⏳
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Profile pending approval
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Your vendor profile and media are hidden from the
                          public marketplace until an EventFlow admin approves
                          your application.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                        Status: {cu.status || cu.approvalStatus || 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            );
          }
          return null;
        })()}

        {/* TOP METRICS */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon name="briefcase" className="h-5 w-5" />
              </div>

              <span className="text-xs font-semibold text-gray-400">
                Pipeline
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-500">
              Active bookings
            </p>

            <p className="mt-1 text-3xl font-extrabold tracking-tight text-gray-950">
              {stats.activeBookings}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Current booking activity
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Icon name="clock" className="h-5 w-5" />
              </div>

              {stats.pendingRequests > 0 && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  Action needed
                </span>
              )}
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-500">
              New requests
            </p>

            <p className="mt-1 text-3xl font-extrabold tracking-tight text-gray-950">
              {stats.pendingRequests}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Organizer requests to review
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Icon name="arrow" className="h-5 w-5 rotate-180" />
              </div>

              <span className="text-xs font-semibold text-gray-400">
                Negotiation
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-500">
              Counter offers
            </p>

            <p className="mt-1 text-3xl font-extrabold tracking-tight text-gray-950">
              {stats.counterOffers}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Waiting for your response
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Icon name="wallet" className="h-5 w-5" />
              </div>

              <span className="text-xs font-semibold text-gray-400">
                Recorded
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-500">
              Received payments
            </p>

            <p className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950">
              {money(stats.receivedPayments)}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Payments recorded on EventFlow
            </p>
          </div>
        </section>

        {/* FINANCIAL SUMMARY */}
        <section className="mb-6 rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-extrabold text-gray-950">
                  Financial overview
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  A summary of agreed booking value and recorded payments.
                </p>
              </div>

              <span className="mt-2 w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500 sm:mt-0">
                {stats.confirmedBookings} confirmed
              </span>
            </div>
          </div>

          <div className="grid divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Confirmed value
              </p>

              <p className="mt-2 text-2xl font-extrabold text-gray-950">
                {money(stats.totalRevenue)}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Total agreed value
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Deposit payments
              </p>

              <p className="mt-2 text-2xl font-extrabold text-gray-950">
                {stats.depositBookings}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Confirmed bookings with a 50% deposit
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Outstanding
              </p>

              <p className="mt-2 text-2xl font-extrabold text-gray-950">
                {money(stats.outstandingBalance)}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Remaining balance to be collected
              </p>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">

          <div className="min-w-0">

            {/* NAVIGATION */}
            <div className="mb-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
              <div className="flex min-w-max gap-1">
                {[
                  ["overview", "Overview"],
                  ["requests", "Requests"],
                  ["payments", "Payments"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setActiveTab(value)}
                    className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                      activeTab === value
                        ? "bg-gray-950 text-white shadow-sm"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {label}

                    {value === "requests" &&
                      stats.pendingRequests +
                        stats.counterOffers >
                        0 && (
                        <span
                          className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${
                            activeTab === value
                              ? "bg-white/15 text-white"
                              : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          {stats.pendingRequests +
                            stats.counterOffers}
                        </span>
                      )}
                  </button>
                ))}
              </div>
            </div>

            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">

                {/* RECENT BOOKINGS */}
                <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-950">
                        Recent bookings
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Your latest booking activity.
                      </p>
                    </div>

                    <Link
                      to="/dashboard/vendor/bookings"
                      className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      View all
                      <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                  </div>

                  {recentBookings.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                        <Icon name="calendar" className="h-6 w-6" />
                      </div>

                      <h3 className="mt-4 font-bold text-gray-900">
                        No bookings yet
                      </h3>

                      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">
                        When organizers request one of your
                        services, the booking will appear in
                        your workspace.
                      </p>

                      <Link
                        to="/dashboard/vendor/services"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                      >
                        Manage services
                        <Icon name="arrow" className="h-4 w-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {recentBookings.map(
                        (booking, index) => {
                          const status =
                            getStatus(booking);

                          const paymentStatus =
                            getPaymentStatus(
                              booking
                            );

                          const agreedPrice =
                            getAgreedPrice(
                              booking
                            );

                          return (
                            <div
                              key={
                                booking?.id ||
                                booking?.bookingId ||
                                index
                              }
                              className="p-5 transition hover:bg-gray-50/70 sm:p-6"
                            >
                              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate font-extrabold text-gray-950">
                                      {getEventName(
                                        booking
                                      )}
                                    </h3>

                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                                        booking
                                      )}`}
                                    >
                                      {getStatusLabel(
                                        booking
                                      )}
                                    </span>
                                  </div>

                                  <p className="mt-1 text-sm text-gray-500">
                                    {getOrganizerName(
                                      booking
                                    )}
                                    {" · "}
                                    {getBookingService(
                                      booking
                                    )}
                                  </p>

                                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-400">
                                    <span className="inline-flex items-center gap-1.5">
                                      <Icon
                                        name="calendar"
                                        className="h-3.5 w-3.5"
                                      />
                                      {formatDate(
                                        booking?.eventDate
                                      )}
                                    </span>

                                    {booking?.location && (
                                      <span className="inline-flex items-center gap-1.5">
                                        <Icon
                                          name="location"
                                          className="h-3.5 w-3.5"
                                        />
                                        {booking.location}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4 sm:justify-end sm:border-t-0 sm:pt-0">
                                  <div className="sm:text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                      {status === "accepted"
                                        ? "Agreed price"
                                        : "Status"}
                                    </p>

                                    <p className="mt-1 font-extrabold text-gray-950">
                                      {status === "accepted" &&
                                      agreedPrice > 0
                                        ? money(
                                            agreedPrice
                                          )
                                        : status ===
                                          "accepted"
                                        ? "Agreed"
                                        : "Quotation pending"}
                                    </p>

                                    {status === "accepted" && (
                                      <p
                                        className={`mt-1 text-[11px] font-bold ${
                                          paymentStatus ===
                                          "paid"
                                            ? "text-emerald-600"
                                            : paymentStatus ===
                                              "deposit_paid"
                                            ? "text-amber-600"
                                            : "text-gray-400"
                                        }`}
                                      >
                                        {getPaymentLabel(
                                          paymentStatus
                                        )}
                                      </p>
                                    )}
                                  </div>

                                  <Link
                                    to="/dashboard/vendor/bookings"
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-bold text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                  >
                                    Review
                                    <Icon
                                      name="arrow"
                                      className="h-3.5 w-3.5"
                                    />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* SERVICES + ACTIVITY */}
                <div className="grid gap-6 lg:grid-cols-2">

                  <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-extrabold text-gray-950">
                          Your services
                        </h2>

                        <p className="mt-1 text-sm leading-5 text-gray-500">
                          Services currently offered through your account.
                        </p>
                      </div>

                      <Link
                        to="/dashboard/vendor/services"
                        className="shrink-0 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        Manage
                      </Link>
                    </div>

                    {services.length === 0 ? (
                      <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-5 py-8 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm">
                          <Icon
                            name="plus"
                            className="h-5 w-5"
                          />
                        </div>

                        <p className="mt-3 text-sm font-bold text-gray-800">
                          No services added yet
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Add your services so organizers can discover and request them.
                        </p>

                        <Link
                          to="/dashboard/vendor/services"
                          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600"
                        >
                          Add a service
                          <Icon
                            name="arrow"
                            className="h-4 w-4"
                          />
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-5 space-y-2">
                        {services
                          .slice(0, 4)
                          .map(
                            (service, index) => (
                              <div
                                key={
                                  service?.id ||
                                  service?.serviceId ||
                                  index
                                }
                                className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-gray-900">
                                    {service?.name ||
                                      service?.serviceName ||
                                      "Service"}
                                  </p>

                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {service?.category ||
                                      service?.type ||
                                      "Event service"}
                                  </p>
                                </div>

                                {service?.price && (
                                  <span className="shrink-0 text-xs font-bold text-gray-700">
                                    From{" "}
                                    {money(
                                      service.price
                                    )}
                                  </span>
                                )}
                              </div>
                            )
                          )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <div>
                      <h2 className="font-extrabold text-gray-950">
                        Business activity
                      </h2>

                      <p className="mt-1 text-sm leading-5 text-gray-500">
                        Your current marketplace and payment activity.
                      </p>
                    </div>

                    <div className="mt-5 divide-y divide-gray-100">
                      <div className="flex items-center justify-between py-3 first:pt-0">
                        <span className="text-sm text-gray-500">
                          Confirmed bookings
                        </span>

                        <span className="font-extrabold text-gray-950">
                          {stats.confirmedBookings}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-gray-500">
                          Full payments
                        </span>

                        <span className="font-extrabold text-gray-950">
                          {stats.paidBookings}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-gray-500">
                          Deposit payments
                        </span>

                        <span className="font-extrabold text-gray-950">
                          {stats.depositBookings}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3 pb-0">
                        <span className="text-sm text-gray-500">
                          Outstanding
                        </span>

                        <span className="font-extrabold text-gray-950">
                          {money(
                            stats.outstandingBalance
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REQUESTS */}
            {activeTab === "requests" && (
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                  <h2 className="text-lg font-extrabold text-gray-950">
                    Requests & negotiations
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Review new organizer requests and active price discussions.
                  </p>
                </div>

                {pendingRequests.length === 0 &&
                counterOffers.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                      <Icon
                        name="check"
                        className="h-6 w-6"
                      />
                    </div>

                    <h3 className="mt-4 font-bold text-gray-900">
                      Nothing requires your attention
                    </h3>

                    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-gray-500">
                      New booking requests and organizer counter offers will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {[
                      ...pendingRequests,
                      ...counterOffers,
                    ]
                      .slice(0, 10)
                      .map((booking, index) => {
                        const counterPrice =
                          Number(
                            booking?.organizerCounterPrice ||
                              booking?.counterOfferPrice ||
                              booking?.counterPrice ||
                              0
                          );

                        return (
                          <div
                            key={
                              booking?.id ||
                              booking?.bookingId ||
                              index
                            }
                            className="p-5 sm:p-6"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-extrabold text-gray-950">
                                    {getEventName(
                                      booking
                                    )}
                                  </h3>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                                      booking
                                    )}`}
                                  >
                                    {getStatusLabel(
                                      booking
                                    )}
                                  </span>
                                </div>

                                <p className="mt-1 text-sm text-gray-500">
                                  {getOrganizerName(
                                    booking
                                  )}
                                  {" · "}
                                  {getBookingService(
                                    booking
                                  )}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                                  <span>
                                    {formatDate(
                                      booking?.eventDate
                                    )}
                                  </span>

                                  {counterPrice > 0 && (
                                    <span className="font-bold text-amber-600">
                                      Organizer counter:{" "}
                                      {money(
                                        counterPrice
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <Link
                                to="/dashboard/vendor/bookings"
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                              >
                                Open booking
                                <Icon
                                  name="arrow"
                                  className="h-4 w-4"
                                />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* PAYMENTS */}
            {activeTab === "payments" && (
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                  <h2 className="text-lg font-extrabold text-gray-950">
                    Payment activity
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Track recorded payments against confirmed bookings.
                  </p>
                </div>

                {confirmedBookings.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                      <Icon
                        name="wallet"
                        className="h-6 w-6"
                      />
                    </div>

                    <h3 className="mt-4 font-bold text-gray-900">
                      No confirmed bookings yet
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Payment information will appear after an agreement is reached.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {confirmedBookings.map(
                      (booking, index) => {
                        const agreed =
                          getAgreedPrice(
                            booking
                          );

                        const paid =
                          getAmountPaid(
                            booking
                          );

                        const remaining =
                          getRemainingBalance(
                            booking
                          );

                        const paymentStatus =
                          getPaymentStatus(
                            booking
                          );

                        return (
                          <div
                            key={
                              booking?.id ||
                              booking?.bookingId ||
                              index
                            }
                            className="p-5 sm:p-6"
                          >
                            <div className="flex flex-col gap-5">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-extrabold text-gray-950">
                                      {getEventName(
                                        booking
                                      )}
                                    </p>

                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                      Confirmed
                                    </span>
                                  </div>

                                  <p className="mt-1 text-sm text-gray-500">
                                    {getOrganizerName(
                                      booking
                                    )}
                                  </p>

                                  <p className="mt-2 text-xs text-gray-400">
                                    {formatDate(
                                      booking?.eventDate
                                    )}
                                  </p>
                                </div>

                                <span
                                  className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${getPaymentClasses(
                                    paymentStatus
                                  )}`}
                                >
                                  {getPaymentLabel(
                                    paymentStatus
                                  )}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl bg-gray-50 p-4">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                    Agreed
                                  </p>

                                  <p className="mt-1 text-sm font-extrabold text-gray-900">
                                    {money(agreed)}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-emerald-50 p-4">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                                    Received
                                  </p>

                                  <p className="mt-1 text-sm font-extrabold text-emerald-700">
                                    {money(paid)}
                                  </p>
                                </div>

                                <div className="rounded-2xl bg-gray-50 p-4">
                                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                    Balance
                                  </p>

                                  <p className="mt-1 text-sm font-extrabold text-gray-900">
                                    {money(remaining)}
                                  </p>
                                </div>
                              </div>

                              {paymentStatus ===
                                "deposit_paid" &&
                                remaining > 0 && (
                                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                                    <p className="text-xs font-bold text-amber-800">
                                      Deposit received
                                    </p>

                                    <p className="mt-1 text-sm text-amber-700">
                                      {money(
                                        remaining
                                      )}{" "}
                                      remains outstanding on this booking.
                                    </p>
                                  </div>
                                )}

                              {paymentStatus ===
                                "paid" && (
                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                      <Icon
                                        name="check"
                                        className="h-4 w-4"
                                      />
                                    </div>

                                    <div>
                                      <p className="text-xs font-bold text-emerald-800">
                                        Payment complete
                                      </p>

                                      <p className="mt-1 text-sm text-emerald-700">
                                        The agreed booking value has been fully paid.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-6">

            {/* QUICK ACTIONS */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                  Workspace
                </p>

                <h2 className="mt-1 font-extrabold text-gray-950">
                  Quick actions
                </h2>
              </div>

              <div className="mt-5 space-y-2">
                <Link
                  to="/dashboard/vendor/bookings"
                  className="group flex items-center justify-between rounded-2xl border border-gray-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Review bookings
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Requests and negotiations
                    </p>
                  </div>

                  <Icon
                    name="arrow"
                    className="h-4 w-4 text-gray-400 transition group-hover:text-indigo-600"
                  />
                </Link>

                <Link
                  to="/dashboard/vendor/services"
                  className="group flex items-center justify-between rounded-2xl border border-gray-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Manage services
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Update your offerings
                    </p>
                  </div>

                  <Icon
                    name="arrow"
                    className="h-4 w-4 text-gray-400 transition group-hover:text-indigo-600"
                  />
                </Link>

                <Link
                  to="/discover"
                  className="group flex items-center justify-between rounded-2xl border border-gray-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Marketplace
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      View EventFlow listings
                    </p>
                  </div>

                  <Icon
                    name="arrow"
                    className="h-4 w-4 text-gray-400 transition group-hover:text-indigo-600"
                  />
                </Link>
              </div>
            </div>

            {/* NOTIFICATIONS */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon
                      name="bell"
                      className="h-4 w-4"
                    />
                  </div>

                  <div>
                    <h2 className="font-extrabold text-gray-950">
                      Notifications
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Recent account activity
                    </p>
                  </div>
                </div>

                {notifications.length > 0 && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                    {notifications.length}
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="px-5 py-8">
                  <p className="text-sm font-bold text-gray-800">
                    You're all caught up.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    New booking requests, quotations,
                    counter offers and payment updates
                    will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications
                    .slice(0, 5)
                    .map(
                      (
                        notification,
                        index
                      ) => (
                        <div
                          key={
                            notification?.id ||
                            index
                          }
                          className="p-4"
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-extrabold text-indigo-600">
                              {notification?.type
                                ?.includes(
                                  "payment"
                                )
                                ? "₵"
                                : notification?.type
                                    ?.includes(
                                      "quote"
                                    )
                                ? "Q"
                                : "•"}
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900">
                                {notification?.title ||
                                  notification?.message ||
                                  "New EventFlow activity"}
                              </p>

                              {notification?.title &&
                                notification?.message && (
                                  <p className="mt-1 text-xs leading-5 text-gray-500">
                                    {
                                      notification.message
                                    }
                                  </p>
                                )}

                              <p className="mt-1.5 text-[10px] font-medium text-gray-400">
                                {formatDateTime(
                                  notification?.createdAt ||
                                    notification?.timestamp
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                </div>
              )}
            </div>

            {/* BUSINESS STATUS */}
            <div className="overflow-hidden rounded-3xl bg-gray-950 p-6 text-white shadow-sm">
              <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-300">
                EventFlow
              </span>

              <h2 className="mt-4 text-xl font-extrabold tracking-tight">
                Your business, in one place.
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Keep your services current, respond to organizers
                and manage confirmed work from your vendor workspace.
              </p>

              <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-xs font-bold text-gray-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Vendor account active
              </div>
            </div>

          </aside>
        </section>

        {/* FOOTER */}
        <footer className="mt-10 border-t border-gray-200 py-6">
          <div className="flex flex-col gap-2 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              EventFlow Vendor Workspace
            </p>

            <p>
              Manage your event business with confidence.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default VendorDashboard;
