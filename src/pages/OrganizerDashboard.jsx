import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const BOOKINGS_KEY = "eventflowBookings";
const QUOTATIONS_KEY = "eventflowQuotations";
const EVENTS_KEY = "eventflowEvents";
const SAVED_ITEMS_PREFIX = "eventflowSavedItems_";

/* =====================================================
   STORAGE
===================================================== */

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

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getBookings() {
  return getArray(BOOKINGS_KEY);
}

function saveBookings(bookings) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));

  window.dispatchEvent(new Event("eventflow-bookings-updated"));
  window.dispatchEvent(new Event("eventflow-booking-updated"));
}

function getQuotations() {
  return getArray(QUOTATIONS_KEY);
}

function saveQuotations(quotations) {
  localStorage.setItem(
    QUOTATIONS_KEY,
    JSON.stringify(quotations)
  );

  window.dispatchEvent(
    new Event("eventflow-quotations-updated")
  );
}

/* =====================================================
   ORGANIZER NOTIFICATIONS
===================================================== */

function getOrganizerNotifications(email) {
  if (!email) return [];
  return getArray(`eventflowOrganizerNotifications_${String(email).toLowerCase()}`);
}

function saveOrganizerNotifications(email, notifications) {
  if (!email) return;
  localStorage.setItem(
    `eventflowOrganizerNotifications_${String(email).toLowerCase()}`,
    JSON.stringify(notifications)
  );
  window.dispatchEvent(new Event("eventflow-notifications-updated"));
}

/* =====================================================
   GENERAL HELPERS
===================================================== */

function itemId(item) {
  return String(item?.id ?? item?._id ?? "");
}

