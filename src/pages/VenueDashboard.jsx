import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

/* ============================================================
   STORAGE
============================================================ */

const VENUES_KEY = "eventflowVenues";
const BOOKINGS_KEY = "eventflowBookings";
const QUOTATIONS_KEY = "eventflowQuotations";

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

function getVenues() {
  return getArray(VENUES_KEY);
}

function getBookings() {
  return getArray(BOOKINGS_KEY);
}

function getQuotations() {
  return getArray(QUOTATIONS_KEY);
}

function saveVenues(venues) {
  localStorage.setItem(VENUES_KEY, JSON.stringify(venues));
  window.dispatchEvent(new Event("eventflow-venues-updated"));
}

function saveBookings(bookings) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  window.dispatchEvent(new Event("eventflow-bookings-updated"));
  window.dispatchEvent(new Event("eventflow-booking-updated"));
}

/* ============================================================
   HELPERS
============================================================ */

function getId(item) {
  return item?.id ?? item?._id;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getBookingStatus(booking) {
  return normalize(
    booking?.status ||
      booking?.quotationStatus ||
      "pending"
  );
}

function getNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function getOrganizerCounterPrice(booking) {
  return getNumber(
    booking?.organizerCounterPrice ??
      booking?.organizerCounterOffer ??
      booking?.counterOfferPrice ??
      booking?.counterOffer
  );
}

function getVenueCounterPrice(booking) {
  return getNumber(
    booking?.venueCounterPrice ??
      booking?.venueCounterOffer ??
      booking?.venueQuotePrice ??
      booking?.vendorCounterPrice ??
      booking?.vendorCounterOffer ??
      booking?.vendorQuotePrice
  );
}

function getStartingPrice(booking) {
  return getNumber(
    booking?.servicePrice ??
      booking?.startingPrice ??
      booking?.proposedPrice ??
      booking?.price ??
      booking?.amount
  );
}

function getAgreedPrice(booking) {
  return getNumber(
    booking?.agreedPrice ??
      booking?.finalPrice
  );
}

function getAmountPaid(booking) {
  const value = Number(booking?.amountPaid);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function getRemainingBalance(booking) {
  const agreed = getAgreedPrice(booking);

  if (!agreed) {
    return Number(booking?.remainingBalance) || 0;
  }

  const remaining = Number(booking?.remainingBalance);

  if (Number.isFinite(remaining) && remaining >= 0) {
    return remaining;
  }

  return Math.max(agreed - getAmountPaid(booking), 0);
}

function isPaymentMade(booking) {
  return (
    normalize(booking?.paymentStatus) === "paid" ||
    normalize(booking?.paymentStatus) === "deposit_paid"
  );
}

function isFullyPaid(booking) {
  return normalize(booking?.paymentStatus) === "paid";
}

function isDepositPaid(booking) {
  return normalize(booking?.paymentStatus) === "deposit_paid";
}

function formatPrice(price) {
  const number = Number(price);

  if (!Number.isFinite(number) || number <= 0) {
    return "Price not provided";
  }

  return `GH₵${number.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date) {
  if (!date) return "Date not provided";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "Not provided";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getVenueImage(venue) {
  return (
    venue?.coverImage ||
    venue?.image ||
    venue?.imageUrl ||
    venue?.photo ||
    venue?.images?.[0] ||
    venue?.photos?.[0] ||
    ""
  );
}

/* ============================================================
   QUOTATION COMPATIBILITY
============================================================ */

function syncQuotationFromBooking(booking) {
  const quotations = getQuotations();
  const bookingId = String(getId(booking));

  const quotation = {
    ...booking,

    id: getId(booking),
    bookingId: getId(booking),

    status: booking.status,
    quotationStatus:
      booking.quotationStatus || booking.status,

    providerType: "venue",

    organizerEmail: booking.organizerEmail,
    organizerId: booking.organizerId,

    venueEmail: booking.venueEmail,
    venueId: booking.venueId,
    venueName: booking.venueName,

    price:
      booking.price ??
      booking.servicePrice ??
      booking.proposedPrice ??
      0,

    proposedPrice: booking.proposedPrice,
    servicePrice: booking.servicePrice,

    venueCounterPrice: booking.venueCounterPrice,
    venueQuotePrice: booking.venueQuotePrice,
    venueQuotationPrice: booking.venueQuotationPrice,

    organizerCounterPrice: booking.organizerCounterPrice,

    agreedPrice: booking.agreedPrice,
    finalPrice: booking.finalPrice,

    paymentStatus: booking.paymentStatus,
    paymentOption: booking.paymentOption,
    amountPaid: booking.amountPaid,
    remainingBalance: booking.remainingBalance,

    updatedAt:
      booking.updatedAt ||
      new Date().toISOString(),
  };

  const index = quotations.findIndex(
    (item) =>
      String(getId(item)) === bookingId ||
      String(item.bookingId || "") === bookingId
  );

  if (index === -1) {
    quotations.unshift(quotation);
  } else {
    quotations[index] = {
      ...quotations[index],
      ...quotation,
    };
  }

  localStorage.setItem(
    QUOTATIONS_KEY,
    JSON.stringify(quotations)
  );

  window.dispatchEvent(
    new Event("eventflow-quotations-updated")
  );
}

/* ============================================================
   ORGANIZER NOTIFICATIONS
============================================================ */

function addOrganizerNotification(booking, type, message) {
  const organizerEmail =
    booking?.organizerEmail?.toLowerCase();

  if (!organizerEmail) return;

  const key =
    `eventflowOrganizerNotifications_${organizerEmail}`;

  let notifications = [];

  try {
    const saved = JSON.parse(
      localStorage.getItem(key) || "[]"
    );

    notifications = Array.isArray(saved) ? saved : [];
  } catch {
    notifications = [];
  }

  notifications.unshift({
    id: `${type}-${getId(booking)}-${Date.now()}`,
    bookingId: getId(booking),
    type,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  });

  localStorage.setItem(
    key,
    JSON.stringify(notifications.slice(0, 50))
  );

  window.dispatchEvent(
    new Event("eventflow-notifications-updated")
  );
}

/* ============================================================
   ORGANIZER BOOKING COPY
============================================================ */

function syncOrganizerBookingCopy(booking) {
  const organizerEmail =
    String(booking?.organizerEmail || "")
      .trim()
      .toLowerCase();

  const keys = ["eventflowOrganizerBookings"];

  if (organizerEmail) {
    keys.push(`eventflowOrganizerBookings_${organizerEmail}`);
  }

  keys.forEach((key) => {
    let existing = [];

    try {
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      existing = Array.isArray(saved) ? saved : [];
    } catch {
      existing = [];
    }

    const bookingId = String(
      getId(booking) ?? booking?.bookingId ?? ""
    );

    const index = existing.findIndex((item) => {
      const itemId = String(
        getId(item) ?? item?.bookingId ?? ""
      );

      return bookingId && itemId === bookingId;
    });

    if (index === -1) {
      existing.unshift(booking);
    } else {
      existing[index] = {
        ...existing[index],
        ...booking,
      };
    }

    localStorage.setItem(key, JSON.stringify(existing));
  });
}

/* ============================================================
   VENUE OWNER BOOKING COPY
============================================================ */

function syncVenueOwnerBookingCopy(booking, ownerEmail) {
  if (!ownerEmail) return;

  const key = `eventflowVenueBookings_${ownerEmail}`;

  let existing = [];

  try {
    const saved = JSON.parse(
      localStorage.getItem(key) || "[]"
    );

    existing = Array.isArray(saved) ? saved : [];
  } catch {
    existing = [];
  }

  const bookingId = String(
    getId(booking) ?? booking?.bookingId ?? ""
  );

  const index = existing.findIndex(
    (item) =>
      String(getId(item) ?? item?.bookingId ?? "") ===
      bookingId
  );

  if (index === -1) {
    existing.unshift(booking);
  } else {
    existing[index] = {
      ...existing[index],
      ...booking,
    };
  }

  localStorage.setItem(key, JSON.stringify(existing));
}

/* ============================================================
   VENUE NOTIFICATIONS
============================================================ */

function getVenueNotifications(email) {
  if (!email) return [];

  const key =
    `eventflowVenueNotifications_${email.toLowerCase()}`;

  try {
    const saved = JSON.parse(
      localStorage.getItem(key) || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function markVenueNotificationRead(notificationId, email) {
  if (!email) return;

  const key =
    `eventflowVenueNotifications_${email.toLowerCase()}`;

  const notifications = getVenueNotifications(email);

  const updated = notifications.map((notification) =>
    String(notification.id) === String(notificationId)
      ? { ...notification, read: true }
      : notification
  );

  localStorage.setItem(key, JSON.stringify(updated));

  window.dispatchEvent(
    new Event("eventflow-notifications-updated")
  );
}

/* ============================================================
   MAIN DASHBOARD
============================================================ */

export default function VenueDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(getCurrentUser);
  const [venues, setVenues] = useState(getVenues);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteNote, setQuoteNote] = useState("");
  const [priceMode, setPriceMode] = useState("send");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const userEmail = String(user?.email || "")
    .trim()
    .toLowerCase();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const accountType = normalize(
      user.accountType || user.role || user.userType
    );

    if (
      accountType &&
      !["venue", "venueowner", "venue owner", "admin"].includes(
        accountType
      )
    ) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    const refreshData = () => {
      setUser(getCurrentUser());
      setVenues(getVenues());
      setBookings(getBookings());
      setNotifications(getVenueNotifications(userEmail));
    };

    refreshData();

    const events = [
      "eventflow-auth-changed",
      "eventflow-venues-updated",
      "eventflow-bookings-updated",
      "eventflow-booking-updated",
      "eventflow-quotations-updated",
      "eventflow-notifications-updated",
      "eventflow-payment-updated",
    ];

    events.forEach((eventName) =>
      window.addEventListener(eventName, refreshData)
    );

    const handleStorage = () => refreshData();
    window.addEventListener("storage", handleStorage);

    return () => {
      events.forEach((eventName) =>
        window.removeEventListener(eventName, refreshData)
      );

      window.removeEventListener("storage", handleStorage);
    };
  }, [userEmail]);

  const ownedVenues = useMemo(() => {
    return venues.filter((venue) => {
      const ownerEmail = String(
        venue.ownerEmail || venue.email || ""
      )
        .trim()
        .toLowerCase();

      const ownerId = String(
        venue.ownerId || venue.userId || ""
      );

      return (
        (userEmail && ownerEmail === userEmail) ||
        (user?.id && ownerId === String(user.id))
      );
    });
  }, [venues, userEmail, user]);

  const ownedVenueIds = useMemo(
    () =>
      ownedVenues.map((venue) =>
        String(venue.id ?? venue._id ?? "")
      ),
    [ownedVenues]
  );

  const ownedVenueNames = useMemo(
    () =>
      ownedVenues.map((venue) =>
        normalize(venue.name || venue.businessName)
      ),
    [ownedVenues]
  );

  const venueBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const bookingVenueEmail = String(
        booking.venueEmail ||
          booking.venueOwnerEmail ||
          booking.ownerEmail ||
          ""
      )
        .trim()
        .toLowerCase();

      const venueId = String(
        booking.venueId ||
          booking.selectedVenueId ||
          booking.providerId ||
          ""
      );

      const venueName = normalize(
        booking.venueName ||
          booking.selectedVenueName ||
          booking.providerName ||
          booking.serviceName
      );

      return (
        (bookingVenueEmail && bookingVenueEmail === userEmail) ||
        (venueId && ownedVenueIds.includes(venueId)) ||
        (venueName && ownedVenueNames.includes(venueName))
      );
    });
  }, [
    bookings,
    userEmail,
    ownedVenueIds,
    ownedVenueNames,
  ]);

  const filteredBookings = useMemo(() => {
    return venueBookings.filter((booking) => {
      const status = getBookingStatus(booking);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      const search = normalize(searchTerm);

      const matchesSearch =
        !search ||
        normalize(booking.eventName).includes(search) ||
        normalize(booking.organizerName).includes(search) ||
        normalize(booking.venueName).includes(search) ||
        normalize(booking.eventLocation).includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [venueBookings, statusFilter, searchTerm]);

  const pendingBookings = venueBookings.filter((booking) =>
    ["pending", "requested", "new"].includes(
      getBookingStatus(booking)
    )
  );

  const counterOfferBookings = venueBookings.filter((booking) =>
    [
      "organizer_counter",
      "counter_sent",
      "organizer_counter_offer",
    ].includes(getBookingStatus(booking))
  );

  const acceptedBookings = venueBookings.filter((booking) =>
    [
      "accepted",
      "confirmed",
      "approved",
    ].includes(getBookingStatus(booking))
  );

  const rejectedBookings = venueBookings.filter((booking) =>
    [
      "rejected",
      "declined",
      "cancelled",
      "canceled",
    ].includes(getBookingStatus(booking))
  );

  const unreadNotifications = notifications.filter(
    (notification) => !notification.read
  ).length;

  const totalRevenue = acceptedBookings.reduce(
    (total, booking) =>
      total + (getAgreedPrice(booking) || 0),
    0
  );

  const totalPaid = venueBookings.reduce(
    (total, booking) => total + getAmountPaid(booking),
    0
  );

  const totalOutstanding = venueBookings.reduce(
    (total, booking) =>
      total + getRemainingBalance(booking),
    0
  );

  function refreshBookings() {
    setBookings(getBookings());
    setVenues(getVenues());
    setNotifications(getVenueNotifications(userEmail));
  }

  function saveUpdatedBooking(updatedBooking, notification) {
    const bookingId = String(
      getId(updatedBooking) ?? updatedBooking?.bookingId ?? ""
    );

    if (!bookingId) {
      setFeedback("Unable to update this booking because its ID is missing.");
      return false;
    }

    const currentBookings = getBookings();

    const existingIndex = currentBookings.findIndex(
      (item) =>
        String(getId(item) ?? item?.bookingId ?? "") === bookingId
    );

    let nextBookings;

    if (existingIndex === -1) {
      nextBookings = [updatedBooking, ...currentBookings];
    } else {
      nextBookings = currentBookings.map((item, index) =>
        index === existingIndex
          ? { ...item, ...updatedBooking }
          : item
      );
    }

    const savedBooking =
      nextBookings.find(
        (item) =>
          String(getId(item) ?? item?.bookingId ?? "") === bookingId
      ) || updatedBooking;

    saveBookings(nextBookings);

    const ownerEmail =
      userEmail ||
      String(savedBooking.venueEmail || "").trim().toLowerCase();

    syncVenueOwnerBookingCopy(savedBooking, ownerEmail);
    syncOrganizerBookingCopy(savedBooking);
    syncQuotationFromBooking(savedBooking);

    if (notification) {
      addOrganizerNotification(
        savedBooking,
        notification.type,
        notification.message
      );
    }

    refreshBookings();
    setSelectedBooking(savedBooking);
    return true;
  }

  function openQuoteModal(booking, mode = "send") {
    setSelectedBooking(booking);
    setPriceMode(mode);

    const existingPrice =
      mode === "another"
        ? getVenueCounterPrice(booking)
        : "";

    setQuotePrice(existingPrice ? String(existingPrice) : "");
    setQuoteNote("");
    setFeedback("");
    setShowQuoteModal(true);
  }

  function submitVenueQuote(event) {
    event.preventDefault();

    if (!selectedBooking) return;

    const price = getNumber(quotePrice);

    if (!price) {
      setFeedback("Enter a valid quotation amount greater than zero.");
      return;
    }

    setSaving(true);

    try {
      const currentBookings = getBookings();
      const bookingId = String(
        getId(selectedBooking) ?? selectedBooking.bookingId ?? ""
      );

      const latestBooking =
        currentBookings.find(
          (item) =>
            String(getId(item) ?? item.bookingId ?? "") === bookingId
        ) || selectedBooking;

      const now = new Date().toISOString();

      const updatedBooking = {
        ...latestBooking,
        id: getId(latestBooking) ?? latestBooking.bookingId,
        bookingId:
          getId(latestBooking) ?? latestBooking.bookingId,
        providerType: "venue",
        status: "venue_counter",
        quotationStatus: "venue_counter",
        negotiationStatus: "venue_counter",
        venueCounterPrice: price,
        venueQuotePrice: price,
        venueQuotationPrice: price,
        proposedPrice: price,
        price,
        venueQuoteNote: quoteNote.trim(),
        quotationMessage: quoteNote.trim(),
        venueQuoteAt: now,
        venueCounterAt: now,
        updatedAt: now,
      };

      const saved = saveUpdatedBooking(updatedBooking, {
        type: "venue_quotation_sent",
        message: `The venue has proposed ${formatPrice(price)} for your booking${
          quoteNote.trim() ? `: ${quoteNote.trim()}` : "."
        }`,
      });

      if (saved) {
        setFeedback("Quotation sent successfully.");
        setShowQuoteModal(false);
        setQuotePrice("");
        setQuoteNote("");
        setPriceMode("send");
      }
    } catch (error) {
      console.error("Unable to submit venue quotation:", error);
      setFeedback(
        "Something went wrong while sending the quotation. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     RESPOND TO ORGANIZER COUNTER-OFFER
  ============================================================

  function acceptOrganizerCounter(booking) {
    const counterPrice = getOrganizerCounterPrice(booking);

    if (!counterPrice) {
      setFeedback(
        "The organizer's counter-offer price could not be found."
      );
      return;
    }

    const confirmed = window.confirm(
      `Accept the organizer's counter-offer of ${formatPrice(
        counterPrice
      )}? This will lock the agreed price.`
    );

    if (!confirmed) return;

    const now = new Date().toISOString();

    const updatedBooking = {
      ...booking,
      status: "accepted",
      quotationStatus: "accepted",
      negotiationStatus: "accepted",

      agreedPrice: counterPrice,
      finalPrice: counterPrice,
      price: counterPrice,
      proposedPrice: counterPrice,

      agreementLocked: true,
      agreementAcceptedAt: now,
      venueResponse: "accepted",

      paymentStatus: booking.paymentStatus || "unpaid",
      amountPaid: getAmountPaid(booking),
      remainingBalance: Math.max(
        counterPrice - getAmountPaid(booking),
        0
      ),

      acceptedBy: "venue",
      updatedAt: now,
    };

    const saved = saveUpdatedBooking(updatedBooking, {
      type: "venue_counter_accepted",
      message: `Your counter-offer of ${formatPrice(
        counterPrice
      )} has been accepted by the venue.`,
    });

    if (saved) {
      setFeedback("Counter-offer accepted. The agreed price is now locked.");
      setShowDetailsModal(false);
    }
  }

  /* ============================================================
     REJECT ORGANIZER COUNTER-OFFER
  ============================================================ */

  function rejectOrganizerCounter(booking) {
    const confirmed = window.confirm(
      "Are you sure you want to reject this counter-offer?"
    );

    if (!confirmed) return;

    const now = new Date().toISOString();

    const updatedBooking = {
      ...booking,
      status: "rejected",
      quotationStatus: "rejected",
      negotiationStatus: "rejected",
      venueResponse: "rejected",
      rejectedBy: "venue",
      rejectedAt: now,
      updatedAt: now,
    };

    const saved = saveUpdatedBooking(updatedBooking, {
      type: "venue_counter_rejected",
      message: `The venue has rejected your counter-offer for ${
        booking.venueName || "the venue"
      }.`,
    });

    if (saved) {
      setFeedback("Counter-offer rejected.");
      setShowDetailsModal(false);
    }
  }

  /* ============================================================
     REJECT A BOOKING REQUEST
  ============================================================ */

  function rejectBooking(booking) {
    const confirmed = window.confirm(
      "Are you sure you want to reject this booking request?"
    );

    if (!confirmed) return;

    const now = new Date().toISOString();

    const updatedBooking = {
      ...booking,
      status: "rejected",
      quotationStatus: "rejected",
      negotiationStatus: "rejected",
      venueResponse: "rejected",
      rejectedBy: "venue",
      rejectedAt: now,
      updatedAt: now,
    };

    const saved = saveUpdatedBooking(updatedBooking, {
      type: "venue_booking_rejected",
      message: `The venue has rejected your booking request for ${
        booking.venueName || "the selected venue"
      }.`,
    });

    if (saved) {
      setFeedback("Booking request rejected.");
      setShowDetailsModal(false);
    }
  }

  /* ============================================================
     PAYMENT RECORDS
  ============================================================ */

  function recordPayment(booking, paymentType) {
    const agreedPrice = getAgreedPrice(booking);

    if (!agreedPrice) {
      setFeedback(
        "A final agreed price is required before recording payment."
      );
      return;
    }

    const confirmed = window.confirm(
      paymentType === "full"
        ? `Record full payment of ${formatPrice(agreedPrice)}?`
        : `Record a 50% deposit of ${formatPrice(
            agreedPrice / 2
          )}?`
    );

    if (!confirmed) return;

    const amount =
      paymentType === "full"
        ? agreedPrice
        : agreedPrice / 2;

    const now = new Date().toISOString();

    const totalPaid =
      paymentType === "full"
        ? agreedPrice
        : Math.min(
            getAmountPaid(booking) + amount,
            agreedPrice
          );

    const paymentStatus =
      totalPaid >= agreedPrice
        ? "paid"
        : totalPaid > 0
          ? "deposit_paid"
          : "unpaid";

    const updatedBooking = {
      ...booking,
      paymentStatus,
      paymentOption:
        paymentType === "full" ? "full" : "deposit",
      amountPaid: totalPaid,
      remainingBalance: Math.max(
        agreedPrice - totalPaid,
        0
      ),
      paymentRecordedAt: now,
      updatedAt: now,
    };

    const saved = saveUpdatedBooking(updatedBooking, {
      type: "venue_payment_updated",
      message: `A payment record for ${formatPrice(
        amount
      )} has been updated for your venue booking.`,
    });

    if (saved) {
      window.dispatchEvent(
        new Event("eventflow-payment-updated")
      );

      setFeedback("Payment record updated.");
      setShowDetailsModal(false);
    }
  }

  /* ============================================================
     LOGOUT
  ============================================================ */

  function handleLogout() {
    localStorage.removeItem("eventflowLoggedIn");
    localStorage.removeItem("eventflowUser");

    window.dispatchEvent(
      new Event("eventflow-auth-changed")
    );

    navigate("/login");
  }

  /* ============================================================
     STATUS DISPLAY
  ============================================================ */

  function getStatusLabel(booking) {
    const status = getBookingStatus(booking);

    const labels = {
      pending: "Awaiting quotation",
      requested: "New request",
      new: "New request",
      venue_counter: "Quotation sent",
      organizer_counter: "Counter-offer received",
      counter_sent: "Counter-offer received",
      organizer_counter_offer: "Counter-offer received",
      accepted: "Confirmed",
      confirmed: "Confirmed",
      approved: "Confirmed",
      rejected: "Rejected",
      declined: "Declined",
      cancelled: "Cancelled",
      canceled: "Cancelled",
    };

    return labels[status] || status.replaceAll("_", " ");
  }

  function getStatusClasses(booking) {
    const status = getBookingStatus(booking);

    if (
      ["accepted", "confirmed", "approved"].includes(status)
    ) {
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    }

    if (
      [
        "organizer_counter",
        "counter_sent",
        "organizer_counter_offer",
        "venue_counter",
      ].includes(status)
    ) {
      return "bg-violet-50 text-violet-700 ring-violet-200";
    }

    if (
      ["rejected", "declined", "cancelled", "canceled"].includes(
        status
      )
    ) {
      return "bg-rose-50 text-rose-700 ring-rose-200";
    }

    return "bg-amber/10 text-amber ring-amber-200";
  }

  /* ============================================================
     BOOKING CARD
  ============================================================ */

  function renderBookingCard(booking) {
    const status = getBookingStatus(booking);
    const organizerCounter = getOrganizerCounterPrice(booking);
    const venueCounter = getVenueCounterPrice(booking);
    const agreedPrice = getAgreedPrice(booking);

    const needsVenueResponse = [
      "organizer_counter",
      "counter_sent",
      "organizer_counter_offer",
    ].includes(status);

    return (
      <article
        key={String(getId(booking) ?? booking.bookingId)}
        className="overflow-hidden rounded-2xl border border-line bg-raised shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="border-b border-line p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                {booking.eventType || "Event booking"}
              </p>

              <h3 className="mt-1 break-words text-lg font-bold text-cream">
                {booking.eventName || "Untitled event"}
              </h3>

              <p className="mt-1 text-sm text-mist">
                Organizer: {booking.organizerName || "Organizer"}
              </p>
            </div>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClasses(
                booking
              )}`}
            >
              {getStatusLabel(booking)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface p-3">
              <p className="text-xs text-mist">Event date</p>
              <p className="mt-1 text-sm font-semibold text-cream">
                {formatDate(booking.eventDate || booking.date)}
              </p>
            </div>

            <div className="rounded-xl bg-surface p-3">
              <p className="text-xs text-mist">Event location</p>
              <p className="mt-1 break-words text-sm font-semibold text-cream">
                {booking.eventLocation ||
                  booking.location ||
                  "Not specified"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-5">
          {venueCounter && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-mist">
                Your quotation
              </span>
              <span className="font-bold text-violet-700">
                {formatPrice(venueCounter)}
              </span>
            </div>
          )}

          {organizerCounter && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-mist">
                Organizer's counter-offer
              </span>
              <span className="font-bold text-gold">
                {formatPrice(organizerCounter)}
              </span>
            </div>
          )}

          {agreedPrice && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3">
              <span className="text-sm font-medium text-emerald-800">
                Agreed price
              </span>
              <span className="font-bold text-emerald-800">
                {formatPrice(agreedPrice)}
              </span>
            </div>
          )}

          {needsVenueResponse && (
            <p className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-sm text-violet-800">
              The organizer has made a counter-offer. Review the
              amount and accept, reject, or send another quotation.
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedBooking(booking);
                setShowDetailsModal(true);
                setFeedback("");
              }}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-mist transition hover:bg-surface"
            >
              View details
            </button>

            {needsVenueResponse && (
              <>
                <button
                  type="button"
                  onClick={() => acceptOrganizerCounter(booking)}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-emerald-700"
                >
                  Accept offer
                </button>

                <button
                  type="button"
                  onClick={() => openQuoteModal(booking, "another")}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-violet-700"
                >
                  Counter again
                </button>
              </>
            )}

            {["pending", "requested", "new"].includes(status) && (
              <>
                <button
                  type="button"
                  onClick={() => openQuoteModal(booking, "send")}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-violet-700"
                >
                  Send quotation
                </button>

                <button
                  type="button"
                  onClick={() => rejectBooking(booking)}
                  className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </article>
    );
  }

  /* ============================================================
     DASHBOARD HEADER
  ============================================================ */

  const activeVenue = ownedVenues[0];

  return (
    <div className="min-h-screen bg-surface text-cream">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Venue partner portal
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-cream sm:text-4xl">
              Venue Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-mist sm:text-base">
              Manage venue enquiries, respond to booking requests,
              negotiate prices, and keep track of your bookings.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/venue-registration"
              className="inline-flex items-center justify-center rounded-xl border border-line bg-raised px-4 py-3 text-sm font-semibold text-mist shadow-sm transition hover:bg-surface"
            >
              Manage venue
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-line bg-raised px-4 py-3 text-sm font-semibold text-mist transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              Sign out
            </button>
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800"
          >
            <p>{feedback}</p>

            <button
              type="button"
              onClick={() => setFeedback("")}
              className="font-bold"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-800 via-violet-700 to-indigo-700 p-6 text-cream shadow-lg sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-medium text-violet-200">
                Welcome back
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                {user?.name ||
                  user?.fullName ||
                  activeVenue?.ownerName ||
                  "Venue partner"}
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-violet-100">
                Stay on top of new enquiries and keep your venue
                bookings moving forward.
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-raised/10 p-5 backdrop-blur-xl">
              <p className="text-sm text-violet-100">Your venues</p>
              <p className="mt-2 text-3xl font-extrabold">
                {ownedVenues.length}
              </p>
              <p className="mt-1 text-xs text-violet-200">
                Registered under your account
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-line bg-raised p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-mist">
                Total enquiries
              </p>
              <span className="rounded-xl bg-violet-100 p-2 text-lg">
                ◉
              </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold">
              {venueBookings.length}
            </p>
            <p className="mt-1 text-xs text-mist">
              Requests received
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-raised p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-mist">
                Awaiting response
              </p>
              <span className="rounded-xl bg-amber/15 p-2 text-lg">
                ◷
              </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold">
              {pendingBookings.length}
            </p>
            <p className="mt-1 text-xs text-mist">
              New booking requests
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-raised p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-mist">
                Confirmed bookings
              </p>
              <span className="rounded-xl bg-emerald-100 p-2 text-lg">
                ✓
              </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold">
              {acceptedBookings.length}
            </p>
            <p className="mt-1 text-xs text-mist">
              Agreed with organizers
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-raised p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-mist">
                Outstanding balance
              </p>
              <span className="rounded-xl bg-gold/15 p-2 text-lg">
                GH₵
              </span>
            </div>
            <p className="mt-4 break-words text-2xl font-extrabold">
              {formatPrice(totalOutstanding)}
            </p>
            <p className="mt-1 text-xs text-mist">
              Based on recorded booking balances
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-line pb-3">
          {[
            { id: "overview", label: "Overview" },
            { id: "bookings", label: "Bookings" },
            { id: "counteroffers", label: "Counter-offers" },
            { id: "venues", label: "My venues" },
            { id: "notifications", label: "Notifications" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-violet-700 text-cream shadow-sm"
                  : "text-mist hover:bg-raised hover:text-violet-700"
              }`}
            >
              {tab.label}

              {tab.id === "counteroffers" &&
                counterOfferBookings.length > 0 && (
                  <span className="ml-2 rounded-full bg-raised/20 px-2 py-0.5 text-xs">
                    {counterOfferBookings.length}
                  </span>
                )}

              {tab.id === "notifications" &&
                unreadNotifications > 0 && (
                  <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                    {unreadNotifications}
                  </span>
                )}
            </button>
          ))}
        </div>
                {/* =====================================================
            OVERVIEW TAB
        ===================================================== */}

        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-line bg-raised p-6 shadow-sm lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-cream">
                      Recent booking activity
                    </h2>
                    <p className="mt-1 text-sm text-mist">
                      Keep track of your latest venue enquiries.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("bookings")}
                    className="text-sm font-semibold text-violet-700 hover:text-violet-900"
                  >
                    View all bookings →
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {venueBookings.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-line-bright px-5 py-10 text-center">
                      <div className="text-3xl">📅</div>
                      <h3 className="mt-3 font-semibold text-cream">
                        No bookings yet
                      </h3>
                      <p className="mx-auto mt-2 max-w-sm text-sm text-mist">
                        Booking requests for your registered venues
                        will appear here.
                      </p>
                    </div>
                  ) : (
                    [...venueBookings]
                      .sort(
                        (a, b) =>
                          new Date(b.updatedAt || b.createdAt || 0) -
                          new Date(a.updatedAt || a.createdAt || 0)
                      )
                      .slice(0, 4)
                      .map((booking) => renderBookingCard(booking))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-line bg-raised p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-cream">
                    Negotiation summary
                  </h2>

                  <p className="mt-1 text-sm text-mist">
                    Bookings that need your attention.
                  </p>

                  <div className="mt-5 space-y-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("bookings");
                        setStatusFilter("pending");
                      }}
                      className="flex w-full items-center justify-between rounded-xl bg-amber/10 p-4 text-left transition hover:bg-amber/15"
                    >
                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          New requests
                        </p>
                        <p className="mt-1 text-xs text-amber">
                          Awaiting your quotation
                        </p>
                      </div>

                      <span className="text-2xl font-bold text-amber-800">
                        {pendingBookings.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("counteroffers")}
                      className="flex w-full items-center justify-between rounded-xl bg-violet-50 p-4 text-left transition hover:bg-violet-100"
                    >
                      <div>
                        <p className="text-sm font-semibold text-violet-900">
                          Counter-offers
                        </p>
                        <p className="mt-1 text-xs text-violet-700">
                          Awaiting your response
                        </p>
                      </div>

                      <span className="text-2xl font-bold text-violet-800">
                        {counterOfferBookings.length}
                      </span>
                    </button>

                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">
                          Confirmed bookings
                        </p>
                        <p className="mt-1 text-xs text-emerald-700">
                          Agreements reached
                        </p>
                      </div>

                      <span className="text-2xl font-bold text-emerald-800">
                        {acceptedBookings.length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-raised p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-cream">
                    Financial overview
                  </h2>

                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-sm text-mist">
                        Total agreed booking value
                      </p>
                      <p className="mt-1 text-2xl font-extrabold text-cream">
                        {formatPrice(totalRevenue)}
                      </p>
                    </div>

                    <div className="border-t border-line pt-4">
                      <p className="text-sm text-mist">
                        Payments recorded
                      </p>
                      <p className="mt-1 text-xl font-bold text-emerald-700">
                        {formatPrice(totalPaid)}
                      </p>
                    </div>

                    <div className="border-t border-line pt-4">
                      <p className="text-sm text-mist">
                        Outstanding balance
                      </p>
                      <p className="mt-1 text-xl font-bold text-amber">
                        {formatPrice(totalOutstanding)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-fog">
                    These figures reflect the booking and payment
                    records saved in this browser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            BOOKINGS TAB
        ===================================================== */}

        {activeTab === "bookings" && (
          <section className="rounded-2xl border border-line bg-raised p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-cream">
                  Venue bookings
                </h2>
                <p className="mt-1 text-sm text-mist">
                  Review enquiries and manage your quotations.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  refreshBookings();
                  setFeedback("");
                }}
                className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-mist hover:bg-surface"
              >
                ↻ Refresh bookings
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search event or organizer..."
                className="w-full rounded-xl border border-line bg-raised px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-xl border border-line bg-raised px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              >
                <option value="all">All booking statuses</option>
                <option value="pending">Awaiting quotation</option>
                <option value="venue_counter">Quotation sent</option>
                <option value="organizer_counter">Counter-offer received</option>
                <option value="counter_sent">Counter-offer received</option>
                <option value="accepted">Accepted</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="mt-6">
              {filteredBookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line-bright px-5 py-12 text-center">
                  <div className="text-4xl">🔎</div>
                  <h3 className="mt-3 text-lg font-bold text-cream">
                    No matching bookings
                  </h3>
                  <p className="mt-2 text-sm text-mist">
                    Try a different search term or status filter.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                    className="mt-4 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-cream hover:bg-violet-800"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {filteredBookings.map((booking) =>
                    renderBookingCard(booking)
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* =====================================================
            COUNTER-OFFERS TAB
        ===================================================== */}

        {activeTab === "counteroffers" && (
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-cream">
                Organizer counter-offers
              </h2>
              <p className="mt-1 text-sm text-mist">
                Review the organizer's proposed price and decide
                whether to accept or negotiate further.
              </p>
            </div>

            {counterOfferBookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line-bright bg-raised px-5 py-14 text-center">
                <div className="text-4xl">🤝</div>
                <h3 className="mt-3 text-lg font-bold text-cream">
                  No counter-offers to review
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-mist">
                  When an organizer responds to your quotation with
                  another price, the counter-offer will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {counterOfferBookings.map((booking) => (
                  <div
                    key={String(getId(booking) ?? booking.bookingId)}
                    className="overflow-hidden rounded-2xl border border-violet-200 bg-raised shadow-sm"
                  >
                    <div className="border-b border-violet-100 bg-violet-50 p-5">
                      <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
                        Action required
                      </span>

                      <h3 className="mt-3 text-xl font-bold text-cream">
                        {booking.eventName || "Event booking"}
                      </h3>

                      <p className="mt-1 text-sm text-mist">
                        {booking.organizerName || "Organizer"}
                      </p>
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-surface p-4">
                          <p className="text-xs text-mist">
                            Your last quotation
                          </p>
                          <p className="mt-2 text-xl font-bold text-cream">
                            {formatPrice(getVenueCounterPrice(booking))}
                          </p>
                        </div>

                        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                          <p className="text-xs font-medium text-violet-700">
                            Organizer's offer
                          </p>
                          <p className="mt-2 text-xl font-extrabold text-violet-800">
                            {formatPrice(getOrganizerCounterPrice(booking))}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm text-mist">
                        <p>
                          <span className="font-semibold">Event date:</span>{" "}
                          {formatDate(booking.eventDate || booking.date)}
                        </p>

                        <p>
                          <span className="font-semibold">Location:</span>{" "}
                          {booking.eventLocation ||
                            booking.location ||
                            "Not specified"}
                        </p>

                        <p>
                          <span className="font-semibold">Received:</span>{" "}
                          {formatShortDate(
                            booking.organizerCounterAt ||
                              booking.updatedAt ||
                              booking.createdAt
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                        <button
                          type="button"
                          onClick={() => acceptOrganizerCounter(booking)}
                          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-cream transition hover:bg-emerald-700"
                        >
                          Accept offer
                        </button>

                        <button
                          type="button"
                          onClick={() => openQuoteModal(booking, "another")}
                          className="rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-cream transition hover:bg-violet-800"
                        >
                          Send counter-offer
                        </button>

                        <button
                          type="button"
                          onClick={() => rejectOrganizerCounter(booking)}
                          className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* =====================================================
            MY VENUES TAB
        ===================================================== */}

        {activeTab === "venues" && (
          <section>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-cream">
                  My registered venues
                </h2>
                <p className="mt-1 text-sm text-mist">
                  Review the venues associated with your account.
                </p>
              </div>

              <Link
                to="/venue-registration"
                className="inline-flex items-center justify-center rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-violet-800"
              >
                + Register a venue
              </Link>
            </div>

            {ownedVenues.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line-bright bg-raised px-5 py-14 text-center">
                <div className="text-4xl">🏛️</div>
                <h3 className="mt-3 text-lg font-bold text-cream">
                  No registered venues found
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-mist">
                  Register your venue to manage its listing and receive
                  enquiries through EventFlow.
                </p>

                <Link
                  to="/venue-registration"
                  className="mt-5 inline-flex rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-cream hover:bg-violet-800"
                >
                  Register your venue
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {ownedVenues.map((venue) => {
                  const image = getVenueImage(venue);
                  const venueId = venue.id ?? venue._id;
                  const status = normalize(venue.status || "pending");

                  return (
                    <article
                      key={String(venueId ?? venue.name)}
                      className="overflow-hidden rounded-2xl border border-line bg-raised shadow-sm"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={venue.name || venue.businessName || "Venue"}
                          className="h-48 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-violet-100 to-indigo-100 text-5xl">
                          🏛️
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-lg font-bold text-cream">
                            {venue.name ||
                              venue.businessName ||
                              "Unnamed venue"}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              status === "approved"
                                ? "bg-emerald-50 text-emerald-700"
                                : status === "rejected"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-amber/10 text-amber"
                            }`}
                          >
                            {status.replaceAll("_", " ")}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-mist">
                          📍 {venue.location || "Location not provided"}
                        </p>

                        <p className="mt-1 text-sm text-mist">
                          Capacity: {venue.capacity || "Not specified"}
                        </p>

                        <p className="mt-3 text-xl font-extrabold text-violet-800">
                          {formatPrice(venue.price)}
                        </p>

                        <p className="mt-1 text-xs text-fog">
                          {venue.pricingType || "Starting from"}
                        </p>

                        {venue.description && (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-mist">
                            {venue.description}
                          </p>
                        )}

                        {Array.isArray(venue.images) &&
                          venue.images.length > 0 && (
                            <p className="mt-3 text-xs text-mist">
                              {venue.images.length} gallery image
                              {venue.images.length === 1 ? "" : "s"}
                            </p>
                          )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* =====================================================
            NOTIFICATIONS TAB
        ===================================================== */}

        {activeTab === "notifications" && (
          <section className="rounded-2xl border border-line bg-raised p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-cream">
                  Notifications
                </h2>
                <p className="mt-1 text-sm text-mist">
                  Stay informed about activity on your account.
                </p>
              </div>

              <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                {unreadNotifications} unread
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {notifications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line-bright px-5 py-10 text-center">
                  <div className="text-3xl">🔔</div>
                  <h3 className="mt-3 font-semibold text-cream">
                    You're all caught up
                  </h3>
                  <p className="mt-2 text-sm text-mist">
                    New booking and account notifications will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={String(notification.id)}
                    className={`flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-start ${
                      notification.read
                        ? "border-line bg-raised"
                        : "border-violet-200 bg-violet-50/60"
                    }`}
                  >
                    <div className="flex gap-3">
                      <span className="mt-0.5 text-xl">
                        {notification.type?.includes("booking")
                          ? "📅"
                          : notification.type?.includes("payment")
                            ? "💳"
                            : "🔔"}
                      </span>

                      <div>
                        <p className="text-sm leading-6 text-cream">
                          {notification.message || "You have a new notification."}
                        </p>

                        <p className="mt-1 text-xs text-fog">
                          {formatDateTime(
                            notification.createdAt ||
                              notification.timestamp
                          )}
                        </p>
                      </div>
                    </div>

                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => {
                          markVenueNotificationRead(
                            notification.id,
                            userEmail
                          );
                          setNotifications(
                            getVenueNotifications(userEmail)
                          );
                        }}
                        className="shrink-0 text-left text-xs font-semibold text-violet-700 hover:text-violet-900"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>

      {/* =======================================================
          SEND QUOTATION MODAL
      ======================================================= */}

      {showQuoteModal && selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-paper/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowQuoteModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="venue-quote-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-raised shadow-2xl"
          >
            <div className="bg-gradient-to-r from-violet-800 to-indigo-700 px-6 py-5 text-cream">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-200">
                    Venue quotation
                  </p>

                  <h2
                    id="venue-quote-title"
                    className="mt-1 text-xl font-bold"
                  >
                    {priceMode === "another"
                      ? "Send a counter-offer"
                      : "Send your quotation"}
                  </h2>

                  <p className="mt-1 text-sm text-violet-100">
                    {selectedBooking.eventName || "Event booking"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="rounded-lg px-2 py-1 text-2xl leading-none text-cream/80 hover:bg-raised/10 hover:text-cream"
                  aria-label="Close quotation modal"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={submitVenueQuote} className="space-y-5 p-6">
              <div className="rounded-xl bg-surface p-4">
                <p className="text-sm text-mist">
                  Organizer
                </p>
                <p className="mt-1 font-semibold text-cream">
                  {selectedBooking.organizerName || "Organizer"}
                </p>

                <p className="mt-3 text-sm text-mist">
                  Event date
                </p>
                <p className="mt-1 font-semibold text-cream">
                  {formatDate(
                    selectedBooking.eventDate ||
                      selectedBooking.date
                  )}
                </p>

                {getOrganizerCounterPrice(selectedBooking) && (
                  <>
                    <p className="mt-3 text-sm text-mist">
                      Organizer's current offer
                    </p>
                    <p className="mt-1 font-bold text-violet-700">
                      {formatPrice(
                        getOrganizerCounterPrice(selectedBooking)
                      )}
                    </p>
                  </>
                )}
              </div>

              <div>
                <label
                  htmlFor="venueQuotePrice"
                  className="mb-2 block text-sm font-semibold text-mist"
                >
                  {priceMode === "another"
                    ? "Your new proposed price (GH₵)"
                    : "Quotation amount (GH₵)"}
                </label>

                <input
                  id="venueQuotePrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={quotePrice}
                  onChange={(event) => setQuotePrice(event.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full rounded-xl border border-line px-4 py-3 text-lg font-semibold outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />

                <p className="mt-2 text-xs text-mist">
                  Enter the price you are proposing for this booking.
                  The price becomes agreed only when the organizer
                  accepts it.
                </p>
              </div>

              <div>
                <label
                  htmlFor="venueQuoteNote"
                  className="mb-2 block text-sm font-semibold text-mist"
                >
                  Message to organizer (optional)
                </label>

                <textarea
                  id="venueQuoteNote"
                  rows={3}
                  value={quoteNote}
                  onChange={(event) => setQuoteNote(event.target.value)}
                  placeholder="Add any details about your quotation..."
                  className="w-full resize-y rounded-xl border border-line px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {feedback && (
                <p className="rounded-xl bg-amber/10 p-3 text-sm text-amber-800">
                  {feedback}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="flex-1 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-mist hover:bg-surface"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-cream transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Sending..."
                    : priceMode === "another"
                      ? "Send counter-offer"
                      : "Send quotation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          BOOKING DETAILS MODAL
      ======================================================= */}

      {showDetailsModal && selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-paper/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowDetailsModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="venue-booking-details-title"
            className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-raised shadow-2xl"
          >
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-line bg-raised px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">
                  Booking details
                </p>

                <h2
                  id="venue-booking-details-title"
                  className="mt-1 text-xl font-bold text-cream"
                >
                  {selectedBooking.eventName || "Event booking"}
                </h2>

                <p className="mt-1 text-sm text-mist">
                  {selectedBooking.organizerName || "Organizer"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="rounded-lg px-2 py-1 text-2xl text-fog hover:bg-surface hover:text-cream"
                aria-label="Close booking details"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getStatusClasses(
                    selectedBooking
                  )}`}
                >
                  {getStatusLabel(selectedBooking)}
                </span>

                <span className="text-xs text-fog">
                  Booking ID:{" "}
                  {String(
                    getId(selectedBooking) ??
                      selectedBooking.bookingId ??
                      "Unavailable"
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  {
                    label: "Event type",
                    value: selectedBooking.eventType,
                  },
                  {
                    label: "Event date",
                    value: formatDate(
                      selectedBooking.eventDate ||
                        selectedBooking.date
                    ),
                  },
                  {
                    label: "Event location",
                    value:
                      selectedBooking.eventLocation ||
                      selectedBooking.location ||
                      "Not specified",
                  },
                  {
                    label: "Expected guests",
                    value:
                      selectedBooking.guestCount ||
                      selectedBooking.guests ||
                      selectedBooking.capacity ||
                      "Not specified",
                  },
                  {
                    label: "Organizer email",
                    value:
                      selectedBooking.organizerEmail ||
                      "Not provided",
                  },
                  {
                    label: "Organizer phone",
                    value:
                      selectedBooking.organizerPhone ||
                      selectedBooking.phone ||
                      "Not provided",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-line bg-surface p-4"
                  >
                    <p className="text-xs font-medium text-mist">
                      {item.label}
                    </p>
                    <p className="mt-2 break-words text-sm font-semibold text-cream">
                      {item.value || "Not provided"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-line p-5">
                <h3 className="font-bold text-cream">
                  Price negotiation
                </h3>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-mist">
                      Starting price
                    </span>
                    <span className="font-semibold text-cream">
                      {formatPrice(getStartingPrice(selectedBooking))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-mist">
                      Your quotation
                    </span>
                    <span className="font-semibold text-violet-700">
                      {formatPrice(getVenueCounterPrice(selectedBooking))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-mist">
                      Organizer's counter-offer
                    </span>
                    <span className="font-semibold text-gold">
                      {formatPrice(
                        getOrganizerCounterPrice(selectedBooking)
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                    <span className="text-sm font-semibold text-mist">
                      Agreed price
                    </span>
                    <span className="text-lg font-extrabold text-emerald-700">
                      {formatPrice(getAgreedPrice(selectedBooking))}
                    </span>
                  </div>
                </div>

                {selectedBooking.venueQuotationNote && (
                  <div className="mt-4 rounded-xl bg-violet-50 p-4">
                    <p className="text-xs font-semibold text-violet-800">
                      Your quotation message
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-violet-900">
                      {selectedBooking.venueQuotationNote}
                    </p>
                  </div>
                )}

                {selectedBooking.agreementLocked && (
                  <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                    Agreement reached. The agreed price is locked.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-line p-5">
                <h3 className="font-bold text-cream">
                  Payment summary
                </h3>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-mist">
                      Payment status
                    </span>
                    <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-mist">
                      {String(
                        selectedBooking.paymentStatus || "unpaid"
                      ).replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-mist">
                      Amount paid
                    </span>
                    <span className="font-semibold text-cream">
                      {formatPrice(getAmountPaid(selectedBooking))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-mist">
                      Remaining balance
                    </span>
                    <span className="font-semibold text-cream">
                      {formatPrice(
                        getRemainingBalance(selectedBooking)
                      )}
                    </span>
                  </div>
                </div>

                {getAgreedPrice(selectedBooking) &&
                  !isFullyPaid(selectedBooking) && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          recordPayment(selectedBooking, "deposit")
                        }
                        className="rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                      >
                        Record 50% deposit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          recordPayment(selectedBooking, "full")
                        }
                        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-cream hover:bg-emerald-700"
                      >
                        Record full payment
                      </button>
                    </div>
                  )}

                <p className="mt-4 text-xs leading-5 text-fog">
                  These controls update the local booking record only.
                  They do not collect money or verify a real transaction.
                </p>
              </div>

              {[
                "organizer_counter",
                "counter_sent",
                "organizer_counter_offer",
              ].includes(getBookingStatus(selectedBooking)) && (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      acceptOrganizerCounter(selectedBooking)
                    }
                    className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-cream hover:bg-emerald-700"
                  >
                    Accept counter-offer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailsModal(false);
                      openQuoteModal(selectedBooking, "another");
                    }}
                    className="rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-cream hover:bg-violet-800"
                  >
                    Make another offer
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      rejectOrganizerCounter(selectedBooking)
                    }
                    className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Reject offer
                  </button>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 border-t border-line bg-raised px-6 py-4">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="w-full rounded-xl border border-line px-4 py-3 text-sm font-semibold text-mist hover:bg-surface"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
