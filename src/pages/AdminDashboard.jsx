import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_SESSION_KEY = "eventflowAdmin";
const ACCOUNTS_KEY = "eventflowAccounts";
const VENUES_KEY = "eventflowVenues";
const BOOKINGS_KEY = "eventflowBookings";
const QUOTATIONS_KEY = "eventflowQuotations";
const NOTIFICATIONS_KEY = "eventflowAdminNotifications";
const SECURITY_LOGS_KEY = "eventflowSecurityLogs";

function getJson(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function createId(prefix = "EF") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value) {
  const amount = Number(value || 0);

  return `GH₵${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getStatusClasses(status) {
  const normalized = String(status || "").toLowerCase();

  if (
    [
      "approved",
      "accepted",
      "paid",
      "completed",
      "deposit_paid",
      "active",
    ].includes(normalized)
  ) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  if (
    [
      "rejected",
      "cancelled",
      "canceled",
      "failed",
      "disputed",
      "suspended",
    ].includes(normalized)
  ) {
    return "bg-red-50 text-red-700 border border-red-200";
  }

  return "bg-amber-50 text-amber-700 border border-amber-200";
}

function getProviderName(booking) {
  return (
    booking?.vendorName ||
    booking?.venueName ||
    booking?.providerName ||
    booking?.businessName ||
    booking?.serviceProviderName ||
    "Provider"
  );
}

function getBookingAmount(booking) {
  return Number(
    booking?.agreedPrice ??
      booking?.finalPrice ??
      booking?.quotedPrice ??
      booking?.quotationPrice ??
      booking?.vendorQuotationPrice ??
      booking?.price ??
      0
  );
}

function getAmountPaid(booking) {
  if (booking?.amountPaid !== undefined) {
    return Number(booking.amountPaid || 0);
  }

  const amount = getBookingAmount(booking);
  const status = String(booking?.paymentStatus || "").toLowerCase();

  if (status === "paid") return amount;

  if (status === "deposit_paid") {
    return Number(booking?.depositAmount || amount * 0.5);
  }

  return 0;
}

function getRemainingBalance(booking) {
  const total = getBookingAmount(booking);
  const paid = getAmountPaid(booking);

  return Math.max(total - paid, 0);
}

function getAccountName(account) {
  const fullName = `${account?.firstName || ""} ${
    account?.lastName || ""
  }`.trim();

  return (
    fullName ||
    account?.businessName ||
    account?.name ||
    account?.email ||
    "Unknown user"
  );
}

function getVenueName(venue) {
  return (
    venue?.name ||
    venue?.businessName ||
    venue?.venueName ||
    "Unnamed venue"
  );
}

/*
 * Vendor gallery compatibility helper.
 *
 * Different versions of the vendor registration page may save
 * photos under slightly different property names. This helper
 * supports all of the common names so the admin can still see
 * the uploaded gallery.
 */
function getVendorImages(vendor) {
  const possibleImageFields = [
    vendor?.images,
    vendor?.photos,
    vendor?.gallery,
    vendor?.portfolioImages,
    vendor?.portfolio,
  ];

  for (const value of possibleImageFields) {
    if (Array.isArray(value) && value.length > 0) {
      return value.filter(Boolean);
    }
  }

  const singleImage =
    vendor?.coverImage ||
    vendor?.image ||
    vendor?.imageUrl ||
    vendor?.photo ||
    vendor?.profileImage ||
    "";

  return singleImage ? [singleImage] : [];
}

/*
 * Normalise an image value.
 *
 * This allows the admin gallery to support both:
 *
 * "data:image/..."
 *
 * and objects such as:
 *
 * { url: "...", src: "...", image: "..." }
 */
function getImageSource(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image;
  }

  if (typeof image === "object") {
    return (
      image.url ||
      image.src ||
      image.image ||
      image.imageUrl ||
      image.data ||
      ""
    );
  }

  return "";
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);

  const [activeSection, setActiveSection] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  /*
   * Vendor image viewer
   */
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedVendorImageIndex, setSelectedVendorImageIndex] =
    useState(0);

  /*
   * Venue image viewer
   */
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedVenueImageIndex, setSelectedVenueImageIndex] =
    useState(0);

  const loadData = useCallback(() => {
    try {
      const storedAdmin = JSON.parse(
        localStorage.getItem(ADMIN_SESSION_KEY) || "null"
      );

      if (!storedAdmin || storedAdmin.role !== "admin") {
        navigate("/admin/login", { replace: true });
        return;
      }

      if (
        storedAdmin.sessionExpiresAt &&
        Date.now() > Number(storedAdmin.sessionExpiresAt)
      ) {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        navigate("/admin/login", { replace: true });
        return;
      }

      const updatedAdmin = {
        ...storedAdmin,
        lastActivityAt: new Date().toISOString(),
      };

      localStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify(updatedAdmin)
      );

      setAdmin(updatedAdmin);
      setAccounts(getJson(ACCOUNTS_KEY, []));
      setVenues(getJson(VENUES_KEY, []));
      setBookings(getJson(BOOKINGS_KEY, []));
      setQuotations(getJson(QUOTATIONS_KEY, []));
      setNotifications(getJson(NOTIFICATIONS_KEY, []));
      setSecurityLogs(getJson(SECURITY_LOGS_KEY, []));
    } catch {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener("eventflow-venues-updated", handleUpdate);
    window.addEventListener("eventflow-bookings-updated", handleUpdate);
    window.addEventListener("eventflow-auth-changed", handleUpdate);
    window.addEventListener("eventflow-admin-auth-changed", handleUpdate);
    window.addEventListener("eventflow-payment-updated", handleUpdate);
    window.addEventListener("eventflow-quotations-updated", handleUpdate);
    window.addEventListener("eventflow-accounts-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    const interval = setInterval(loadData, 30000);

    return () => {
      window.removeEventListener(
        "eventflow-venues-updated",
        handleUpdate
      );
      window.removeEventListener(
        "eventflow-bookings-updated",
        handleUpdate
      );
      window.removeEventListener(
        "eventflow-auth-changed",
        handleUpdate
      );
      window.removeEventListener(
        "eventflow-admin-auth-changed",
        handleUpdate
      );
      window.removeEventListener(
        "eventflow-payment-updated",
        handleUpdate
      );
      window.removeEventListener(
        "eventflow-quotations-updated",
        handleUpdate
      );
      window.removeEventListener(
        "eventflow-accounts-updated",
        handleUpdate
      );
      window.removeEventListener("storage", handleUpdate);

      clearInterval(interval);
    };
  }, [loadData]);

  const addSecurityLog = useCallback(
    ({ type, description, severity = "info" }) => {
      const log = {
        id: createId("SEC"),
        type,
        description,
        severity,
        createdAt: new Date().toISOString(),
        adminEmail: admin?.email || "admin",
      };

      const existing = getJson(SECURITY_LOGS_KEY, []);
      const updated = [log, ...existing].slice(0, 500);

      saveJson(SECURITY_LOGS_KEY, updated);
      setSecurityLogs(updated);
    },
    [admin]
  );

  const addAdminNotification = useCallback(
    ({
      sourceId,
      type,
      title,
      message,
      severity = "info",
      linkSection = "overview",
      createdAt,
    }) => {
      const existing = getJson(NOTIFICATIONS_KEY, []);

      if (
        sourceId &&
        existing.some(
          (notification) => notification.sourceId === sourceId
        )
      ) {
        return;
      }

      const notification = {
        id: createId("NOT"),
        sourceId: sourceId || null,
        type,
        title,
        message,
        severity,
        linkSection,
        read: false,
        createdAt: createdAt || new Date().toISOString(),
      };

      const updated = [notification, ...existing].slice(0, 300);

      saveJson(NOTIFICATIONS_KEY, updated);
      setNotifications(updated);
    },
    []
  );

  useEffect(() => {
    if (!admin) return;

    const currentAccounts = getJson(ACCOUNTS_KEY, []);
    const currentVenues = getJson(VENUES_KEY, []);
    const currentBookings = getJson(BOOKINGS_KEY, []);

    currentAccounts
      .filter(
        (account) =>
          account.accountType === "vendor" &&
          String(account.status || "pending").toLowerCase() !==
            "approved"
      )
      .forEach((vendor) => {
        const vendorName =
          `${vendor.firstName || ""} ${
            vendor.lastName || ""
          }`.trim() ||
          vendor.businessName ||
          vendor.name ||
          vendor.email ||
          "A vendor";

        addAdminNotification({
          sourceId: `vendor-registration-${vendor.id}`,
          type: "vendor_registration",
          title: "New vendor registration",
          message: `${vendorName} has registered and requires review.`,
          severity: "warning",
          linkSection: "approvals",
          createdAt: vendor.createdAt,
        });
      });

    currentVenues
      .filter(
        (venue) =>
          String(venue.status || "pending").toLowerCase() ===
          "pending"
      )
      .forEach((venue) => {
        addAdminNotification({
          sourceId: `venue-registration-${venue.id}`,
          type: "venue_registration",
          title: "New venue registration",
          message: `${getVenueName(
            venue
          )} has been submitted and requires review.`,
          severity: "warning",
          linkSection: "approvals",
          createdAt: venue.createdAt,
        });
      });

    currentBookings.forEach((booking) => {
      const bookingId =
        booking.id || booking.bookingId || createId("BOOK");

      addAdminNotification({
        sourceId: `booking-created-${bookingId}`,
        type: "booking_created",
        title: "New booking activity",
        message: `${
          booking.eventName || "An event"
        } has a booking request with ${getProviderName(booking)}.`,
        severity: "info",
        linkSection: "bookings",
        createdAt: booking.createdAt,
      });
    });

    currentBookings
      .filter(
        (booking) =>
          booking.paymentStatus === "paid" ||
          booking.paymentStatus === "deposit_paid" ||
          Number(booking.amountPaid || 0) > 0
      )
      .forEach((booking) => {
        const bookingId =
          booking.id || booking.bookingId || createId("BOOK");

        addAdminNotification({
          sourceId: `payment-${bookingId}-${booking.paymentStatus}-${
            booking.amountPaid || 0
          }`,
          type: "payment",
          title: "Payment activity",
          message: `${getProviderName(
            booking
          )} booking received ${formatMoney(getAmountPaid(booking))}.`,
          severity: "success",
          linkSection: "transactions",
          createdAt:
            booking.paymentCompletedAt ||
            booking.updatedAt ||
            booking.createdAt,
        });
      });
  }, [admin, addAdminNotification]);

  const organizers = useMemo(
    () =>
      accounts.filter(
        (account) => account.accountType === "organizer"
      ),
    [accounts]
  );

  const vendors = useMemo(
    () =>
      accounts.filter(
        (account) => account.accountType === "vendor"
      ),
    [accounts]
  );

  const venueOwners = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.accountType === "venue" ||
          account.accountType === "venueOwner" ||
          account.accountType === "venue_owner"
      ),
    [accounts]
  );

  const pendingVenues = useMemo(
    () =>
      venues.filter(
        (venue) =>
          String(venue.status || "pending").toLowerCase() ===
          "pending"
      ),
    [venues]
  );

  const approvedVenues = useMemo(
    () =>
      venues.filter(
        (venue) =>
          String(venue.status || "").toLowerCase() ===
          "approved"
      ),
    [venues]
  );

  const rejectedVenues = useMemo(
    () =>
      venues.filter(
        (venue) =>
          String(venue.status || "").toLowerCase() ===
          "rejected"
      ),
    [venues]
  );

  const pendingVendors = useMemo(
    () =>
      vendors.filter(
        (vendor) =>
          String(vendor.status || "pending").toLowerCase() !==
          "approved"
      ),
    [vendors]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.read),
    [notifications]
  );

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort(
          (a, b) =>
            new Date(
              b.createdAt || b.updatedAt || 0
            ).getTime() -
            new Date(
              a.createdAt || a.updatedAt || 0
            ).getTime()
        )
        .slice(0, 10),
    [bookings]
  );

  const transactionRecords = useMemo(
    () =>
      bookings
        .filter(
          (booking) =>
            getBookingAmount(booking) > 0 ||
            Number(booking.amountPaid || 0) > 0 ||
            booking.paymentStatus
        )
        .map((booking) => ({
          ...booking,
          transactionId:
            booking.transactionId ||
            booking.paymentTransactionId ||
            booking.paymentId ||
            `TX-${booking.id || "BOOKING"}`,
          totalAmount: getBookingAmount(booking),
          paidAmount: getAmountPaid(booking),
          remainingAmount: getRemainingBalance(booking),
        }))
        .sort(
          (a, b) =>
            new Date(
              b.paymentCompletedAt ||
                b.updatedAt ||
                b.createdAt ||
                0
            ).getTime() -
            new Date(
              a.paymentCompletedAt ||
                a.updatedAt ||
                a.createdAt ||
                0
            ).getTime()
        ),
    [bookings]
  );

  const platformValue = useMemo(
    () =>
      bookings.reduce(
        (total, booking) => total + getBookingAmount(booking),
        0
      ),
    [bookings]
  );

  const collectedAmount = useMemo(
    () =>
      bookings.reduce(
        (total, booking) => total + getAmountPaid(booking),
        0
      ),
    [bookings]
  );

  const outstandingAmount = useMemo(
    () =>
      bookings.reduce(
        (total, booking) =>
          total + getRemainingBalance(booking),
        0
      ),
    [bookings]
  );

  const completedPayments = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          String(booking.paymentStatus || "").toLowerCase() ===
          "paid"
      ).length,
    [bookings]
  );

  const securityAlerts = useMemo(
    () =>
      securityLogs.filter((log) =>
        ["high", "critical"].includes(
          String(log.severity || "").toLowerCase()
        )
      ),
    [securityLogs]
  );

  const updateVenueStatus = (venueId, status) => {
    const action =
      status === "approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this venue?`
    );

    if (!confirmed) return;

    const currentVenues = getJson(VENUES_KEY, []);

    const updatedVenues = currentVenues.map((venue) => {
      if (String(venue.id) !== String(venueId)) {
        return venue;
      }

      return {
        ...venue,
        status,
        updatedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: admin?.email || "admin",
      };
    });

    saveJson(VENUES_KEY, updatedVenues);
    setVenues(updatedVenues);

    const venue = currentVenues.find(
      (item) => String(item.id) === String(venueId)
    );

    const venueName = getVenueName(venue);

    addSecurityLog({
      type: `venue_${status}`,
      description: `${venueName} was ${status} by ${
        admin?.email || "admin"
      }.`,
      severity: status === "rejected" ? "high" : "info",
    });

    addAdminNotification({
      sourceId: `venue-review-${venueId}-${status}`,
      type: "venue_review",
      title:
        status === "approved"
          ? "Venue approved"
          : "Venue rejected",
      message: `${venueName} has been ${status}.`,
      severity: status === "approved" ? "success" : "warning",
      linkSection: "approvals",
    });

    window.dispatchEvent(
      new Event("eventflow-venues-updated")
    );
  };

  const updateVendorStatus = (vendorId, status) => {
    const action =
      status === "approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this vendor?`
    );

    if (!confirmed) return;

    const currentAccounts = getJson(ACCOUNTS_KEY, []);

    const updatedAccounts = currentAccounts.map((account) => {
      if (String(account.id) !== String(vendorId)) {
        return account;
      }

      return {
        ...account,
        status,
        updatedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: admin?.email || "admin",
      };
    });

    saveJson(ACCOUNTS_KEY, updatedAccounts);
    setAccounts(updatedAccounts);

    const vendor = currentAccounts.find(
      (item) => String(item.id) === String(vendorId)
    );

    const vendorName = getAccountName(vendor);

    addSecurityLog({
      type: `vendor_${status}`,
      description: `${vendorName} was ${status} by ${
        admin?.email || "admin"
      }.`,
      severity: status === "rejected" ? "high" : "info",
    });

    addAdminNotification({
      sourceId: `vendor-review-${vendorId}-${status}`,
      type: "vendor_review",
      title:
        status === "approved"
          ? "Vendor approved"
          : "Vendor rejected",
      message: `${vendorName} has been ${status}.`,
      severity: status === "approved" ? "success" : "warning",
      linkSection: "approvals",
    });

    window.dispatchEvent(
      new Event("eventflow-auth-changed")
    );

    window.dispatchEvent(
      new Event("eventflow-accounts-updated")
    );
  };

  const deleteVenue = (venueId) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this venue registration?"
    );

    if (!confirmed) return;

    const currentVenues = getJson(VENUES_KEY, []);

    const venue = currentVenues.find(
      (item) => String(item.id) === String(venueId)
    );

    const updatedVenues = currentVenues.filter(
      (item) => String(item.id) !== String(venueId)
    );

    saveJson(VENUES_KEY, updatedVenues);
    setVenues(updatedVenues);

    addSecurityLog({
      type: "venue_deleted",
      description: `${getVenueName(
        venue
      )} was permanently deleted by ${admin?.email || "admin"}.`,
      severity: "high",
    });

    window.dispatchEvent(
      new Event("eventflow-venues-updated")
    );
  };

  const markNotificationRead = (notificationId) => {
    const current = getJson(NOTIFICATIONS_KEY, []);

    const updated = current.map((item) =>
      item.id === notificationId
        ? { ...item, read: true }
        : item
    );

    saveJson(NOTIFICATIONS_KEY, updated);
    setNotifications(updated);
  };

  const markAllNotificationsRead = () => {
    const current = getJson(NOTIFICATIONS_KEY, []);

    const updated = current.map((item) => ({
      ...item,
      read: true,
    }));

    saveJson(NOTIFICATIONS_KEY, updated);
    setNotifications(updated);
  };

  const navigateToSection = (section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    setNotificationOpen(false);
  };

  const logout = () => {
    addSecurityLog({
      type: "admin_logout",
      description: `${admin?.email || "Admin"} signed out of the admin console.`,
      severity: "info",
    });

    localStorage.removeItem(ADMIN_SESSION_KEY);

    window.dispatchEvent(
      new Event("eventflow-admin-auth-changed")
    );

    navigate("/admin/login", { replace: true });
  };

  const openVendorGallery = (vendor) => {
    const images = getVendorImages(vendor);

    if (images.length === 0) return;

    setSelectedVendor(vendor);
    setSelectedVendorImageIndex(0);
  };

  const closeVendorGallery = () => {
    setSelectedVendor(null);
    setSelectedVendorImageIndex(0);
  };

  const showNextVendorImage = () => {
    if (!selectedVendor) return;

    const images = getVendorImages(selectedVendor);

    if (images.length === 0) return;

    setSelectedVendorImageIndex((current) =>
      current >= images.length - 1 ? 0 : current + 1
    );
  };

  const showPreviousVendorImage = () => {
    if (!selectedVendor) return;

    const images = getVendorImages(selectedVendor);

    if (images.length === 0) return;

    setSelectedVendorImageIndex((current) =>
      current <= 0 ? images.length - 1 : current - 1
    );
  };

  const openVenueGallery = (venue) => {
    const images = Array.isArray(venue?.images)
      ? venue.images
      : [];

    if (images.length === 0) return;

    setSelectedVenue(venue);
    setSelectedVenueImageIndex(0);
  };

  const closeVenueGallery = () => {
    setSelectedVenue(null);
    setSelectedVenueImageIndex(0);
  };

  const showNextVenueImage = () => {
    if (!selectedVenue) return;

    const images = Array.isArray(selectedVenue?.images)
      ? selectedVenue.images
      : [];

    if (images.length === 0) return;

    setSelectedVenueImageIndex((current) =>
      current >= images.length - 1 ? 0 : current + 1
    );
  };

  const showPreviousVenueImage = () => {
    if (!selectedVenue) return;

    const images = Array.isArray(selectedVenue?.images)
      ? selectedVenue.images
      : [];

    if (images.length === 0) return;

    setSelectedVenueImageIndex((current) =>
      current <= 0 ? images.length - 1 : current - 1
    );
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (selectedVendor) {
        if (event.key === "Escape") {
          closeVendorGallery();
        }

        if (event.key === "ArrowRight") {
          showNextVendorImage();
        }

        if (event.key === "ArrowLeft") {
          showPreviousVendorImage();
        }
      }

      if (selectedVenue) {
        if (event.key === "Escape") {
          closeVenueGallery();
        }

        if (event.key === "ArrowRight") {
          showNextVenueImage();
        }

        if (event.key === "ArrowLeft") {
          showPreviousVenueImage();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedVendor, selectedVenue]);

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return transactionRecords;

    return transactionRecords.filter((transaction) => {
      const searchable = [
        transaction.transactionId,
        transaction.id,
        transaction.bookingId,
        transaction.eventName,
        transaction.organizerName,
        transaction.organizerEmail,
        getProviderName(transaction),
        transaction.paymentStatus,
        transaction.paymentOption,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [searchTerm, transactionRecords]);

  const navItems = [
    {
      id: "overview",
      label: "Overview",
      icon: "⌂",
    },
    {
      id: "approvals",
      label: "Approvals",
      icon: "✓",
      count: pendingVenues.length + pendingVendors.length,
      href: "/admin/approvals",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: "₵",
      href: "/admin/analytics",
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: "₵",
      count: transactionRecords.length,
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: "▣",
      count: bookings.length,
    },
    {
      id: "users",
      label: "Users",
      icon: "◎",
      count: accounts.length,
    },
    {
      id: "security",
      label: "Security & Audit",
      icon: "⌘",
      count: securityAlerts.length,
    },
  ];

  const sectionTitles = {
    overview: "Overview",
    approvals: "Provider Approvals",
    transactions: "Transactions",
    bookings: "Bookings",
    users: "Users",
    security: "Security & Audit",
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />

          <p className="text-sm text-slate-400">
            Loading EventFlow Admin Console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* =========================
          VENDOR PHOTO VIEWER
      ========================== */}
      {selectedVendor && (
        <VendorGalleryModal
          vendor={selectedVendor}
          images={getVendorImages(selectedVendor)}
          currentIndex={selectedVendorImageIndex}
          onClose={closeVendorGallery}
          onNext={showNextVendorImage}
          onPrevious={showPreviousVendorImage}
          onSelect={setSelectedVendorImageIndex}
        />
      )}

      {/* =========================
          VENUE PHOTO VIEWER
      ========================== */}
      {selectedVenue && (
        <VenueGalleryModal
          venue={selectedVenue}
          images={Array.isArray(selectedVenue?.images)
            ? selectedVenue.images
            : []}
          currentIndex={selectedVenueImageIndex}
          onClose={closeVenueGallery}
          onNext={showNextVenueImage}
          onPrevious={showPreviousVenueImage}
          onSelect={setSelectedVenueImageIndex}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col bg-slate-950 text-white shadow-2xl transition-transform duration-300 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-20 items-center border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold shadow-lg">
              EF
            </div>

            <div>
              <p className="font-bold tracking-tight">
                EventFlow
              </p>

              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Admin Console
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-5">
          <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Management
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.href) {
                    navigate(item.href);
                    return;
                  }
                  navigateToSection(item.id);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  activeSection === item.id
                    ? "bg-white text-slate-950 shadow-lg"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/10 text-base">
                  {item.icon}
                </span>

                <span className="flex-1">
                  {item.label}
                </span>

                {item.count !== undefined &&
                  item.count > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        activeSection === item.id
                          ? "bg-slate-100 text-slate-700"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {item.count > 99
                        ? "99+"
                        : item.count}
                    </span>
                  )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 p-4">
          <div className="mb-3 rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-slate-500">
              Signed in as
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-white">
              {admin.email || "Administrator"}
            </p>

            <p className="mt-1 text-[11px] text-emerald-400">
              ● Admin session active
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <span>↪</span>
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(!mobileMenuOpen)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
              >
                ☰
              </button>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  EventFlow Administration
                </p>

                <h1 className="text-xl font-bold tracking-tight text-slate-950">
                  {sectionTitles[activeSection]}
                </h1>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setNotificationOpen(!notificationOpen)
                }
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg shadow-sm transition hover:bg-slate-50"
              >
                🔔

                {unreadNotifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                    {unreadNotifications.length > 9
                      ? "9+"
                      : unreadNotifications.length}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                    <div>
                      <p className="font-bold text-slate-950">
                        Notifications
                      </p>

                      <p className="text-xs text-slate-500">
                        Platform activity
                      </p>
                    </div>

                    {unreadNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <div className="text-3xl">🔔</div>

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          No notifications
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          New platform activity will appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 20).map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => {
                            markNotificationRead(item.id);
                            navigateToSection(
                              item.linkSection || "overview"
                            );
                          }}
                          className={`block w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${
                            item.read
                              ? "bg-white"
                              : "bg-indigo-50/50"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                                item.severity ===
                                "warning"
                                  ? "bg-amber-100 text-amber-700"
                                  : item.severity ===
                                    "success"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-indigo-100 text-indigo-700"
                              }`}
                            >
                              {item.severity ===
                              "warning"
                                ? "!"
                                : item.severity ===
                                  "success"
                                ? "✓"
                                : "i"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-800">
                                  {item.title}
                                </p>

                                {!item.read && (
                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                                )}
                              </div>

                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {item.message}
                              </p>

                              <p className="mt-2 text-[10px] text-slate-400">
                                {formatDateTime(
                                  item.createdAt
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {/* =========================
              OVERVIEW
          ========================== */}
          {activeSection === "overview" && (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 text-white shadow-xl sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-200">
                      EventFlow Platform
                    </p>

                    <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                      Good day, Administrator.
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                      Manage providers, bookings, users,
                      transactions and platform activity from
                      one central console.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                    <p className="text-xs text-indigo-200">
                      Session
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {admin.email}
                    </p>

                    <p className="mt-2 text-xs text-indigo-200">
                      Last activity
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {formatDateTime(
                        admin.lastActivityAt
                      )}
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total Users"
                  value={accounts.length}
                  detail={`${organizers.length} organizers`}
                  icon="◎"
                />

                <StatCard
                  label="Approved Venues"
                  value={approvedVenues.length}
                  detail={`${pendingVenues.length} awaiting review`}
                  icon="⌂"
                />

                <StatCard
                  label="Bookings"
                  value={bookings.length}
                  detail={`${completedPayments} fully paid`}
                  icon="▣"
                />

                <StatCard
                  label="Pending Reviews"
                  value={
                    pendingVenues.length +
                    pendingVendors.length
                  }
                  detail={`${pendingVendors.length} vendors`}
                  icon="✓"
                />
              </section>

              <section className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                        Financial overview
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-slate-950">
                        Platform activity
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigateToSection("transactions")
                      }
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      View transactions →
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <FinancialCard
                      label="Booking Value"
                      value={formatMoney(platformValue)}
                    />

                    <FinancialCard
                      label="Collected"
                      value={formatMoney(collectedAmount)}
                    />

                    <FinancialCard
                      label="Outstanding"
                      value={formatMoney(outstandingAmount)}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Attention required
                  </p>

                  <div className="mt-5 space-y-3">
                    <AttentionCard
                      label="Venue approvals"
                      count={pendingVenues.length}
                      onClick={() =>
                        navigateToSection("approvals")
                      }
                    />

                    <AttentionCard
                      label="Vendor approvals"
                      count={pendingVendors.length}
                      onClick={() =>
                        navigateToSection("approvals")
                      }
                    />

                    <AttentionCard
                      label="Security alerts"
                      count={securityAlerts.length}
                      onClick={() =>
                        navigateToSection("security")
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                      Activity
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-slate-950">
                      Recent bookings
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigateToSection("bookings")
                    }
                    className="text-sm font-semibold text-indigo-600"
                  >
                    View all →
                  </button>
                </div>

                {recentBookings.length === 0 ? (
                  <EmptyState
                    icon="▣"
                    title="No bookings yet"
                    text="Booking activity will appear here once organizers start making requests."
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentBookings.map((booking) => (
                      <div
                        key={
                          booking.id ||
                          booking.bookingId ||
                          Math.random()
                        }
                        className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            ▣
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {booking.eventName ||
                                "Untitled event"}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {getProviderName(booking)} ·{" "}
                              {formatDate(
                                booking.eventDate ||
                                  booking.date
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">
                              {formatMoney(
                                getBookingAmount(booking)
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {formatDateTime(
                                booking.createdAt
                              )}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              booking.status
                            )}`}
                          >
                            {booking.status || "Pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* =========================
              APPROVALS
          ========================== */}
          {activeSection === "approvals" && (
            <div className="space-y-6">
              <PageHeader
                eyebrow="Provider verification"
                title="Approvals"
                description="Review and manage venue and vendor registrations before they become active on EventFlow."
              />

              {/* VENUES */}
              <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">
                        Venue registrations
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Verify venue information and uploaded
                        gallery images.
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      {pendingVenues.length} pending
                    </span>
                  </div>
                </div>

                {venues.length === 0 ? (
                  <EmptyState
                    icon="⌂"
                    title="No venue registrations"
                    text="Venue owners will appear here after submitting their registration."
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {venues.map((venue) => {
                      const images = Array.isArray(
                        venue.images
                      )
                        ? venue.images
                        : [];

                      const ownerName =
                        venue.ownerName ||
                        venue.businessName ||
                        venue.email ||
                        "Venue owner";

                      return (
                        <div
                          key={venue.id}
                          className="p-6"
                        >
                          <div className="flex flex-col gap-5 xl:flex-row">
                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() =>
                                  openVenueGallery(
                                    venue
                                  )
                                }
                                disabled={
                                  images.length === 0
                                }
                                className="group relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-slate-100 text-left disabled:cursor-default"
                              >
                                {venue.coverImage ||
                                venue.image ||
                                venue.imageUrl ||
                                images[0] ? (
                                  <>
                                    <img
                                      src={
                                        venue.coverImage ||
                                        venue.image ||
                                        venue.imageUrl ||
                                        images[0]
                                      }
                                      alt={getVenueName(
                                        venue
                                      )}
                                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    />

                                    {images.length >
                                      0 && (
                                      <span className="absolute inset-x-2 bottom-2 rounded-lg bg-slate-950/70 px-2 py-1 text-center text-[10px] font-bold text-white backdrop-blur">
                                        View gallery ·{" "}
                                        {images.length}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">
                                    ⌂
                                  </div>
                                )}
                              </button>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-bold text-slate-950">
                                    {getVenueName(
                                      venue
                                    )}
                                  </h4>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusClasses(
                                      venue.status
                                    )}`}
                                  >
                                    {venue.status ||
                                      "Pending"}
                                  </span>
                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                  {venue.venueType ||
                                    "Event venue"}{" "}
                                  ·{" "}
                                  {venue.location ||
                                    "Location not provided"}
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                  Submitted{" "}
                                  {formatDate(
                                    venue.createdAt
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <InfoItem
                                label="Owner"
                                value={ownerName}
                              />

                              <InfoItem
                                label="Capacity"
                                value={
                                  venue.capacity
                                    ? `${Number(
                                        venue.capacity
                                      ).toLocaleString()} guests`
                                    : "—"
                                }
                              />

                              <InfoItem
                                label="Starting price"
                                value={
                                  venue.price
                                    ? formatMoney(
                                        venue.price
                                      )
                                    : "—"
                                }
                              />

                              <InfoItem
                                label="Gallery"
                                value={`${images.length} photo${
                                  images.length === 1
                                    ? ""
                                    : "s"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs text-slate-400">
                                Contact
                              </p>

                              <p className="mt-1 text-sm font-medium text-slate-700">
                                {venue.email ||
                                  venue.ownerEmail ||
                                  "No email"}
                                {venue.phone
                                  ? ` · ${venue.phone}`
                                  : ""}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {String(
                                venue.status || "pending"
                              ).toLowerCase() !==
                                "approved" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateVenueStatus(
                                      venue.id,
                                      "approved"
                                    )
                                  }
                                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                              )}

                              {String(
                                venue.status || "pending"
                              ).toLowerCase() !==
                                "rejected" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateVenueStatus(
                                      venue.id,
                                      "rejected"
                                    )
                                  }
                                  className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                                >
                                  Reject
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  deleteVenue(venue.id)
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* VENDORS */}
              <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">
                        Vendor registrations
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Review vendor information and portfolio
                        photos before activating their marketplace
                        profile.
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      {pendingVendors.length} pending
                    </span>
                  </div>
                </div>

                {vendors.length === 0 ? (
                  <EmptyState
                    icon="◎"
                    title="No vendor registrations"
                    text="Vendor accounts will appear here after registration."
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {vendors.map((vendor) => {
                      const vendorImages =
                        getVendorImages(vendor);

                      const vendorName =
                        getAccountName(vendor);

                      const isApproved =
                        String(
                          vendor.status || "pending"
                        ).toLowerCase() === "approved";

                      const isRejected =
                        String(
                          vendor.status || ""
                        ).toLowerCase() === "rejected";

                      return (
                        <div
                          key={vendor.id}
                          className="p-6"
                        >
                          <div className="flex flex-col gap-6 xl:flex-row">
                            {/* Vendor identity */}
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                                {(
                                  vendor.firstName ||
                                  vendor.businessName ||
                                  vendor.email ||
                                  "V"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-bold text-slate-950">
                                    {vendorName}
                                  </h4>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusClasses(
                                      vendor.status
                                    )}`}
                                  >
                                    {vendor.status ||
                                      "Pending"}
                                  </span>
                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                  {vendor.email ||
                                    "No email"}
                                </p>

                                {vendor.phone && (
                                  <p className="mt-1 text-sm text-slate-500">
                                    {vendor.phone}
                                  </p>
                                )}

                                {vendor.businessName &&
                                  vendor.businessName !==
                                    vendorName && (
                                    <p className="mt-2 text-xs text-slate-400">
                                      Business:{" "}
                                      <span className="font-medium text-slate-600">
                                        {
                                          vendor.businessName
                                        }
                                      </span>
                                    </p>
                                  )}

                                <p className="mt-2 text-xs text-slate-400">
                                  Registered{" "}
                                  {formatDate(
                                    vendor.createdAt
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Vendor gallery */}
                            <div className="w-full xl:max-w-[500px]">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                                    Portfolio
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {vendorImages.length} photo
                                    {vendorImages.length ===
                                    1
                                      ? ""
                                      : "s"}{" "}
                                    uploaded
                                  </p>
                                </div>

                                {vendorImages.length >
                                  0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openVendorGallery(
                                        vendor
                                      )
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-indigo-600 transition hover:border-indigo-200 hover:bg-indigo-50"
                                  >
                                    View all
                                  </button>
                                )}
                              </div>

                              {vendorImages.length ===
                              0 ? (
                                <div className="flex min-h-[110px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                                  <div>
                                    <div className="text-2xl text-slate-300">
                                      ▧
                                    </div>

                                    <p className="mt-2 text-xs font-semibold text-slate-500">
                                      No portfolio photos
                                    </p>

                                    <p className="mt-1 text-[11px] text-slate-400">
                                      This vendor has not uploaded
                                      photos.
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-4 gap-2">
                                  {vendorImages
                                    .slice(0, 4)
                                    .map(
                                      (
                                        image,
                                        index
                                      ) => {
                                        const src =
                                          getImageSource(
                                            image
                                          );

                                        return (
                                          <button
                                            type="button"
                                            key={`${vendor.id}-image-${index}`}
                                            onClick={() => {
                                              setSelectedVendor(
                                                vendor
                                              );
                                              setSelectedVendorImageIndex(
                                                index
                                              );
                                            }}
                                            className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100"
                                          >
                                            {src ? (
                                              <img
                                                src={src}
                                                alt={`${vendorName} portfolio ${
                                                  index +
                                                  1
                                                }`}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                              />
                                            ) : (
                                              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                                Image
                                              </div>
                                            )}

                                            {index ===
                                              3 &&
                                              vendorImages.length >
                                                4 && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
                                                  <span className="text-sm font-bold text-white">
                                                    +
                                                    {vendorImages.length -
                                                      4}
                                                  </span>
                                                </div>
                                              )}

                                            <div className="absolute inset-0 bg-slate-950/0 transition group-hover:bg-slate-950/20" />
                                          </button>
                                        );
                                      }
                                    )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Vendor review information */}
                          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                            <InfoItem
                              label="Account type"
                              value="Service provider"
                            />

                            <InfoItem
                              label="Gallery"
                              value={`${vendorImages.length} photo${
                                vendorImages.length ===
                                1
                                  ? ""
                                  : "s"
                              }`}
                            />

                            <InfoItem
                              label="Registration"
                              value={formatDate(
                                vendor.createdAt
                              )}
                            />

                            <InfoItem
                              label="Verification"
                              value={
                                isApproved
                                  ? "Approved"
                                  : isRejected
                                  ? "Rejected"
                                  : "Pending review"
                              }
                            />
                          </div>

                          {/* Vendor actions */}
                          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs text-slate-400">
                                Approval control
                              </p>

                              <p className="mt-1 text-sm text-slate-600">
                                Review the vendor's profile and
                                portfolio before making the account
                                publicly available.
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {vendorImages.length >
                                0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openVendorGallery(
                                      vendor
                                    )
                                  }
                                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                  Review photos
                                </button>
                              )}

                              {!isApproved && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateVendorStatus(
                                      vendor.id,
                                      "approved"
                                    )
                                  }
                                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                              )}

                              {!isRejected && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateVendorStatus(
                                      vendor.id,
                                      "rejected"
                                    )
                                  }
                                  className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* =========================
              TRANSACTIONS
          ========================== */}
          {activeSection === "transactions" && (
            <div className="space-y-6">
              <PageHeader
                eyebrow="Financial activity"
                title="Transactions"
                description="Monitor agreed booking values, payments received and outstanding balances."
              />

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Booking Value"
                  value={formatMoney(platformValue)}
                  detail={`${bookings.length} bookings`}
                  icon="₵"
                />

                <StatCard
                  label="Collected"
                  value={formatMoney(collectedAmount)}
                  detail="Payments received"
                  icon="✓"
                />

                <StatCard
                  label="Outstanding"
                  value={formatMoney(outstandingAmount)}
                  detail="Remaining balances"
                  icon="◷"
                />

                <StatCard
                  label="Fully Paid"
                  value={completedPayments}
                  detail="Completed payments"
                  icon="◆"
                />
              </section>

              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      Transaction records
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Payment activity linked to EventFlow
                      bookings.
                    </p>
                  </div>

                  <div className="relative w-full lg:w-80">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ⌕
                    </span>

                    <input
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                      placeholder="Search transactions..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                {filteredTransactions.length === 0 ? (
                  <EmptyState
                    icon="₵"
                    title="No transactions found"
                    text={
                      searchTerm
                        ? "Try another search term."
                        : "Payment records will appear here when bookings receive payments."
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          <th className="px-6 py-4">
                            Transaction
                          </th>

                          <th className="px-6 py-4">
                            Booking
                          </th>

                          <th className="px-6 py-4">
                            Provider
                          </th>

                          <th className="px-6 py-4">
                            Agreed
                          </th>

                          <th className="px-6 py-4">
                            Paid
                          </th>

                          <th className="px-6 py-4">
                            Balance
                          </th>

                          <th className="px-6 py-4">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredTransactions.map(
                          (transaction) => (
                            <tr
                              key={`${transaction.transactionId}-${transaction.id}`}
                              className="transition hover:bg-slate-50"
                            >
                              <td className="px-6 py-4">
                                <p className="font-mono text-xs font-semibold text-slate-700">
                                  {
                                    transaction.transactionId
                                  }
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                  {formatDateTime(
                                    transaction.paymentCompletedAt ||
                                      transaction.updatedAt ||
                                      transaction.createdAt
                                  )}
                                </p>
                              </td>

                              <td className="px-6 py-4">
                                <p className="font-semibold text-slate-800">
                                  {transaction.eventName ||
                                    "Event booking"}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {transaction.id ||
                                    transaction.bookingId ||
                                    "—"}
                                </p>
                              </td>

                              <td className="px-6 py-4 text-sm text-slate-600">
                                {getProviderName(
                                  transaction
                                )}
                              </td>

                              <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                                {formatMoney(
                                  transaction.totalAmount
                                )}
                              </td>

                              <td className="px-6 py-4 text-sm font-semibold text-emerald-700">
                                {formatMoney(
                                  transaction.paidAmount
                                )}
                              </td>

                              <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                                {formatMoney(
                                  transaction.remainingAmount
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusClasses(
                                    transaction.paymentStatus ||
                                      "unpaid"
                                  )}`}
                                >
                                  {transaction.paymentStatus ||
                                    "unpaid"}
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* =========================
              BOOKINGS
          ========================== */}
          {activeSection === "bookings" && (
            <div className="space-y-6">
              <PageHeader
                eyebrow="Marketplace activity"
                title="Bookings"
                description="Monitor organizer requests, provider agreements and booking status across EventFlow."
              />

              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {bookings.length === 0 ? (
                  <EmptyState
                    icon="▣"
                    title="No bookings"
                    text="Booking requests will appear here as organizers use the marketplace."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          <th className="px-6 py-4">
                            Event
                          </th>

                          <th className="px-6 py-4">
                            Organizer
                          </th>

                          <th className="px-6 py-4">
                            Provider
                          </th>

                          <th className="px-6 py-4">
                            Event date
                          </th>

                          <th className="px-6 py-4">
                            Value
                          </th>

                          <th className="px-6 py-4">
                            Status
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {bookings.map((booking) => (
                          <tr
                            key={
                              booking.id ||
                              booking.bookingId ||
                              Math.random()
                            }
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-6 py-5">
                              <p className="font-semibold text-slate-800">
                                {booking.eventName ||
                                  "Untitled event"}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {booking.eventType ||
                                  "Event"}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <p className="text-sm font-medium text-slate-700">
                                {booking.organizerName ||
                                  booking.organizerEmail ||
                                  "Organizer"}
                              </p>

                              {booking.organizerEmail && (
                                <p className="mt-1 text-xs text-slate-400">
                                  {
                                    booking.organizerEmail
                                  }
                                </p>
                              )}
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-600">
                              {getProviderName(booking)}
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-600">
                              {formatDate(
                                booking.eventDate ||
                                  booking.date
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <p className="text-sm font-bold text-slate-800">
                                {formatMoney(
                                  getBookingAmount(
                                    booking
                                  )
                                )}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Paid{" "}
                                {formatMoney(
                                  getAmountPaid(
                                    booking
                                  )
                                )}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusClasses(
                                  booking.status
                                )}`}
                              >
                                {booking.status ||
                                  "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* =========================
              USERS
          ========================== */}
          {activeSection === "users" && (
            <div className="space-y-6">
              <PageHeader
                eyebrow="Platform accounts"
                title="Users"
                description="View the different account types registered across the EventFlow marketplace."
              />

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="All users"
                  value={accounts.length}
                  detail="Registered accounts"
                  icon="◎"
                />

                <StatCard
                  label="Organizers"
                  value={organizers.length}
                  detail="Event organizers"
                  icon="◉"
                />

                <StatCard
                  label="Vendors"
                  value={vendors.length}
                  detail={`${pendingVendors.length} awaiting approval`}
                  icon="◆"
                />

                <StatCard
                  label="Venue owners"
                  value={venueOwners.length}
                  detail="Venue providers"
                  icon="⌂"
                />
              </section>

              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {accounts.length === 0 ? (
                  <EmptyState
                    icon="◎"
                    title="No users registered"
                    text="New EventFlow accounts will appear here."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          <th className="px-6 py-4">
                            Account
                          </th>

                          <th className="px-6 py-4">
                            Email
                          </th>

                          <th className="px-6 py-4">
                            Role
                          </th>

                          <th className="px-6 py-4">
                            Status
                          </th>

                          <th className="px-6 py-4">
                            Registered
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {accounts.map((account) => (
                          <tr
                            key={account.id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                                  {getAccountName(
                                    account
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {getAccountName(
                                      account
                                    )}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-600">
                              {account.email || "—"}
                            </td>

                            <td className="px-6 py-5">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase text-slate-600">
                                {account.accountType ||
                                  "Unknown"}
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusClasses(
                                  account.status ||
                                    "active"
                                )}`}
                              >
                                {account.status ||
                                  "Active"}
                              </span>
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-500">
                              {formatDate(
                                account.createdAt
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* =========================
              SECURITY
          ========================== */}
          {activeSection === "security" && (
            <div className="space-y-6">
              <PageHeader
                eyebrow="Platform protection"
                title="Security & Audit"
                description="Review administrative activity and important platform events."
              />

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Admin session"
                  value="Active"
                  detail={admin.email}
                  icon="●"
                />

                <StatCard
                  label="Audit records"
                  value={securityLogs.length}
                  detail="Recorded events"
                  icon="⌘"
                />

                <StatCard
                  label="High priority"
                  value={securityAlerts.length}
                  detail="Requires attention"
                  icon="!"
                />

                <StatCard
                  label="Session expiry"
                  value={
                    admin.sessionExpiresAt
                      ? formatDate(
                          admin.sessionExpiresAt
                        )
                      : "Not set"
                  }
                  detail="Current admin session"
                  icon="◷"
                />
              </section>

              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h3 className="text-lg font-bold text-slate-950">
                    Audit log
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Administrative actions and important system
                    events.
                  </p>
                </div>

                {securityLogs.length === 0 ? (
                  <EmptyState
                    icon="⌘"
                    title="No audit records"
                    text="Security and administrative activity will appear here."
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {securityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="flex gap-4">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                              log.severity ===
                                "critical" ||
                              log.severity === "high"
                                ? "bg-red-50 text-red-600"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {log.severity ===
                              "critical" ||
                            log.severity === "high"
                              ? "!"
                              : "✓"}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-800">
                                {log.type ||
                                  "System event"}
                              </p>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${getStatusClasses(
                                  log.severity
                                )}`}
                              >
                                {log.severity ||
                                  "info"}
                              </span>
                            </div>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {log.description}
                            </p>

                            <p className="mt-2 text-[10px] text-slate-400">
                              {log.adminEmail || "System"} ·{" "}
                              {formatDateTime(
                                log.createdAt
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    !
                  </div>

                  <div>
                    <h3 className="font-bold text-amber-900">
                      Development security notice
                    </h3>

                    <p className="mt-1 max-w-3xl text-sm leading-6 text-amber-800">
                      EventFlow currently stores authentication,
                      account, booking and administrative data in
                      browser localStorage. This is suitable for
                      the current prototype, but production
                      deployment should move authentication,
                      authorization, provider approval and
                      financial records to a secure backend with
                      server-side access controls.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function VendorGalleryModal({
  vendor,
  images,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
  onSelect,
}) {
  const currentImage = getImageSource(
    images[currentIndex]
  );

  const vendorName = getAccountName(vendor);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
      <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
              Vendor portfolio review
            </p>

            <h3 className="mt-1 truncate text-lg font-bold text-white">
              {vendorName}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Photo {currentIndex + 1} of {images.length}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10"
          >
            ×
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-slate-950 p-4 sm:p-8">
          {currentImage ? (
            <img
              src={currentImage}
              alt={`${vendorName} portfolio`}
              className="max-h-[65vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          ) : (
            <div className="text-sm text-slate-400">
              Image could not be displayed.
            </div>
          )}

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={onPrevious}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-xl text-white shadow-lg backdrop-blur transition hover:bg-slate-800"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={onNext}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-xl text-white shadow-lg backdrop-blur transition hover:bg-slate-800"
              >
                ›
              </button>
            </>
          )}
        </div>

        <div className="border-t border-white/10 bg-slate-950 px-4 py-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => {
              const src = getImageSource(image);

              return (
                <button
                  type="button"
                  key={`gallery-${index}`}
                  onClick={() => onSelect(index)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    index === currentIndex
                      ? "border-indigo-400"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={`Portfolio ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-800 text-[10px] text-slate-400">
                      Image
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function VenueGalleryModal({
  venue,
  images,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
  onSelect,
}) {
  const currentImage = getImageSource(
    images[currentIndex]
  );

  const venueName = getVenueName(venue);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
      <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
              Venue gallery review
            </p>

            <h3 className="mt-1 truncate text-lg font-bold text-white">
              {venueName}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Photo {currentIndex + 1} of {images.length}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10"
          >
            ×
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-slate-950 p-4 sm:p-8">
          {currentImage ? (
            <img
              src={currentImage}
              alt={`${venueName} gallery`}
              className="max-h-[65vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          ) : (
            <div className="text-sm text-slate-400">
              Image could not be displayed.
            </div>
          )}

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={onPrevious}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-xl text-white shadow-lg backdrop-blur transition hover:bg-slate-800"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={onNext}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-xl text-white shadow-lg backdrop-blur transition hover:bg-slate-800"
              >
                ›
              </button>
            </>
          )}
        </div>

        <div className="border-t border-white/10 bg-slate-950 px-4 py-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => {
              const src = getImageSource(image);

              return (
                <button
                  type="button"
                  key={`venue-gallery-${index}`}
                  onClick={() => onSelect(index)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    index === currentIndex
                      ? "border-indigo-400"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={`Venue photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-800 text-[10px] text-slate-400">
                      Image
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description }) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        {title}
      </h2>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
        {description}
      </p>
    </section>
  );
}

function StatCard({ label, value, detail, icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {detail}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FinancialCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function AttentionCard({ label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-indigo-600 shadow-sm">
        {count}
      </div>

      <span className="flex-1 text-sm font-semibold text-slate-700">
        {label}
      </span>

      <span className="text-slate-400">→</span>
    </button>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
        {icon}
      </div>

      <h3 className="mt-4 font-bold text-slate-800">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}