function money(value) {
  const amount = Number(value) || 0;

  return amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getOrganizerEmail(user) {
  return String(user?.email || "").toLowerCase();
}

function getOrganizerId(user) {
  return String(user?.id ?? user?._id ?? "");
}

function getBookingStatus(booking) {
  // Different dashboards may update different status fields.
  // Prefer the most meaningful negotiation state instead of allowing
  // a stale "pending" value to hide a quotation or counter offer.
  const statuses = [
    booking?.status,
    booking?.negotiationStatus,
    booking?.quotationStatus,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

  const priority = [
    "accepted",
    "rejected",
    "declined",
    "cancelled",
    "canceled",
    "organizer_counter",
    "counter_sent",
    "vendor_counter",
    "vendor_countered",
    "venue_counter",
    "venue_countered",
    "quotation_sent",
    "quotation_received",
    "quoted",
    "vendor_quotation",
    "venue_quotation",
    "sent",
  ];

  for (const candidate of priority) {
    if (statuses.includes(candidate)) return candidate;
  }

  return statuses[0] || "pending";
}

function isFinalStatus(status) {
  return [
    "accepted",
    "rejected",
    "declined",
    "cancelled",
    "canceled",
  ].includes(status);
}

function isForOrganizer(booking, user) {
  const organizerEmail = getOrganizerEmail(user);
  const organizerId = getOrganizerId(user);

  const bookingEmail = String(
    booking?.organizerEmail || ""
  ).toLowerCase();

  const bookingOrganizerId = String(
    booking?.organizerId ??
      booking?.organizerID ??
      ""
  );

  return Boolean(
    (organizerEmail &&
      bookingEmail &&
      organizerEmail === bookingEmail) ||
      (organizerId &&
        bookingOrganizerId &&
        organizerId === bookingOrganizerId)
  );
}

/* =====================================================
   PROVIDER HELPERS
===================================================== */

function getProviderType(booking) {
  const explicitType = String(
    booking?.providerType ||
      booking?.bookingType ||
      booking?.providerCategory ||
      ""
  ).toLowerCase();

  if (
    explicitType.includes("venue") ||
    explicitType.includes("location") ||
    explicitType.includes("hall")
  ) {
    return "venue";
  }

  if (
    explicitType.includes("vendor") ||
    explicitType.includes("service")
  ) {
    return "vendor";
  }

  const category = String(
    booking?.serviceCategory ||
      booking?.category ||
      ""
  ).toLowerCase();

  if (
    category.includes("venue") ||
    category.includes("location") ||
    category.includes("hall")
  ) {
    return "venue";
  }

  return "vendor";
}

function getProviderLabel(booking) {
  return getProviderType(booking) === "venue"
    ? "Venue"
    : "Vendor";
}

function getProviderName(booking) {
  if (getProviderType(booking) === "venue") {
    return (
      booking?.venueName ||
      booking?.providerName ||
      booking?.vendorName ||
      "Venue Provider"
    );
  }

  return (
    booking?.vendorName ||
    booking?.providerName ||
    "Service Provider"
  );
}

function getProviderEmail(booking) {
  return String(
    booking?.vendorEmail ||
      booking?.providerEmail ||
      booking?.venueEmail ||
      ""
  ).toLowerCase();
}

/* =====================================================
   PRICE HELPERS
===================================================== */

function getOriginalPrice(booking) {
  return (
    Number(
      booking?.originalPrice ??
        booking?.servicePrice ??
        booking?.price ??
        booking?.amount ??
        0
    ) || 0
  );
}

/*
  IMPORTANT:
  VendorBookings saves quotations using several field
  names for compatibility. We read all of them here.
*/

function getVendorQuotationPrice(booking) {
  return (
    Number(
      booking?.vendorQuotationPrice ??
        booking?.quotationPrice ??
        booking?.quotedPrice ??
        booking?.quotedAmount ??
        booking?.quoteAmount ??
        booking?.vendorQuote ??
        booking?.providerQuote ??
        booking?.providerQuotationPrice ??
        booking?.vendorFinalPrice ??
        0
    ) || 0
  );
}

function getVendorCounterPrice(booking) {
  return (
    Number(
      booking?.vendorCounterPrice ??
        booking?.providerCounterPrice ??
        booking?.vendorCounterOffer ??
        booking?.counterOfferPrice ??
        0
    ) || 0
  );
}

function getVenueQuotationPrice(booking) {
  return (
    Number(
      booking?.venueQuotationPrice ??
        booking?.venueQuote ??
        booking?.quotationPrice ??
        booking?.quotedPrice ??
        booking?.quotedAmount ??
        booking?.quoteAmount ??
        booking?.providerQuote ??
        booking?.providerQuotationPrice ??
        booking?.venueFinalPrice ??
        0
    ) || 0
  );
}

function getVenueCounterPrice(booking) {
  return (
    Number(
      booking?.venueCounterPrice ??
        booking?.venueCounterOffer ??
        booking?.providerCounterPrice ??
        0
    ) || 0
  );
}

function getOrganizerCounterPrice(booking) {
  return (
    Number(
      booking?.organizerCounterPrice ??
        booking?.counterOfferPrice ??
        booking?.counterOffer ??
        booking?.counterPrice ??
        0
    ) || 0
  );
}

function getAgreedPrice(booking) {
  return (
    Number(
      booking?.agreedPrice ??
        booking?.finalPrice ??
        booking?.acceptedPrice ??
        0
    ) || 0
  );
}

function getProviderQuotationPrice(booking) {
  if (getProviderType(booking) === "venue") {
    return getVenueQuotationPrice(booking);
  }

  return getVendorQuotationPrice(booking);
}

function hasProviderQuotation(booking) {
  const status = getBookingStatus(booking);
  const quotation = getProviderQuotationPrice(booking);

  // The quote amount is the reliable signal. Some older records keep
  // status as "pending" even after the provider has submitted a price.
  return (
    quotation > 0 &&
    !isFinalStatus(status) &&
    !["organizer_counter", "counter_sent", "vendor_counter", "vendor_countered", "venue_counter", "venue_countered"].includes(status)
  );
}

function getCurrentNegotiationPrice(booking) {
  const status = getBookingStatus(booking);

  if (status === "accepted") {
    return getAgreedPrice(booking);
  }

  if (
    status === "organizer_counter" ||
    status === "counter_sent"
  ) {
    return getOrganizerCounterPrice(booking);
  }

  if (
    status === "vendor_counter" ||
    status === "vendor_countered"
  ) {
    return getVendorCounterPrice(booking);
  }

  if (
    status === "venue_counter" ||
    status === "venue_countered"
  ) {
    return getVenueCounterPrice(booking);
  }

  const quotation =
    getProviderQuotationPrice(booking);

  if (quotation > 0) {
    return quotation;
  }

  return getOriginalPrice(booking);
}

/* =====================================================
   PAYMENT
===================================================== */

function getPaymentStatus(booking) {
  return String(
    booking?.paymentStatus || "unpaid"
  ).toLowerCase();
}

function getAmountPaid(booking) {
  return Number(booking?.amountPaid) || 0;
}

function getRemainingBalance(booking) {
  const agreedPrice = getAgreedPrice(booking);

  const storedRemaining = Number(
    booking?.remainingBalance
  );

  if (
    Number.isFinite(storedRemaining) &&
    storedRemaining >= 0
  ) {
    return storedRemaining;
  }

  return Math.max(
    agreedPrice - getAmountPaid(booking),
    0
  );
}

function getPaymentStatusText(status) {
  const labels = {
    unpaid: "Payment pending",
    deposit_paid: "50% deposit paid",
    paid: "Fully paid",
    partially_paid: "Partially paid",
  };

  return labels[status] || "Payment pending";
}

function getPaymentStatusClasses(status) {
  const styles = {
    unpaid:
      "border-amber-200 bg-amber-50 text-amber-700",
    deposit_paid:
      "border-blue-200 bg-blue-50 text-blue-700",
    partially_paid:
      "border-blue-200 bg-blue-50 text-blue-700",
    paid:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
  };

  return (
    styles[status] ||
    "border-gray-200 bg-gray-100 text-gray-600"
  );
}

/* =====================================================
   STATUS
===================================================== */

function getStatusText(status, providerType = "vendor") {
  const provider =
    providerType === "venue"
      ? "venue"
      : "provider";

  const labels = {
    pending: `Waiting for ${provider}`,

    quotation_sent: "Quotation received",
    quotation_received: "Quotation received",
    quoted: "Quotation received",
    sent: "Quotation received",

    vendor_counter: "New quotation received",
    vendor_countered: "New quotation received",

    venue_counter: "New venue price received",
    venue_countered: "New venue price received",

    organizer_counter:
      `Counter offer sent to ${provider}`,

    counter_sent:
      `Counter offer sent to ${provider}`,

    quotation_rejected:
      "Quotation rejected",

    accepted:
      "Agreement reached",

    rejected:
      "Booking rejected",

    declined:
      "Declined",

    cancelled:
      "Cancelled",

    canceled:
      "Cancelled",
  };

  return labels[status] || "Booking";
}

function getStatusClasses(status) {
  const styles = {
    pending:
      "border-amber-200 bg-amber-50 text-amber-700",

    quotation_sent:
      "border-indigo-200 bg-indigo-50 text-indigo-700",

    quotation_received:
      "border-indigo-200 bg-indigo-50 text-indigo-700",

    quoted:
      "border-indigo-200 bg-indigo-50 text-indigo-700",

    sent:
      "border-indigo-200 bg-indigo-50 text-indigo-700",

    vendor_counter:
      "border-blue-200 bg-blue-50 text-blue-700",

    vendor_countered:
      "border-blue-200 bg-blue-50 text-blue-700",

    venue_counter:
      "border-blue-200 bg-blue-50 text-blue-700",

    venue_countered:
      "border-blue-200 bg-blue-50 text-blue-700",

    organizer_counter:
      "border-purple-200 bg-purple-50 text-purple-700",

    counter_sent:
      "border-purple-200 bg-purple-50 text-purple-700",

    quotation_rejected:
      "border-red-200 bg-red-50 text-red-700",

    accepted:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    rejected:
      "border-red-200 bg-red-50 text-red-700",

    declined:
      "border-red-200 bg-red-50 text-red-700",

    cancelled:
      "border-gray-200 bg-gray-100 text-gray-600",

    canceled:
      "border-gray-200 bg-gray-100 text-gray-600",
  };

  return (
    styles[status] ||
    "border-gray-200 bg-gray-100 text-gray-600"
  );
}

/* =====================================================
   MAIN DASHBOARD
===================================================== */

export default function OrganizerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] =
    useState(getCurrentUser);

  const [events, setEvents] =
    useState([]);

  const [bookings, setBookings] =
    useState([]);

  const [quotations, setQuotations] =
    useState([]);

  const [savedItems, setSavedItems] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  const [showAllNotifications, setShowAllNotifications] =
    useState(false);

  const [selectedNotification, setSelectedNotification] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [paymentBooking, setPaymentBooking] =
    useState(null);

  const [paymentProcessing, setPaymentProcessing] =
    useState(false);

  /* ===================================================
     AUTH
  =================================================== */

  useEffect(() => {
    const currentUser =
      getCurrentUser();

    if (!currentUser) {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    if (
      currentUser.accountType &&
      currentUser.accountType !==
        "organizer"
    ) {
      navigate("/discover", {
        replace: true,
      });
      return;
    }

    setUser(currentUser);
    setLoading(false);
  }, [navigate]);

  /* ===================================================
     LOAD DATA
  =================================================== */

  useEffect(() => {
    if (!user) return;

    const organizerEmail =
      getOrganizerEmail(user);

    const loadData = () => {
      setEvents(
        getArray(EVENTS_KEY)
      );

      setBookings(
        getBookings()
      );

      setQuotations(
        getQuotations()
      );

      if (organizerEmail) {
        setSavedItems(
          getArray(
            `${SAVED_ITEMS_PREFIX}${organizerEmail}`
          )
        );
        setNotifications(
          getOrganizerNotifications(organizerEmail)
        );
      } else {
        setSavedItems([]);
        setNotifications([]);
      }
    };

    loadData();

    const listeners = [
      "eventflow-bookings-updated",
      "eventflow-booking-updated",
      "eventflow-quotations-updated",
      "eventflow-events-updated",
      "eventflow-saved-items-updated",
      "eventflow-payment-updated",
      "eventflow-notifications-updated",
      "storage",
    ];

    listeners.forEach((eventName) => {
      window.addEventListener(
        eventName,
        loadData
      );
    });

    return () => {
      listeners.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          loadData
        );
      });
    };
  }, [user]);

  /* ===================================================
     EVENTS
  =================================================== */

  const organizerEvents =
    useMemo(() => {
      if (!user) return [];

      const email =
        getOrganizerEmail(user);

      const id =
        getOrganizerId(user);

      return events
        .filter((event) => {
          const eventEmail =
            String(
              event?.organizerEmail ||
                ""
            ).toLowerCase();

          const eventId =
            String(
              event?.organizerId ??
                event?.organizerID ??
                ""
            );

          return (
            (email &&
              eventEmail &&
              email === eventEmail) ||
            (id &&
              eventId &&
              id === eventId)
          );
        })
        .sort(
          (a, b) =>
            new Date(
              b.createdAt || 0
            ) -
            new Date(
              a.createdAt || 0
            )
        );
    }, [events, user]);

  /* ===================================================
     BOOKINGS
  =================================================== */

  const organizerBookings =
    useMemo(() => {
      if (!user) return [];

      const mergedById = new Map();

      // Start with canonical bookings, then merge any matching quotation
      // records so quotation amounts/statuses are not lost between dashboards.
      [...bookings, ...quotations].forEach((record) => {
        if (!record || !isForOrganizer(record, user)) return;
        const id = itemId(record);
        if (!id) return;
        const previous = mergedById.get(id) || {};
        mergedById.set(id, { ...previous, ...record, id });
      });

      return Array.from(mergedById.values()).sort(
        (a, b) =>
          new Date(b.updatedAt || b.lastUpdatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.lastUpdatedAt || a.createdAt || 0)
      );
    }, [bookings, quotations, user]);

  /* ===================================================
     BOOKING GROUPS
  =================================================== */

  const pendingBookings =
    organizerBookings.filter(
      (booking) =>
        getBookingStatus(
          booking
        ) === "pending"
    );

  const quotationBookings =
    organizerBookings.filter(
      (booking) =>
        hasProviderQuotation(
          booking
        )
    );

  const providerCounterBookings =
    organizerBookings.filter(
      (booking) =>
        [
          "vendor_counter",
          "vendor_countered",
          "venue_counter",
          "venue_countered",
        ].includes(
          getBookingStatus(
            booking
          )
        )
    );

  const organizerCounterBookings =
    organizerBookings.filter(
      (booking) =>
        [
          "organizer_counter",
          "counter_sent",
        ].includes(
          getBookingStatus(
            booking
          )
        )
    );

  const acceptedBookings =
    organizerBookings.filter(
      (booking) =>
        getBookingStatus(
          booking
        ) === "accepted"
    );

  const activeBookings =
    organizerBookings.filter(
      (booking) =>
        ![
          "rejected",
          "declined",
          "cancelled",
          "canceled",
          "quotation_rejected",
        ].includes(
          getBookingStatus(
            booking
          )
        )
    );

  const confirmedBookings =
    organizerBookings.filter(
      (booking) =>
        [
          "accepted",
          "confirmed",
          "approved",
        ].includes(
          getBookingStatus(
            booking
          )
        )
    );

  const venueBookings =
    organizerBookings.filter(
      (booking) =>
        getProviderType(
          booking
        ) === "venue"
    );

  const vendorBookings =
    organizerBookings.filter(
      (booking) =>
        getProviderType(
          booking
        ) === "vendor"
    );

  const unpaidAcceptedBookings =
    acceptedBookings.filter(
      (booking) =>
        getPaymentStatus(
          booking
        ) !== "paid"
    );

  const paidBookings =
    acceptedBookings.filter(
      (booking) =>
        getPaymentStatus(
          booking
        ) === "paid"
    );

  /* ===================================================
     UPCOMING EVENTS
  =================================================== */

  const upcomingEvents =
    organizerEvents.filter(
      (event) => {
        if (!event?.eventDate) {
          return true;
        }

        return (
          new Date(
            event.eventDate
          ) >= new Date()
        );
      }
    );

  /* ===================================================
     SAVED ITEMS
  =================================================== */

  const savedVenues =
    savedItems.filter(
      (item) =>
        String(
          item?.type ||
            item?.itemType ||
            item?.category ||
            ""
        ).toLowerCase() ===
        "venue"
    );

  const savedVendors =
    savedItems.filter((item) => {
      const type =
        String(
          item?.type ||
            item?.itemType ||
            ""
        ).toLowerCase();

      return (
        type === "vendor" ||
        type === "service"
      );
    });

  /* ===================================================
     BOOKING UPDATE
  =================================================== */

  const updateBooking = (
    bookingIdValue,
    updater
  ) => {
    const currentBookings =
      getBookings();

    const updatedBookings =
      currentBookings.map(
        (booking) => {
          if (
            itemId(booking) !==
            String(
              bookingIdValue
            )
          ) {
            return booking;
          }

          return updater(
            booking
          );
        }
      );

    saveBookings(
      updatedBookings
    );

    setBookings(
      updatedBookings
    );

    return updatedBookings.find(
      (booking) =>
        itemId(booking) ===
        String(
          bookingIdValue
        )
    );
  };

  /* ===================================================
     PROVIDER NOTIFICATION
  =================================================== */

  const addProviderNotification = (
    booking,
    message,
    type
  ) => {
    const email =
      getProviderEmail(
        booking
      );

    if (!email) return;

    const key = `eventflow${
      getProviderType(
        booking
      ) === "venue"
        ? "Venue"
        : "Vendor"
    }Notifications_${email}`;

    const notifications =
      getArray(key);

    notifications.unshift({
      id: `${type}-${itemId(
        booking
      )}-${Date.now()}`,
      bookingId:
        itemId(booking),
      type,
      message,
      createdAt:
        new Date().toISOString(),
      read: false,
    });

    localStorage.setItem(
      key,
      JSON.stringify(
        notifications.slice(
          0,
          100
        )
      )
    );
  };

  /* ===================================================
     SYNC QUOTATION
  =================================================== */

  const syncQuotation = (
    booking
  ) => {
    const current =
      getQuotations();

    const id =
      itemId(booking);

    const existingIndex =
      current.findIndex(
        (quotation) =>
          itemId(
            quotation
          ) === id
      );

    const quotation = {
      ...booking,
      id,

      status:
        getBookingStatus(
          booking
        ),

      quotationStatus:
        getBookingStatus(
          booking
        ),

      providerType:
        getProviderType(
          booking
        ),

      providerName:
        getProviderName(
          booking
        ),

      price:
        getOriginalPrice(
          booking
        ),

      vendorQuotationPrice:
        booking?.vendorQuotationPrice,

      quotationPrice:
        booking?.quotationPrice,

      quotedPrice:
        booking?.quotedPrice,

      quotedAmount:
        booking?.quotedAmount,

      quoteAmount:
        booking?.quoteAmount,

      providerQuote:
        booking?.providerQuote,

      providerQuotationPrice:
        booking?.providerQuotationPrice,

      vendorQuote:
        booking?.vendorQuote,

      venueQuotationPrice:
        booking?.venueQuotationPrice,

      vendorCounterPrice:
        booking?.vendorCounterPrice,

      venueCounterPrice:
        booking?.venueCounterPrice,

      organizerCounterPrice:
        booking?.organizerCounterPrice,

      agreedPrice:
        booking?.agreedPrice,

      finalPrice:
        booking?.finalPrice,

      paymentStatus:
        booking?.paymentStatus,

      amountPaid:
        booking?.amountPaid,

      remainingBalance:
        booking?.remainingBalance,

      updatedAt:
        booking?.updatedAt,

      lastUpdatedAt:
        booking?.lastUpdatedAt,
    };

    let updated;

    if (existingIndex === -1) {
      updated = [
        ...current,
        quotation,
      ];
    } else {
      updated = [
        ...current,
      ];

      updated[
        existingIndex
      ] = {
        ...updated[
          existingIndex
        ],
        ...quotation,
      };
    }

    saveQuotations(
      updated
    );
  };

  /* ===================================================
     ACCEPT QUOTATION
  =================================================== */

  const acceptBookingPrice = (
    id
  ) => {
    const booking =
      organizerBookings.find(
        (item) =>
          itemId(item) ===
          String(id)
      );

    if (!booking) {
      alert(
        "Booking not found."
      );
      return;
    }

    const status =
      getBookingStatus(
        booking
      );

    if (
      isFinalStatus(
        status
      )
    ) {
      alert(
        "This booking can no longer be negotiated."
      );
      return;
    }

    let amount = 0;

    /*
      If a vendor/venue has sent a quotation,
      that quotation is the price the organizer
      is accepting.
    */

    if (
      hasProviderQuotation(
        booking
      )
    ) {
      amount =
        getProviderQuotationPrice(
          booking
        );
    } else if (
      [
        "vendor_counter",
        "vendor_countered",
      ].includes(status)
    ) {
      amount =
        getVendorCounterPrice(
          booking
        );
    } else if (
      [
        "venue_counter",
        "venue_countered",
      ].includes(status)
    ) {
      amount =
        getVenueCounterPrice(
          booking
        );
    } else {
      amount =
        getCurrentNegotiationPrice(
          booking
        );
    }

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      alert(
        "There is no valid quotation to accept."
      );
      return;
    }

    const provider =
      getProviderName(
        booking
      );

    const confirmed =
      window.confirm(
        `Accept ${provider}'s quotation of GH₵${money(
          amount
        )}?`
      );

    if (!confirmed) {
      return;
    }

    const now =
      new Date().toISOString();

    const updatedBooking =
      updateBooking(
        id,
        (current) => ({
          ...current,

          status:
            "accepted",

          negotiationStatus:
            "accepted",

          quotationStatus:
            "accepted",

          agreedPrice:
            amount,

          finalPrice:
            amount,

          acceptedPrice:
            amount,

          acceptedAt:
            now,

          agreedAt:
            now,

          acceptedBy:
            "organizer",

          lastUpdatedBy:
            "organizer",

          lastUpdatedAt:
            now,

          updatedAt:
            now,

          paymentStatus:
            "unpaid",

          amountPaid:
            0,

          remainingBalance:
            amount,

          paymentOption:
            null,

          agreementLocked:
            true,

          locked:
            true,

          paymentHistory:
            Array.isArray(
              current.paymentHistory
            )
              ? current.paymentHistory
              : [],
        })
      );

    if (!updatedBooking) {
      return;
    }

    syncQuotation(
      updatedBooking
    );

    addProviderNotification(
      updatedBooking,
      `${updatedBooking.organizerName || "The organizer"} accepted your quotation of GH₵${money(
        amount
      )}. The booking is now confirmed.`,
      "booking-price-accepted"
    );

    alert(
      `Agreement reached at GH₵${money(
        amount
      )}. The agreed price is now locked.`
    );
  };

  /* ===================================================
     REJECT QUOTATION / BOOKING
  =================================================== */

  const rejectBooking = (
    id
  ) => {
    const booking =
      organizerBookings.find(
        (item) =>
          itemId(item) ===
          String(id)
      );

    if (!booking) {
      alert(
        "Booking not found."
      );
      return;
    }

    if (
      isFinalStatus(
        getBookingStatus(
          booking
        )
      )
    ) {
      alert(
        "This booking can no longer be changed."
      );
      return;
    }

    const provider =
      getProviderName(
        booking
      );

    const confirmed =
      window.confirm(
        `Reject this booking with ${provider}?`
      );

    if (!confirmed) {
      return;
    }

    const now =
      new Date().toISOString();

    const updatedBooking =
      updateBooking(
        id,
        (current) => ({
          ...current,

          status:
            "rejected",

          negotiationStatus:
            "rejected",

          quotationStatus:
            "rejected",

          rejectedBy:
            "organizer",

          rejectedAt:
            now,

          lastUpdatedBy:
            "organizer",

          lastUpdatedAt:
            now,

          updatedAt:
            now,
        })
      );

    if (!updatedBooking) {
      return;
    }

    syncQuotation(
      updatedBooking
    );

    addProviderNotification(
      updatedBooking,
      `${updatedBooking.organizerName || "The organizer"} rejected the booking request.`,
      "booking-rejected"
    );

    alert(
      "Booking request rejected."
    );
  };

  /* ===================================================
     COUNTER OFFER
  =================================================== */

  const sendBookingCounterOffer = (
    id
  ) => {
    const booking =
      organizerBookings.find(
        (item) =>
          itemId(item) ===
          String(id)
      );

    if (!booking) {
      alert(
        "Booking not found."
      );
      return;
    }

    if (
      isFinalStatus(
        getBookingStatus(
          booking
        )
      )
    ) {
      alert(
        "This booking can no longer be negotiated."
      );
      return;
    }

    const provider =
      getProviderName(
        booking
      );

    const currentAmount =
      getCurrentNegotiationPrice(
        booking
      ) || "";

    const counterAmount =
      window.prompt(
        `Enter your counter offer for ${provider}:`,
        currentAmount
      );

    if (
      counterAmount === null
    ) {
      return;
    }

    const numericAmount =
      Number(
        String(
          counterAmount
        ).replace(
          /,/g,
          ""
        )
      );

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      alert(
        "Please enter a valid counter offer amount."
      );
      return;
    }

    const now =
      new Date().toISOString();

    const updatedBooking =
      updateBooking(
        id,
        (current) => ({
          ...current,

          status:
            "organizer_counter",

          negotiationStatus:
            "organizer_counter",

          organizerCounterPrice:
            numericAmount,

          counterOfferPrice:
            numericAmount,

          counterOffer:
            numericAmount,

          counterPrice:
            numericAmount,

          counterOfferBy:
            "organizer",

          organizerResponse:
            "counter",

          lastUpdatedBy:
            "organizer",

          lastUpdatedAt:
            now,

          updatedAt:
            now,

          organizerCounterSentAt:
            now,
        })
      );

    if (!updatedBooking) {
      return;
    }

    syncQuotation(
      updatedBooking
    );

    addProviderNotification(
      updatedBooking,
      `${updatedBooking.organizerName || "The organizer"} sent you a counter offer of GH₵${money(
        numericAmount
      )}.`,
      "organizer-counter-offer"
    );

    alert(
      `Counter offer of GH₵${money(
        numericAmount
      )} has been sent to ${provider}.`
    );
  };

  /* ===================================================
     PAYMENT
  =================================================== */

  const openPaymentOptions = (
    booking
  ) => {
    if (
      getBookingStatus(
        booking
      ) !== "accepted"
    ) {
      alert(
        "Payment is only available after the price has been agreed."
      );
      return;
    }

    const agreedPrice =
      getAgreedPrice(
        booking
      );

    if (
      !agreedPrice ||
      agreedPrice <= 0
    ) {
      alert(
        "This booking does not have a valid agreed price."
      );
      return;
    }

    setPaymentBooking(
      booking
    );
  };

  const processPayment = (
    paymentOption
  ) => {
    if (!paymentBooking) {
      return;
    }

    const bookingId =
      itemId(
        paymentBooking
      );

    const currentBooking =
      getBookings().find(
        (booking) =>
          itemId(
            booking
          ) === bookingId
      );

    if (!currentBooking) {
      alert(
        "Booking could not be found."
      );

      setPaymentBooking(null);
      return;
    }

    if (
      getBookingStatus(
        currentBooking
      ) !== "accepted"
    ) {
      alert(
        "This booking is no longer available for payment."
      );

      setPaymentBooking(null);
      return;
    }

    const agreedPrice =
      getAgreedPrice(
        currentBooking
      );

    const existingPaid =
      getAmountPaid(
        currentBooking
      );

    const remaining =
      Math.max(
        agreedPrice -
          existingPaid,
        0
      );

    if (
      remaining <= 0
    ) {
      alert(
        "This booking has already been fully paid."
      );

      setPaymentBooking(null);
      return;
    }

    let amountToPay = 0;

    if (
      paymentOption ===
      "deposit"
    ) {
      amountToPay =
        Math.min(
          agreedPrice * 0.5,
          remaining
        );
    }

    if (
      paymentOption ===
      "full"
    ) {
      amountToPay =
        remaining;
    }

    if (
      amountToPay <= 0
    ) {
      alert(
        "There is no payment amount remaining."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Confirm payment of GH₵${money(
          amountToPay
        )}?`
      );

    if (!confirmed) {
      return;
    }

    setPaymentProcessing(
      true
    );

    window.setTimeout(() => {
      const now =
        new Date().toISOString();

      const newAmountPaid =
        Math.min(
          existingPaid +
            amountToPay,
          agreedPrice
        );

      const newRemaining =
        Math.max(
          agreedPrice -
            newAmountPaid,
          0
        );

      let newPaymentStatus =
        "unpaid";

      if (
        newRemaining <= 0
      ) {
        newPaymentStatus =
          "paid";
      } else if (
        newAmountPaid >=
        agreedPrice * 0.5
      ) {
        newPaymentStatus =
          "deposit_paid";
      } else if (
        newAmountPaid > 0
      ) {
        newPaymentStatus =
          "partially_paid";
      }

      const paymentRecord = {
        id: `PAY-${Date.now()}`,
        bookingId,
        amount:
          amountToPay,
        option:
          paymentOption,
        status:
          newPaymentStatus,
        createdAt:
          now,
      };

      const updatedBooking =
        updateBooking(
          bookingId,
          (current) => {
            const history =
              Array.isArray(
                current.paymentHistory
              )
                ? current.paymentHistory
                : [];

            return {
              ...current,

              paymentStatus:
                newPaymentStatus,

              paymentOption:
                paymentOption,

              amountPaid:
                newAmountPaid,

              remainingBalance:
                newRemaining,

              lastPaymentAmount:
                amountToPay,

              lastPaymentAt:
                now,

              paymentHistory: [
                ...history,
                paymentRecord,
              ],

              updatedAt:
                now,

              lastUpdatedAt:
                now,

              lastUpdatedBy:
                "organizer",
            };
          }
        );

      if (updatedBooking) {
        syncQuotation(
          updatedBooking
        );

        addProviderNotification(
          updatedBooking,
          `${updatedBooking.organizerName || "The organizer"} made a payment of GH₵${money(
            amountToPay
          )} for booking ${bookingId}.`,
          "payment-received"
        );

        window.dispatchEvent(
          new Event(
            "eventflow-payment-updated"
          )
        );

        setPaymentBooking(
          null
        );

        alert(
          newPaymentStatus ===
            "paid"
            ? `Full payment of GH₵${money(
                amountToPay
              )} recorded successfully.`
            : `Payment of GH₵${money(
                amountToPay
              )} recorded. Remaining balance: GH₵${money(
                newRemaining
              )}.`
        );
      }

      setPaymentProcessing(
        false
      );
    }, 500);
  };

  /* ===================================================
     ORGANIZER NOTIFICATION ACTIONS
  =================================================== */

  const markNotificationRead = (notificationId) => {
    const email = getOrganizerEmail(user);
    const updated = notifications.map((notification) =>
      String(notification.id) === String(notificationId)
        ? { ...notification, read: true }
        : notification
    );
    saveOrganizerNotifications(email, updated);
    setNotifications(updated);
  };

  const markAllNotificationsRead = () => {
    const email = getOrganizerEmail(user);
    const updated = notifications.map((notification) => ({
      ...notification,
      read: true,
    }));
    saveOrganizerNotifications(email, updated);
    setNotifications(updated);
  };

  const openNotification = (notification) => {
    if (!notification) return;

    const email = getOrganizerEmail(user);
    const updated = notifications.map((item) =>
      String(item.id) === String(notification.id)
        ? { ...item, read: true }
        : item
    );

    saveOrganizerNotifications(email, updated);
    setNotifications(updated);
    setSelectedNotification({ ...notification, read: true });
  };

  const openRelatedBooking = (notification) => {
    setSelectedNotification(null);
    const bookingId = String(
      notification?.bookingId ?? notification?.booking?.id ?? notification?.booking?._id ?? ""
    );
    window.setTimeout(() => {
      const section = document.getElementById("organizer-provider-negotiations");
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (bookingId) {
        const bookingCard = document.getElementById(`organizer-booking-${bookingId}`);
        bookingCard?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);
  };

  /* ===================================================
     DELETE EVENT
  =================================================== */

  const deleteEvent = (
    eventId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this event?"
      );

    if (!confirmed) return;

    const updatedEvents =
      events.filter(
        (event) =>
          String(
            event?.id
          ) !==
          String(eventId)
      );

    setEvents(
      updatedEvents
    );

    saveArray(
      EVENTS_KEY,
      updatedEvents
    );

    window.dispatchEvent(
      new Event(
        "eventflow-events-updated"
      )
    );
  };

  /* ===================================================
     LOGOUT
  =================================================== */

  const handleLogout = () => {
    localStorage.removeItem(
      "eventflowUser"
    );

    localStorage.removeItem(
      "eventflowLoggedIn"
    );

    window.dispatchEvent(
      new Event(
        "eventflow-auth-changed"
      )
    );

    navigate("/login", {
      replace: true,
    });
  };

  if (
    loading ||
    !user
  ) {
    return null;
  }

  const organizerName =
    user.firstName ||
    user.name ||
    "Organizer";

  return (
    <div className="eventflow-organizer-theme min-h-screen bg-[#080b18] text-slate-100">
      <style>{`
        .eventflow-organizer-theme {
          color-scheme: light;
          background: #f6f7fb !important;
          color: #20243a;
          min-height: 100vh;
        }
        .eventflow-organizer-theme main { max-width: 1480px; }
        .eventflow-organizer-theme .bg-white { background-color: #ffffff !important; }
        .eventflow-organizer-theme .bg-white\/70 { background-color: rgba(255,255,255,.92) !important; }
        .eventflow-organizer-theme .bg-gray-50,
        .eventflow-organizer-theme .bg-gray-50\/70,
        .eventflow-organizer-theme .bg-gray-50\/80 { background-color: #f8f9fc !important; }
        .eventflow-organizer-theme .bg-gray-100 { background-color: #f0f1f7 !important; }
        .eventflow-organizer-theme .bg-gray-200 { background-color: #e6e8f0 !important; }
        .eventflow-organizer-theme .border-gray-100 { border-color: #eceef4 !important; }
        .eventflow-organizer-theme .border-gray-200 { border-color: #e4e6ef !important; }
        .eventflow-organizer-theme .border-gray-300 { border-color: #d9dce8 !important; }
        .eventflow-organizer-theme .border-dashed { border-color: #d6d8e6 !important; }
        .eventflow-organizer-theme .border-t,
        .eventflow-organizer-theme .border-b { border-color: #eceef4 !important; }
        .eventflow-organizer-theme .text-gray-950,
        .eventflow-organizer-theme .text-gray-900,
        .eventflow-organizer-theme .text-gray-800 { color: #20243a !important; }
        .eventflow-organizer-theme .text-gray-700 { color: #41465e !important; }
        .eventflow-organizer-theme .text-gray-600 { color: #62677d !important; }
        .eventflow-organizer-theme .text-gray-500 { color: #85899b !important; }
        .eventflow-organizer-theme .text-gray-400 { color: #a0a4b3 !important; }
        .eventflow-organizer-theme .bg-gray-950 { background-color: #4f46a5 !important; }
        .eventflow-organizer-theme .hover\:bg-gray-800:hover { background-color: #40388f !important; }
        .eventflow-organizer-theme .bg-purple-50,
        .eventflow-organizer-theme .bg-purple-100,
        .eventflow-organizer-theme .bg-purple-100\/50 { background-color: #f2efff !important; }
        .eventflow-organizer-theme .border-purple-100 { border-color: #e7e0ff !important; }
        .eventflow-organizer-theme .border-purple-200 { border-color: #d8ccff !important; }
        .eventflow-organizer-theme .text-purple-700 { color: #5b4ab5 !important; }
        .eventflow-organizer-theme .hover\:bg-purple-50:hover { background-color: #f2efff !important; }
        .eventflow-organizer-theme .bg-indigo-50,
        .eventflow-organizer-theme .bg-blue-50 { background-color: #eef2ff !important; }
        .eventflow-organizer-theme .border-indigo-100,
        .eventflow-organizer-theme .border-blue-200 { border-color: #dce3ff !important; }
        .eventflow-organizer-theme input,
        .eventflow-organizer-theme select,
        .eventflow-organizer-theme textarea {
          color: #272a40; background-color: #fff; border-color: #dfe2ec;
        }
        .eventflow-organizer-theme input::placeholder,
        .eventflow-organizer-theme textarea::placeholder { color: #a0a4b3; }
        .eventflow-organizer-theme input:focus,
        .eventflow-organizer-theme select:focus,
        .eventflow-organizer-theme textarea:focus { outline-color: #8b7be8; border-color: #8b7be8; }
        .eventflow-organizer-theme article,
        .eventflow-organizer-theme section { box-shadow: 0 2px 10px rgba(34, 39, 72, .035); }
        .eventflow-organizer-theme button,
        .eventflow-organizer-theme a { transition: background-color .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease; }
        .eventflow-organizer-theme button:hover,
        .eventflow-organizer-theme a:hover { border-color: #c9bfff; }
        .eventflow-organizer-theme .shadow-sm { box-shadow: 0 2px 8px rgba(34,39,72,.04) !important; }
        .eventflow-organizer-theme .hover\:shadow-md:hover { box-shadow: 0 10px 24px rgba(34,39,72,.08) !important; }
        .eventflow-organizer-theme .bg-emerald-50,
        .eventflow-organizer-theme .bg-green-50 { background-color: #eaf8f1 !important; }
        .eventflow-organizer-theme .bg-red-50 { background-color: #fff0f0 !important; }
        .eventflow-organizer-theme .bg-yellow-50,
        .eventflow-organizer-theme .bg-amber-50 { background-color: #fff7e5 !important; }
        .eventflow-organizer-theme .border-emerald-200,
        .eventflow-organizer-theme .border-green-200 { border-color: #bcebd5 !important; }
        .eventflow-organizer-theme .border-red-200 { border-color: #ffd0d0 !important; }
        .eventflow-organizer-theme .border-yellow-200,
        .eventflow-organizer-theme .border-amber-200 { border-color: #f6df9d !important; }
        .eventflow-organizer-theme .text-emerald-700,
        .eventflow-organizer-theme .text-green-700 { color: #087b53 !important; }
        .eventflow-organizer-theme .text-red-600,
        .eventflow-organizer-theme .text-red-700 { color: #c83245 !important; }
        .eventflow-organizer-theme .text-blue-700,
        .eventflow-organizer-theme .text-indigo-700 { color: #4f46a5 !important; }
        .eventflow-organizer-theme .eventflow-hero {
          border: 1px solid #e6e1fb !important;
          background: #fff !important;
          box-shadow: 0 5px 20px rgba(52, 45, 99, .045) !important;
        }
        .eventflow-organizer-theme .eventflow-hero:before { display: none; }
        .eventflow-organizer-theme .eventflow-hero > div:first-child {
          padding-top: 2.25rem; padding-bottom: 2.25rem;
          background: linear-gradient(105deg, #ffffff 0%, #fbfaff 65%, #f4f0ff 100%);
        }
        .eventflow-organizer-theme .eventflow-hero h1 { letter-spacing: -.035em; color: #24213c !important; }
        .eventflow-organizer-theme .eventflow-hero a:first-child,
        .eventflow-organizer-theme .eventflow-hero a.bg-gray-950 {
          border: 1px solid #5144a5 !important;
          background: #5144a5 !important;
          box-shadow: 0 3px 8px rgba(81,68,165,.14);
        }
        .eventflow-organizer-theme .eventflow-hero a:first-child:hover { background: #40358f !important; }
        .eventflow-organizer-theme .eventflow-hero > div:last-child {
          background: #fff; border-top-color: #eceaf6 !important;
        }
        .eventflow-organizer-theme .eventflow-notifications,
        .eventflow-organizer-theme .eventflow-payments,
        .eventflow-organizer-theme .eventflow-negotiations {
          border: 1px solid #e5e6ef !important;
          background: #fff !important;
          box-shadow: 0 3px 12px rgba(34,39,72,.035) !important;
        }
        .eventflow-organizer-theme .eventflow-notifications > div:first-child { background: #fbfbfe; }
        .eventflow-organizer-theme .eventflow-notifications button:hover { background-color: #f8f6ff !important; }
        .eventflow-organizer-theme .eventflow-quick-actions > div:last-child > a,
        .eventflow-organizer-theme .eventflow-quick-actions > div:last-child > button {
          border: 1px solid #e4e1f2 !important; background: #fff !important;
          box-shadow: 0 2px 7px rgba(34,39,72,.025);
        }
        .eventflow-organizer-theme .eventflow-quick-actions > div:last-child > a:hover,
        .eventflow-organizer-theme .eventflow-quick-actions > div:last-child > button:hover { background: #f8f6ff !important; }
        .eventflow-organizer-theme article {
          border-color: #e8e9f1 !important; background: #fff !important;
          box-shadow: 0 2px 8px rgba(34,39,72,.025) !important;
        }
        .eventflow-organizer-theme article:hover { border-color: #d7d0f6 !important; }
        .eventflow-organizer-theme .rounded-3xl { border-radius: 1.15rem; }
        .eventflow-organizer-theme .rounded-2xl { border-radius: .9rem; }
        .eventflow-organizer-theme button, .eventflow-organizer-theme a { -webkit-tap-highlight-color: transparent; }
        .eventflow-organizer-theme ::selection { background: #e4ddff; color: #292344; }
        @media (max-width: 640px) {
          .eventflow-organizer-theme main { padding-top: 1rem; }
          .eventflow-organizer-theme section, .eventflow-organizer-theme article { border-radius: .9rem; }
          .eventflow-organizer-theme .eventflow-hero > div:first-child { padding-top: 1.5rem; padding-bottom: 1.5rem; }
        }
      `}</style>
      <Navbar />

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="eventflow-hero overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          <div className="relative px-6 py-8 sm:px-8 lg:px-10 lg:py-10">

            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-purple-100/50 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">

              <div className="max-w-3xl">

                <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                  Organizer workspace
                </div>

                <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
                  Welcome back, {organizerName}
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-500 sm:text-base">
                  Plan your events, manage provider
                  quotations, negotiate pricing and
                  keep your confirmed bookings in one
                  organized workspace.
                </p>

              </div>

              <div className="relative flex flex-wrap gap-3">

                <Link
                  to="/discover"
                  className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                >
                  Discover providers
                </Link>

                <Link
                  to="/dashboard/organizer/events/create"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                >
                  Create event
                </Link>

              </div>

            </div>

          </div>

          <div className="grid border-t border-gray-100 sm:grid-cols-2 lg:grid-cols-4">

            <HeroMetric
              label="Events"
              value={organizerEvents.length}
            />

            <HeroMetric
              label="Active bookings"
              value={activeBookings.length}
            />

            <HeroMetric
              label="Quotations"
              value={quotationBookings.length}
            />

            <HeroMetric
              label="Agreements"
              value={acceptedBookings.length}
            />

          </div>

        </section>

        {/* =================================================
            ORGANIZER NOTIFICATIONS
        ================================================= */}

        <section className="eventflow-notifications mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-xl text-purple-700">
                ♢
                {notifications.some((item) => !item.read) && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-950">Notifications</h2>
                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-extrabold text-purple-700">
                    {notifications.filter((item) => !item.read).length} unread
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">Updates about your bookings, quotations and payments.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllNotifications((value) => !value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
                >
                  {showAllNotifications ? "Show less" : "View all"}
                </button>
              )}
              {notifications.some((item) => !item.read) && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-purple-700"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-lg">✓</div>
              <p className="mt-3 text-sm font-bold text-gray-800">You're all caught up</p>
              <p className="mt-1 text-xs text-gray-500">New provider responses and booking updates will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(showAllNotifications ? notifications : notifications.slice(0, 4)).map((notification, index) => (
                <button
                  type="button"
                  key={notification.id || `${notification.createdAt || "notice"}-${index}`}
                  onClick={() => openNotification(notification)}
                  className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-gray-50 sm:px-7 ${notification.read ? "bg-white" : "bg-purple-50/50"}`}
                >
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read ? "bg-gray-300" : "bg-purple-600"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-6 text-gray-800">
                      {notification.message || notification.title || "Your booking has been updated."}
                    </span>
                    <span className="mt-1 block text-xs text-gray-400">
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleString("en-GH") : "Recent update"}
                      {notification.bookingId ? ` · Booking ${notification.bookingId}` : ""}
                    </span>
                  </span>
                  {!notification.read && <span className="shrink-0 rounded-full bg-purple-100 px-2 py-1 text-[10px] font-extrabold text-purple-700">NEW</span>}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="eventflow-quick-actions mt-8">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-600">
                Workspace
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-950">
                Quick actions
              </h2>
            </div>

          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <QuickAction
              title="Discover providers"
              description="Find vendors and venues"
              to="/discover"
              icon="D"
            />

            <QuickAction
              title="Create an event"
              description="Start planning a new event"
              to="/dashboard/organizer/events/create"
              icon="+"
            />

            <QuickAction
              title="View saved venues"
              description={`${savedVenues.length} saved venues`}
              to="/venues"
              icon="V"
            />

            <QuickAction
              title="View saved vendors"
              description={`${savedVendors.length} saved vendors`}
              to="/discover"
              icon="S"
            />

          </div>

        </section>

        {/* =================================================
            PAYMENT OVERVIEW
        ================================================= */}

        {acceptedBookings.length > 0 && (
          <section className="eventflow-payments mt-8 rounded-3xl border border-gray-200 bg-white p-5 sm:p-7">

            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-600">
                Financial overview
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-950">
                Booking payments
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <FinancialCard
                label="Agreed value"
                value={`GH₵${money(
                  acceptedBookings.reduce(
                    (total, booking) =>
                      total +
                      getAgreedPrice(
                        booking
                      ),
                    0
                  )
                )}`}
                description="Total confirmed booking value"
              />

              <FinancialCard
                label="Paid"
                value={`GH₵${money(
                  acceptedBookings.reduce(
                    (total, booking) =>
                      total +
                      getAmountPaid(
                        booking
                      ),
                    0
                  )
                )}`}
                description="Payments recorded"
              />

              <FinancialCard
                label="Outstanding"
                value={`GH₵${money(
                  acceptedBookings.reduce(
                    (total, booking) =>
                      total +
                      getRemainingBalance(
                        booking
                      ),
                    0
                  )
                )}`}
                description="Remaining provider balances"
              />

              <FinancialCard
                label="Payment status"
                value={
                  paidBookings.length
                }
                description="Bookings fully paid"
              />

            </div>

          </section>
        )}

        {/* =================================================
            PROVIDER NEGOTIATIONS
        ================================================= */}

        <section id="organizer-provider-negotiations" className="eventflow-negotiations mt-12 scroll-mt-6 rounded-3xl border border-gray-200 bg-white p-5 sm:p-7">

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-600">
                Booking management
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
                Provider negotiations
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Review quotations, negotiate prices and
                confirm provider agreements before making
                payments.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <StatusPill
                label="Waiting"
                value={
                  pendingBookings.length
                }
                tone="amber"
              />

              <StatusPill
                label="Quotations"
                value={
                  quotationBookings.length
                }
                tone="indigo"
              />

              <StatusPill
                label="Your counters"
                value={
                  organizerCounterBookings.length
                }
                tone="purple"
              />

              <StatusPill
                label="Agreed"
                value={
                  acceptedBookings.length
                }
                tone="green"
              />

            </div>

          </div>

          {organizerBookings.length === 0 ? (
            <EmptyState
              icon="B"
              title="No booking activity yet"
              text="When you request a service or venue, the provider's response and quotation will appear here."
              action={
                <Link
                  to="/discover"
                  className="inline-flex rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
                >
                  Explore providers
                </Link>
              }
            />
          ) : (
            <div className="mt-6 space-y-5">

              {organizerBookings.map(
                (booking) => (
                  <div id={`organizer-booking-${itemId(booking)}`} key={itemId(booking)} className="scroll-mt-6">
                  <BookingNegotiationCard
                    booking={booking}
                    onAccept={() =>
                      acceptBookingPrice(
                        itemId(
                          booking
                        )
                      )
                    }
                    onReject={() =>
                      rejectBooking(
                        itemId(
                          booking
                        )
                      )
                    }
                    onCounter={() =>
                      sendBookingCounterOffer(
                        itemId(
                          booking
                        )
                      )
                    }
                    onPayment={() =>
                      openPaymentOptions(
                        booking
                      )
                    }
                  />
                  </div>
                )
              )}

            </div>
          )}

        </section>

        {/* =================================================
            MY EVENTS
        ================================================= */}

        <section className="mt-14">

          <SectionHeading
            eyebrow="Event management"
            title="My events"
            description="Keep your event plans, dates and locations organized."
            action={
              <Link
                to="/dashboard/organizer/events/create"
                className="text-sm font-bold text-purple-600 hover:text-purple-700"
              >
                Create event →
              </Link>
            }
          />

          {organizerEvents.length === 0 ? (
            <EmptyState
              icon="C"
              title="No events created"
              text="Create your first event to start organizing providers and bookings."
              action={
                <Link
                  to="/dashboard/organizer/events/create"
                  className="inline-flex rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
                >
                  Create event
                </Link>
              }
            />
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {organizerEvents.map(
                (event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onDelete={() =>
                      deleteEvent(
                        event.id
                      )
                    }
                  />
                )
              )}

            </div>
          )}

        </section>

        {/* =================================================
            UPCOMING
        ================================================= */}

        <section className="mt-14">

          <SectionHeading
            eyebrow="Schedule"
            title="Upcoming events"
            description="A quick view of the events coming up next."
          />

          {upcomingEvents.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-7 text-sm text-gray-500">
              No upcoming events.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {upcomingEvents
                .slice(0, 6)
                .map((event) => (
                  <UpcomingEvent
                    key={event.id}
                    event={event}
                  />
                ))}

            </div>
          )}

        </section>

        {/* =================================================
            PAYMENT ACTIVITY
        ================================================= */}

        <section className="mt-14">

          <SectionHeading
            eyebrow="Payments"
            title="Payment activity"
            description="Review agreed prices, payments made and outstanding balances."
          />

          {acceptedBookings.length === 0 ? (
            <EmptyState
              icon="P"
              title="No payment activity yet"
              text="Once you reach an agreement with a provider, payment information will appear here."
            />
          ) : (
            <div className="mt-6 space-y-4">

              {acceptedBookings.map(
                (booking) => (
                  <PaymentActivityCard
                    key={itemId(
                      booking
                    )}
                    booking={booking}
                    onPayment={() =>
                      openPaymentOptions(
                        booking
                      )
                    }
                  />
                )
              )}

            </div>
          )}

        </section>

        {/* =================================================
            SAVED PROVIDERS
        ================================================= */}

        <section className="mt-14">

          <SectionHeading
            eyebrow="Saved providers"
            title="Your shortlist"
            description="Keep your preferred venues and service providers close while planning."
          />

          <div className="mt-6 grid gap-5 lg:grid-cols-2">

            <SavedItemsSection
              title="Saved venues"
              items={savedVenues}
              emptyMessage="Save venues you like and they will appear here."
              type="venue"
            />

            <SavedItemsSection
              title="Saved vendors"
              items={savedVendors}
              emptyMessage="Save vendors you like and they will appear here."
              type="vendor"
            />

          </div>

        </section>

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="mt-16 border-t border-gray-200 bg-white">

        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-3 px-5 py-7 text-sm text-gray-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">

          <p className="font-semibold text-gray-700">
            EventFlow
          </p>

          <p>
            Plan your event with confidence.
          </p>

        </div>

      </footer>

      {/* =================================================
          PAYMENT MODAL
      ================================================= */}

      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onViewBooking={() => openRelatedBooking(selectedNotification)}
        />
      )}

      {paymentBooking && (
        <PaymentModal
          booking={
            paymentBooking
          }
          processing={
            paymentProcessing
          }
          onClose={() => {
            if (
              !paymentProcessing
            ) {
              setPaymentBooking(
                null
              );
            }
          }}
          onPay={
            processPayment
          }
        />
      )}

    </div>
  );
}

/* =====================================================
   BOOKING CARD
===================================================== */

function BookingNegotiationCard({
  booking,
  onAccept,
  onReject,
  onCounter,
  onPayment,
}) {
  const status =
    getBookingStatus(
      booking
    );

  const providerType =
    getProviderType(
      booking
    );

  const providerLabel =
    getProviderLabel(
      booking
    );

  const providerName =
    getProviderName(
      booking
    );

  const originalPrice =
    getOriginalPrice(
      booking
    );

  const quotationPrice =
    getProviderQuotationPrice(
      booking
    );

  const vendorCounter =
    getVendorCounterPrice(
      booking
    );

  const venueCounter =
    getVenueCounterPrice(
      booking
    );

  const organizerCounter =
    getOrganizerCounterPrice(
      booking
    );

  const agreedPrice =
    getAgreedPrice(
      booking
    );

  const providerCounterPrice =
    providerType === "venue"
      ? venueCounter
      : vendorCounter;

  const hasQuotation =
    hasProviderQuotation(
      booking
    );

  const isProviderCounter =
    [
      "vendor_counter",
      "vendor_countered",
      "venue_counter",
      "venue_countered",
    ].includes(status);

  const waitingForProvider =
    [
      "organizer_counter",
      "counter_sent",
    ].includes(status);

  const canRespond =
    !isFinalStatus(status) &&
    !waitingForProvider;

  const hasNegotiableProviderPrice =
    quotationPrice > 0 ||
    vendorCounter > 0 ||
    venueCounter > 0;

  const showFallbackNegotiationActions =
    !hasQuotation &&
    !isProviderCounter &&
    !waitingForProvider &&
    !isFinalStatus(status) &&
    hasNegotiableProviderPrice;

  const paymentStatus =
    getPaymentStatus(
      booking
    );

  return (
    <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">

      {/* =================================================
          CARD HEADER
      ================================================= */}

      <div className="border-b border-gray-100 px-5 py-5 sm:px-7">

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">

          <div className="flex min-w-0 items-start gap-4">

            <ProviderIcon
              type={
                providerType
              }
            />

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
                  {providerLabel}
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                    status
                  )}`}
                >
                  {getStatusText(
                    status,
                    providerType
                  )}
                </span>

                {status ===
                  "accepted" && (
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getPaymentStatusClasses(
                      paymentStatus
                    )}`}
                  >
                    {getPaymentStatusText(
                      paymentStatus
                    )}
                  </span>
                )}

              </div>

              <h3 className="mt-2 truncate text-lg font-bold text-gray-950">
                {providerName}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {booking?.serviceName ||
                  booking?.service ||
                  (providerType ===
                  "venue"
                    ? "Event venue"
                    : "Event service")}
              </p>

            </div>

          </div>

          <div className="rounded-xl bg-gray-50 px-4 py-3 lg:text-right">

            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Booking reference
            </p>

            <p className="mt-1 font-mono text-xs font-bold text-gray-600">
              {itemId(
                booking
              )}
            </p>

          </div>

        </div>

      </div>

      {/* =================================================
          EVENT DETAILS
      ================================================= */}

      <div className="px-5 py-6 sm:px-7">

        <div className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4">

          <Detail
            label="Event"
            value={
              booking?.eventName ||
              "Event"
            }
          />

          <Detail
            label="Date"
            value={
              booking?.eventDate ||
              "Not provided"
            }
          />

          <Detail
            label="Location"
            value={
              booking?.eventLocation ||
              booking?.location ||
              "Not provided"
            }
          />

          <Detail
            label="Guests"
            value={
              booking?.guestCount ||
              "Not provided"
            }
          />

        </div>

        {/* =================================================
            PRICE SNAPSHOT
        ================================================= */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <PriceBox
            label="Starting price"
            value={
              originalPrice
            }
          />

          {hasQuotation && (
            <PriceBox
              label="Provider quotation"
              value={
                quotationPrice
              }
              highlight
            />
          )}

          {isProviderCounter && (
            <PriceBox
              label="Latest provider price"
              value={
                providerCounterPrice
              }
              highlight
            />
          )}

          {waitingForProvider && (
            <PriceBox
              label="Your counter offer"
              value={
                organizerCounter
              }
              purple
            />
          )}

          {status ===
            "accepted" && (
            <PriceBox
              label="Agreed price"
              value={
                agreedPrice
              }
              accepted
            />
          )}

        </div>

        {/* =================================================
            PROVIDER QUOTATION
        ================================================= */}

        {hasQuotation && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50">

            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-extrabold text-indigo-700 shadow-sm">
                  GH
                </div>

                <div>

                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-indigo-600">
                    Quotation received
                  </p>

                  <p className="mt-1 text-sm font-semibold text-indigo-950">
                    {providerName} has submitted a quotation
                    for your booking.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-indigo-700">
                    Review the provider's price below.
                    You can accept it or make a counter offer.
                  </p>

                </div>

              </div>

              <div className="shrink-0 rounded-2xl border border-indigo-100 bg-white px-6 py-4 text-left shadow-sm sm:text-right">

                <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
                  Provider quotation
                </p>

                <p className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950">
                  GH₵
                  {money(
                    quotationPrice
                  )}
                </p>

              </div>

            </div>

            {canRespond && (
              <div className="flex flex-col gap-2 border-t border-indigo-200 bg-white/70 p-4 sm:flex-row sm:justify-end">

                <button
                  onClick={
                    onReject
                  }
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                >
                  Reject
                </button>

                <button
                  onClick={
                    onCounter
                  }
                  className="rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-xs font-bold text-purple-700 transition hover:bg-purple-50"
                >
                  Counter offer
                </button>

                <button
                  onClick={
                    onAccept
                  }
                  className="rounded-xl bg-gray-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800"
                >
                  Accept quotation
                </button>

              </div>
            )}

          </div>
        )}

        {/* =================================================
            PROVIDER COUNTER
        ================================================= */}

        {isProviderCounter && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-blue-200 bg-blue-50">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-extrabold text-blue-700">
                  GH
                </div>

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">
                    New price received
                  </p>

                  <p className="mt-1 text-sm text-blue-950">
                    {providerName} has responded with a new price of{" "}
                    <strong>GH₵{money(providerCounterPrice)}</strong>.
                  </p>

                  <p className="mt-1 text-xs text-blue-700">
                    You can accept this price, reject the booking, or send a counter offer of your own.
                  </p>
                </div>
              </div>
            </div>

            {canRespond && (
              <div className="flex flex-col gap-2 border-t border-blue-200 bg-white/70 p-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onReject}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                >
                  Reject
                </button>

                <button
                  type="button"
                  onClick={onCounter}
                  className="rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-xs font-bold text-purple-700 transition hover:bg-purple-50"
                >
                  Counter offer
                </button>

                <button
                  type="button"
                  onClick={onAccept}
                  className="rounded-xl bg-gray-950 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800"
                >
                  Accept price
                </button>
              </div>
            )}
          </div>
        )}

        {/* =================================================
            FALLBACK NEGOTIATION ACTIONS
            Covers legacy records whose price/status fields differ.
        ================================================= */}

        {showFallbackNegotiationActions && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-purple-200 bg-purple-50">
            <div className="p-5">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-purple-700">
                Provider price available
              </p>
              <p className="mt-2 text-sm text-gray-800">
                Review the price from {providerName} and choose how you want to proceed.
              </p>
              <p className="mt-3 text-2xl font-extrabold text-gray-950">
                GH₵{money(quotationPrice || providerCounterPrice || vendorCounter || venueCounter)}
              </p>
            </div>
            {canRespond && (
              <div className="flex flex-col gap-2 border-t border-purple-200 bg-white p-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onReject}
                  className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={onCounter}
                  className="rounded-xl border border-purple-200 bg-white px-5 py-3 text-sm font-bold text-purple-700 hover:bg-purple-50"
                >
                  Counter Offer
                </button>
                <button
                  type="button"
                  onClick={onAccept}
                  className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
                >
                  Accept Price
                </button>
              </div>
            )}
          </div>
        )}

        {/* =================================================
            ORGANIZER COUNTER
        ================================================= */}

        {waitingForProvider && (
          <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5">

            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-purple-700">
              Counter offer sent
            </p>

            <p className="mt-1 text-sm text-purple-950">
              You offered{" "}
              <strong>
                GH₵
                {money(
                  organizerCounter
                )}
              </strong>{" "}
              to {providerName}.
            </p>

            <p className="mt-1 text-xs text-purple-700">
              Waiting for the provider to accept or send
              another quotation.
            </p>

          </div>
        )}

        {/* =================================================
            PENDING
        ================================================= */}

        {status ===
          "pending" && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">

            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-amber-700">
              Request submitted
            </p>

            <p className="mt-1 text-sm text-amber-950">
              Your booking request has been sent to{" "}
              <strong>
                {providerName}
              </strong>
              .
            </p>

            <p className="mt-1 text-xs text-amber-700">
              The provider will review your requirements and
              submit a quotation.
            </p>

          </div>
        )}

        {/* =================================================
            ACCEPTED
        ================================================= */}

        {status ===
          "accepted" && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">

            <div className="p-5 sm:p-6">

              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                      ✓
                    </span>

                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                      Agreement confirmed
                    </p>

                  </div>

                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-950">
                    GH₵
                    {money(
                      agreedPrice
                    )}
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    The agreed price is locked.
                  </p>

                </div>

                <div className="rounded-2xl border border-emerald-200 bg-white px-5 py-4">

                  <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
                    Payment status
                  </p>

                  <p className="mt-1 text-sm font-bold text-emerald-700">
                    {getPaymentStatusText(
                      paymentStatus
                    )}
                  </p>

                </div>

              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">

                <PaymentMiniStat
                  label="Agreed"
                  value={
                    agreedPrice
                  }
                />

                <PaymentMiniStat
                  label="Paid"
                  value={getAmountPaid(
                    booking
                  )}
                />

                <PaymentMiniStat
                  label="Remaining"
                  value={getRemainingBalance(
                    booking
                  )}
                />

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            REJECTED
        ================================================= */}

        {[
          "rejected",
          "declined",
          "quotation_rejected",
        ].includes(status) && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">

            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-red-600">
              Booking closed
            </p>

            <p className="mt-1 text-sm text-red-900">
              This booking negotiation has been closed.
            </p>

          </div>
        )}

      </div>

      {/* =================================================
          ACTION FOOTER
      ================================================= */}

      <div className="flex flex-col justify-between gap-4 border-t border-gray-100 bg-gray-50/80 px-5 py-4 sm:flex-row sm:items-center sm:px-7">

        <div className="text-xs text-gray-400">

          {booking?.updatedAt
            ? `Last updated ${new Date(
                booking.updatedAt
              ).toLocaleDateString(
                "en-GH"
              )}`
            : "Booking request"}

        </div>

        <div className="flex flex-wrap gap-2">

          {!hasQuotation &&
            canRespond &&
            status ===
              "pending" && (
              <button
                onClick={
                  onReject
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
              >
                Reject
              </button>
            )}

          {status ===
            "accepted" &&
            paymentStatus !==
              "paid" && (
              <button
                onClick={
                  onPayment
                }
                className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-purple-700"
              >
                Make payment
              </button>
            )}

          {status ===
            "accepted" &&
            paymentStatus ===
              "paid" && (
              <span className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-bold text-emerald-700">
                Payment complete
              </span>
            )}

          {waitingForProvider && (
            <span className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-500">
              Waiting for provider response
            </span>
          )}

        </div>

      </div>

    </article>
  );
}

/* =====================================================
   NOTIFICATION DETAIL MODAL
===================================================== */

function NotificationDetailModal({ notification, onClose, onViewBooking }) {
  const message =
    notification?.message ||
    notification?.content ||
    notification?.body ||
    notification?.text ||
    "You have a new EventFlow update.";
  const type = String(notification?.type || "update").replace(/[_-]+/g, " ");
  const bookingId = notification?.bookingId ?? notification?.booking?.id ?? notification?.booking?._id;
  const isMessage = /message|chat|reply|inbox/i.test(`${notification?.type || ""} ${notification?.title || ""}`);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="notification-detail-title" className="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-6 text-white sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl">{isMessage ? "✉" : "♢"}</span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-purple-100">{isMessage ? "Message" : "Notification details"}</p>
                <h2 id="notification-detail-title" className="mt-1 text-xl font-extrabold">{notification?.title || (isMessage ? "New message" : "EventFlow update")}</h2>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close notification" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl hover:bg-white/20">×</button>
          </div>
        </div>
        <div className="px-6 py-6 sm:px-7">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">{type}</p>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-gray-800">{message}</p>
            {notification?.createdAt && <p className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-400">{new Date(notification.createdAt).toLocaleString("en-GH")}</p>}
          </div>
          {bookingId && <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-xs leading-5 text-purple-800">Related booking: <strong>{bookingId}</strong></div>}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">Close</button>
            {bookingId && <button type="button" onClick={onViewBooking} className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700">View related booking</button>}
          </div>
        </div>
      </section>
    </div>
  );
}

/* =====================================================
   PAYMENT MODAL
===================================================== */

function PaymentModal({
  booking,
  processing,
  onClose,
  onPay,
}) {
  const providerName =
    getProviderName(
      booking
    );

  const agreedPrice =
    getAgreedPrice(
      booking
    );

  const amountPaid =
    getAmountPaid(
      booking
    );

  const remaining =
    getRemainingBalance(
      booking
    );

  const depositAmount =
    Math.min(
      agreedPrice * 0.5,
      remaining
    );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">

      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

        <div className="border-b border-gray-100 px-6 py-6 sm:px-7">

          <div className="flex items-start justify-between gap-5">

            <div>

              <div className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-purple-700">
                EventFlow payments
              </div>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-950">
                Choose payment option
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Your agreement with{" "}
                <strong className="text-gray-800">
                  {providerName}
                </strong>{" "}
                is confirmed.
              </p>

            </div>

            <button
              onClick={
                onClose
              }
              disabled={
                processing
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
            >
              ×
            </button>

          </div>

        </div>

        <div className="px-6 py-6 sm:px-7">

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">

            <div className="grid gap-5 sm:grid-cols-3">

              <PaymentSummary
                label="Agreed price"
                value={
                  agreedPrice
                }
              />

              <PaymentSummary
                label="Already paid"
                value={
                  amountPaid
                }
              />

              <PaymentSummary
                label="Remaining"
                value={
                  remaining
                }
                emphasis
              />

            </div>

          </div>

          <div className="mt-5 space-y-3">

            <PaymentOption
              title="Pay full amount"
              description={`Pay the remaining GH₵${money(
                remaining
              )} and complete this booking.`}
              amount={
                remaining
              }
              icon="100%"
              disabled={
                processing ||
                remaining <= 0
              }
              onClick={() =>
                onPay(
                  "full"
                )
              }
            />

            <PaymentOption
              title="Pay 50% deposit"
              description={`Pay GH₵${money(
                depositAmount
              )} now and keep the remaining balance for later.`}
              amount={
                depositAmount
              }
              icon="50%"
              disabled={
                processing ||
                remaining <= 0
              }
              onClick={() =>
                onPay(
                  "deposit"
                )
              }
            />

          </div>

          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

            <p className="text-xs leading-5 text-blue-800">
              <strong>Payment record:</strong>{" "}
              This payment is currently recorded within
              EventFlow. A secure payment gateway can be
              connected when the platform moves to production.
            </p>

          </div>

        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 sm:px-7">

          <button
            onClick={
              onClose
            }
            disabled={
              processing
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {processing
              ? "Processing..."
              : "Cancel"}
          </button>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   PAYMENT OPTION
===================================================== */

function PaymentOption({
  title,
  description,
  amount,
  icon,
  disabled,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      disabled={
        disabled
      }
      className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-purple-300 hover:bg-purple-50/30 disabled:cursor-not-allowed disabled:opacity-50"
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-xs font-extrabold text-purple-700">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p className="font-bold text-gray-950">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>

      </div>

      <div className="shrink-0 text-right">

        <p className="text-sm font-extrabold text-gray-950">
          GH₵
          {money(
            amount
          )}
        </p>

        <p className="mt-1 text-[9px] font-extrabold uppercase tracking-wider text-purple-600">
          Select
        </p>

      </div>

    </button>
  );
}

/* =====================================================
   PAYMENT ACTIVITY
===================================================== */

function PaymentActivityCard({
  booking,
  onPayment,
}) {
  if (
    getBookingStatus(
      booking
    ) !== "accepted"
  ) {
    return null;
  }

  const providerType =
    getProviderType(
      booking
    );

  const providerName =
    getProviderName(
      booking
    );

  const agreedPrice =
    getAgreedPrice(
      booking
    );

  const amountPaid =
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

        <div className="flex items-start gap-4">

          <ProviderIcon
            type={
              providerType
            }
          />

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-2">

              <h3 className="font-bold text-gray-950">
                {providerName}
              </h3>

              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getPaymentStatusClasses(
                  paymentStatus
                )}`}
              >
                {getPaymentStatusText(
                  paymentStatus
                )}
              </span>

            </div>

            <p className="mt-1 text-sm text-gray-500">
              {booking?.eventName ||
                "Event"}{" "}
              ·{" "}
              {booking?.serviceName ||
                booking?.service ||
                "Event service"}
            </p>

            <p className="mt-1 font-mono text-[10px] text-gray-400">
              {itemId(
                booking
              )}
            </p>

          </div>

        </div>

        <div className="grid grid-cols-3 gap-5">

          <PaymentActivityAmount
            label="Agreed"
            value={
              agreedPrice
            }
          />

          <PaymentActivityAmount
            label="Paid"
            value={
              amountPaid
            }
          />

          <PaymentActivityAmount
            label="Remaining"
            value={
              remaining
            }
          />

        </div>

        <div className="shrink-0">

          {paymentStatus !==
            "paid" ? (
            <button
              onClick={
                onPayment
              }
              className="w-full rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-700 lg:w-auto"
            >
              Make payment
            </button>
          ) : (
            <span className="inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700">
              Payment complete
            </span>
          )}

        </div>

      </div>

      {Array.isArray(
        booking?.paymentHistory
      ) &&
        booking.paymentHistory.length >
          0 && (
          <div className="mt-5 border-t border-gray-100 pt-5">

            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
              Recent payment activity
            </p>

            <div className="mt-3 space-y-2">

              {booking.paymentHistory
                .slice()
                .reverse()
                .slice(
                  0,
                  3
                )
                .map(
                  (
                    payment
                  ) => (
                    <div
                      key={
                        payment.id
                      }
                      className="flex flex-col justify-between gap-2 rounded-xl bg-gray-50 px-4 py-3 text-xs sm:flex-row sm:items-center"
                    >

                      <div>

                        <span className="font-bold text-gray-800">
                          {payment.option ===
                          "deposit"
                            ? "50% Deposit"
                            : "Full Payment"}
                        </span>

                        <span className="ml-2 text-gray-400">
                          {payment.createdAt
                            ? new Date(
                                payment.createdAt
                              ).toLocaleString(
                                "en-GH"
                              )
                            : ""}
                        </span>

                      </div>

                      <span className="font-bold text-gray-950">
                        GH₵
                        {money(
                          payment.amount
                        )}
                      </span>

                    </div>
                  )
                )}

            </div>

          </div>
        )}

    </div>
  );
}

/* =====================================================
   SMALL COMPONENTS
===================================================== */

function HeroMetric({
  label,
  value,
}) {
  return (
    <div className="border-gray-100 px-6 py-5 sm:border-l sm:first:border-l-0">

      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950">
        {value}
      </p>

    </div>
  );
}

function QuickAction({
  title,
  description,
  to,
  icon,
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-sm font-extrabold text-purple-700 transition group-hover:bg-purple-600 group-hover:text-white">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="font-bold text-gray-950">
          {title}
        </p>

        <p className="mt-1 truncate text-xs text-gray-500">
          {description}
        </p>

      </div>

    </Link>
  );
}

function FinancialCard({
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-extrabold tracking-tight text-gray-950">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-400">
        {description}
      </p>

    </div>
  );
}

function StatusPill({
  label,
  value,
  tone,
}) {
  const styles = {
    amber:
      "border-amber-100 bg-amber-50 text-amber-700",
    indigo:
      "border-indigo-100 bg-indigo-50 text-indigo-700",
    purple:
      "border-purple-100 bg-purple-50 text-purple-700",
    green:
      "border-emerald-100 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-bold ${styles[tone]}`}
    >
      {value} {label}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

      <div>

        <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-600">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
          {title}
        </h2>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            {description}
          </p>
        )}

      </div>

      {action}

    </div>
  );
}

function Detail({
  label,
  value,
}) {
  return (
    <div className="min-w-0">

      <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-gray-900">
        {value}
      </p>

    </div>
  );
}

function PriceBox({
  label,
  value,
  highlight = false,
  purple = false,
  accepted = false,
}) {
  let classes =
    "border-gray-200 bg-gray-50";

  if (highlight) {
    classes =
      "border-indigo-200 bg-indigo-50";
  }

  if (purple) {
    classes =
      "border-purple-200 bg-purple-50";
  }

  if (accepted) {
    classes =
      "border-emerald-200 bg-emerald-50";
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${classes}`}
    >

      <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-extrabold text-gray-950">
        GH₵
        {money(
          value
        )}
      </p>

    </div>
  );
}

function ProviderIcon({
  type,
}) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${
        type === "venue"
          ? "bg-amber-50 text-amber-700"
          : "bg-purple-50 text-purple-700"
      }`}
    >
      {type === "venue"
        ? "V"
        : "S"}
    </div>
  );
}

function PaymentMiniStat({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white px-4 py-3">

      <p className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-extrabold text-gray-950">
        GH₵
        {money(
          value
        )}
      </p>

    </div>
  );
}

function PaymentActivityAmount({
  label,
  value,
}) {
  return (
    <div>

      <p className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-extrabold text-gray-950">
        GH₵
        {money(
          value
        )}
      </p>

    </div>
  );
}

function PaymentSummary({
  label,
  value,
  emphasis = false,
}) {
  return (
    <div>

      <p className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p
        className={`mt-1 text-lg font-extrabold ${
          emphasis
            ? "text-purple-700"
            : "text-gray-950"
        }`}
      >
        GH₵
        {money(
          value
        )}
      </p>

    </div>
  );
}

/* =====================================================
   EVENT CARDS
===================================================== */

function EventCard({
  event,
  onDelete,
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between gap-4">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-sm font-extrabold text-purple-700">
          {event?.icon ||
            "E"}
        </div>

        <button
          onClick={
            onDelete
          }
          className="text-xs font-bold text-gray-400 transition hover:text-red-600"
        >
          Delete
        </button>

      </div>

      <h3 className="mt-5 truncate text-lg font-bold text-gray-950">
        {event?.name ||
          event?.eventName ||
          "Untitled Event"}
      </h3>

      <p className="mt-1 text-sm font-semibold text-purple-600">
        {event?.eventType ||
          "Event"}
      </p>

      <div className="mt-5 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">

        <Detail
          label="Date"
          value={
            event?.eventDate ||
            "Not set"
          }
        />

        <Detail
          label="Location"
          value={
            event?.location ||
            event?.eventLocation ||
            "Not set"
          }
        />

      </div>

    </article>
  );
}

function UpcomingEvent({
  event,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex items-start gap-4">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-sm font-extrabold text-purple-700">
          {event?.icon ||
            "E"}
        </div>

        <div className="min-w-0">

          <h3 className="truncate font-bold text-gray-950">
            {event?.name ||
              event?.eventName ||
              "Event"}
          </h3>

          <p className="mt-1 text-xs font-semibold text-purple-600">
            {event?.eventType ||
              "Event"}
          </p>

        </div>

      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">

        <Detail
          label="Date"
          value={
            event?.eventDate ||
            "Not set"
          }
        />

        <Detail
          label="Location"
          value={
            event?.location ||
            event?.eventLocation ||
            "Not set"
          }
        />

      </div>

    </div>
  );
}

/* =====================================================
   SAVED ITEMS
===================================================== */

function SavedItemsSection({
  title,
  items,
  emptyMessage,
  type,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gray-400">
            Shortlist
          </p>

          <h3 className="mt-1 text-lg font-bold text-gray-950">
            {title}
          </h3>

        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-extrabold text-gray-600">
          {items.length}
        </span>

      </div>

      {items.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-gray-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-5 space-y-3">

          {items
            .slice(0, 5)
            .map(
              (
                item,
                index
              ) => (
                <div
                  key={
                    item?.id ||
                    item?._id ||
                    index
                  }
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                >

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-purple-700 shadow-sm">
                    {type ===
                    "venue"
                      ? "V"
                      : "S"}
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-bold text-gray-950">
                      {item?.name ||
                        item?.vendorName ||
                        item?.venueName ||
                        "Saved provider"}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {item?.category ||
                        item?.type ||
                        "Event service"}
                    </p>

                  </div>

                </div>
              )
            )}

        </div>
      )}

    </div>
  );
}

/* =====================================================
   EMPTY STATE
===================================================== */

function EmptyState({
  icon,
  title,
  text,
  action,
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-sm font-extrabold text-gray-500">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-bold text-gray-950">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        {text}
      </p>

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}

    </div>
  );
}