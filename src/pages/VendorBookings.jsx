import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const BOOKINGS_KEY = "eventflowBookings";
const QUOTATIONS_KEY = "eventflowQuotations";

const BOOKING_UPDATED_EVENT = "eventflow-booking-updated";
const BOOKINGS_UPDATED_EVENT = "eventflow-bookings-updated";
const QUOTATIONS_UPDATED_EVENT = "eventflow-quotations-updated";
const PAYMENT_UPDATED_EVENT = "eventflow-payment-updated";

function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem("eventflowUser") || "null"
    );
  } catch {
    return null;
  }
}

function getArray(key) {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(key) || "[]"
    );

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  const amount = Number(value || 0);

  return `GH₵${amount.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "Date not provided";

  try {
    return new Date(value).toLocaleDateString("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function formatDateTime(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString("en-GH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function getVendorEmail(user) {
  return String(user?.email || "")
    .trim()
    .toLowerCase();
}

function getVendorId(user) {
  return String(
    user?.id ||
      user?.userId ||
      user?.vendorId ||
      ""
  );
}

function getVendorName(user) {
  if (user?.firstName && user?.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  return (
    user?.businessName ||
    user?.vendorName ||
    user?.name ||
    user?.firstName ||
    "EventFlow Vendor"
  );
}

function getOrganizerName(booking) {
  return (
    booking?.organizerName ||
    booking?.organizer?.name ||
    booking?.organizer?.fullName ||
    "EventFlow Organizer"
  );
}

function getOrganizerEmail(booking) {
  return String(
    booking?.organizerEmail ||
      booking?.organizer?.email ||
      ""
  )
    .trim()
    .toLowerCase();
}

function getEventName(booking) {
  return (
    booking?.eventName ||
    booking?.event ||
    booking?.eventTitle ||
    "Event"
  );
}

function getServiceName(booking) {
  return (
    booking?.serviceName ||
    booking?.service ||
    booking?.selectedServiceName ||
    "Event Service"
  );
}

function getGuests(booking) {
  return (
    booking?.guestCount ??
    booking?.guests ??
    booking?.numberOfGuests ??
    "—"
  );
}

function getEventLocation(booking) {
  return (
    booking?.eventLocation ||
    booking?.location ||
    "Location not provided"
  );
}

function getBasePrice(booking) {
  return Number(
    booking?.price ||
      booking?.startingPrice ||
      booking?.servicePrice ||
      0
  );
}

function getQuotationPrice(booking) {
  return Number(
    booking?.vendorQuotationPrice ||
      booking?.quotationPrice ||
      booking?.quotedPrice ||
      booking?.vendorQuote ||
      booking?.proposedPrice ||
      0
  );
}

function getOrganizerCounterPrice(booking) {
  return Number(
    booking?.organizerCounterPrice ||
      booking?.counterOfferPrice ||
      booking?.organizerCounterOffer ||
      booking?.counterPrice ||
      0
  );
}

function getVendorCounterPrice(booking) {
  return Number(
    booking?.vendorCounterPrice ||
      booking?.providerCounterPrice ||
      booking?.vendorCounterOffer ||
      0
  );
}

function getAgreedPrice(booking) {
  return Number(
    booking?.agreedPrice ||
      booking?.finalPrice ||
      booking?.acceptedPrice ||
      0
  );
}

function getPaymentStatus(booking) {
  return booking?.paymentStatus || "unpaid";
}

function getAmountPaid(booking) {
  return Number(booking?.amountPaid || 0);
}

function getRemainingBalance(booking) {
  if (
    booking?.remainingBalance !== undefined &&
    booking?.remainingBalance !== null
  ) {
    return Math.max(
      0,
      Number(booking.remainingBalance)
    );
  }

  const agreed = getAgreedPrice(booking);
  const paid = getAmountPaid(booking);

  return Math.max(0, agreed - paid);
}

function getStatus(booking) {
  return String(
    booking?.status || "pending"
  ).toLowerCase();
}

function isLocked(booking) {
  return (
    getStatus(booking) === "accepted" &&
    getAgreedPrice(booking) > 0
  );
}

function isWaitingForVendor(booking) {
  const status = getStatus(booking);

  return (
    status === "pending" ||
    status === "requested" ||
    status === "new"
  );
}

function isWaitingForOrganizer(booking) {
  const status = getStatus(booking);

  return (
    status === "quotation_sent" ||
    status === "quoted" ||
    status === "vendor_counter"
  );
}

function isOrganizerCounter(booking) {
  const status = getStatus(booking);

  return (
    status === "organizer_counter" ||
    status === "counter_offer" ||
    status === "countered"
  );
}

function isRejected(booking) {
  const status = getStatus(booking);

  return (
    status === "rejected" ||
    status === "cancelled" ||
    status === "declined" ||
    status === "quotation_rejected"
  );
}

function statusLabel(booking) {
  const status = getStatus(booking);

  if (status === "pending") {
    return "New Request";
  }

  if (
    status === "quotation_sent" ||
    status === "quoted"
  ) {
    return "Quotation Sent";
  }

  if (
    status === "organizer_counter" ||
    status === "counter_offer" ||
    status === "countered"
  ) {
    return "Counter Offer";
  }

  if (status === "vendor_counter") {
    return "Your Counter Offer";
  }

  if (status === "accepted") {
    return "Confirmed";
  }

  if (
    status === "rejected" ||
    status === "declined" ||
    status === "quotation_rejected"
  ) {
    return "Rejected";
  }

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function statusClasses(booking) {
  const status = getStatus(booking);

  if (status === "accepted") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (
    status === "rejected" ||
    status === "declined" ||
    status === "cancelled" ||
    status === "quotation_rejected"
  ) {
    return "bg-rose/10 text-rose border-rose/20";
  }

  if (
    status === "organizer_counter" ||
    status === "counter_offer" ||
    status === "countered"
  ) {
    return "bg-amber/10 text-amber border-amber/20";
  }

  if (status === "vendor_counter") {
    return "bg-violet-50 text-violet-700 border-violet-200";
  }

  return "bg-gold/10 text-gold border-gold/30";
}

function paymentLabel(booking) {
  const status = getPaymentStatus(booking);

  if (status === "paid") {
    return "Paid in full";
  }

  if (status === "deposit_paid") {
    return "50% deposit received";
  }

  return "Payment pending";
}

function paymentClasses(booking) {
  const status = getPaymentStatus(booking);

  if (status === "paid") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "deposit_paid") {
    return "bg-gold/10 text-gold border-blue-200";
  }

  return "bg-surface text-mist border-line";
}

function getBookingVendorEmail(booking) {
  return String(
    booking?.vendorEmail ||
      booking?.providerEmail ||
      booking?.vendor?.email ||
      ""
  )
    .trim()
    .toLowerCase();
}

function getBookingVendorId(booking) {
  return String(
    booking?.vendorId ||
      booking?.providerId ||
      booking?.vendor?.id ||
      ""
  );
}

function bookingBelongsToVendor(booking, user) {
  const vendorEmail = getVendorEmail(user);
  const vendorId = getVendorId(user);

  const vendorName = getVendorName(user)
    .trim()
    .toLowerCase();

  const bookingEmail =
    getBookingVendorEmail(booking);

  const bookingId =
    getBookingVendorId(booking);

  const bookingName = String(
    booking?.vendorName ||
      booking?.providerName ||
      booking?.vendor?.name ||
      ""
  )
    .trim()
    .toLowerCase();

  if (vendorEmail && bookingEmail) {
    return vendorEmail === bookingEmail;
  }

  if (vendorId && bookingId) {
    return vendorId === bookingId;
  }

  if (
    !bookingEmail &&
    !bookingId &&
    vendorName &&
    bookingName
  ) {
    return vendorName === bookingName;
  }

  return false;
}

function getVendorBookingStorageKey(user) {
  const email = getVendorEmail(user);

  return email
    ? `eventflowVendorBookings_${email}`
    : "";
}

function getVendorNotificationsKey(user) {
  const email = getVendorEmail(user);

  return email
    ? `eventflowVendorNotifications_${email}`
    : "";
}

function notifyOrganizer(booking, notification) {
  const email = getOrganizerEmail(booking);

  if (!email) return;

  const key =
    `eventflowOrganizerNotifications_${email}`;

  const existing = getArray(key);

  const item = {
    id: `notification-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`,

    bookingId: booking.id,

    read: false,

    createdAt:
      new Date().toISOString(),

    ...notification,
  };

  saveArray(key, [
    item,
    ...existing,
  ]);

  window.dispatchEvent(
    new CustomEvent(
      "eventflow-organizer-notifications-updated",
      {
        detail: item,
      }
    )
  );
}

function saveBookingEverywhere(updatedBooking) {
  const bookings =
    getArray(BOOKINGS_KEY);

  const updatedBookings =
    bookings.map((booking) =>
      String(booking.id) ===
      String(updatedBooking.id)
        ? updatedBooking
        : booking
    );

  saveArray(
    BOOKINGS_KEY,
    updatedBookings
  );

  const vendorEmail =
    getBookingVendorEmail(
      updatedBooking
    );

  if (vendorEmail) {
    const vendorKey =
      `eventflowVendorBookings_${vendorEmail}`;

    const vendorBookings =
      getArray(vendorKey);

    const exists =
      vendorBookings.some(
        (booking) =>
          String(booking.id) ===
          String(updatedBooking.id)
      );

    const nextVendorBookings =
      exists
        ? vendorBookings.map(
            (booking) =>
              String(booking.id) ===
              String(updatedBooking.id)
                ? updatedBooking
                : booking
          )
        : [
            updatedBooking,
            ...vendorBookings,
          ];

    saveArray(
      vendorKey,
      nextVendorBookings
    );
  }

  const organizerBookings =
    getArray(
      "eventflowOrganizerBookings"
    );

  const organizerExists =
    organizerBookings.some(
      (booking) =>
        String(booking.id) ===
        String(updatedBooking.id)
    );

  const nextOrganizerBookings =
    organizerExists
      ? organizerBookings.map(
          (booking) =>
            String(booking.id) ===
            String(updatedBooking.id)
              ? updatedBooking
              : booking
        )
      : [
          updatedBooking,
          ...organizerBookings,
        ];

  saveArray(
    "eventflowOrganizerBookings",
    nextOrganizerBookings
  );

  const organizerEmail =
    getOrganizerEmail(
      updatedBooking
    );

  if (organizerEmail) {
    const organizerKey =
      `eventflowOrganizerBookings_${organizerEmail}`;

    const organizerSpecific =
      getArray(organizerKey);

    const exists =
      organizerSpecific.some(
        (booking) =>
          String(booking.id) ===
          String(updatedBooking.id)
      );

    saveArray(
      organizerKey,
      exists
        ? organizerSpecific.map(
            (booking) =>
              String(booking.id) ===
              String(updatedBooking.id)
                ? updatedBooking
                : booking
          )
        : [
            updatedBooking,
            ...organizerSpecific,
          ]
    );
  }

  const quotations =
    getArray(QUOTATIONS_KEY);

  const quotationExists =
    quotations.some(
      (quotation) =>
        String(
          quotation.bookingId ||
            quotation.id
        ) ===
        String(updatedBooking.id)
    );

  const quotationRecord = {
    id:
      updatedBooking.quotationId ||
      `quotation-${updatedBooking.id}`,

    bookingId:
      updatedBooking.id,

    vendorId:
      updatedBooking.vendorId,

    vendorName:
      updatedBooking.vendorName,

    vendorEmail:
      updatedBooking.vendorEmail,

    organizerName:
      updatedBooking.organizerName,

    organizerEmail:
      updatedBooking.organizerEmail,

    price:
      getQuotationPrice(
        updatedBooking
      ),

    vendorQuotationPrice:
      updatedBooking.vendorQuotationPrice,

    organizerCounterPrice:
      updatedBooking.organizerCounterPrice,

    vendorCounterPrice:
      updatedBooking.vendorCounterPrice,

    agreedPrice:
      updatedBooking.agreedPrice,

    status:
      updatedBooking.status,

    updatedAt:
      updatedBooking.updatedAt,
  };

  saveArray(
    QUOTATIONS_KEY,
    quotationExists
      ? quotations.map(
          (quotation) =>
            String(
              quotation.bookingId ||
                quotation.id
            ) ===
            String(updatedBooking.id)
              ? {
                  ...quotation,
                  ...quotationRecord,
                }
              : quotation
        )
      : [
          quotationRecord,
          ...quotations,
        ]
  );

  window.dispatchEvent(
    new CustomEvent(
      BOOKINGS_UPDATED_EVENT,
      {
        detail: updatedBooking,
      }
    )
  );

  window.dispatchEvent(
    new CustomEvent(
      BOOKING_UPDATED_EVENT,
      {
        detail: updatedBooking,
      }
    )
  );

  window.dispatchEvent(
    new CustomEvent(
      QUOTATIONS_UPDATED_EVENT,
      {
        detail: updatedBooking,
      }
    )
  );

  return updatedBooking;
}

function readBookingsForVendor(user) {
  const canonical =
    getArray(BOOKINGS_KEY);

  const vendorKey =
    getVendorBookingStorageKey(user);

  const vendorCopy = vendorKey
    ? getArray(vendorKey)
    : [];

  const merged = new Map();

  [
    ...vendorCopy,
    ...canonical,
  ].forEach((booking) => {
    if (!booking?.id) return;

    if (
      bookingBelongsToVendor(
        booking,
        user
      )
    ) {
      merged.set(
        String(booking.id),
        booking
      );
    }
  });

  return Array.from(
    merged.values()
  ).sort(
    (a, b) =>
      new Date(
        b.updatedAt ||
          b.createdAt ||
          0
      ) -
      new Date(
        a.updatedAt ||
          a.createdAt ||
          0
      )
  );
}

function addVendorNotification(
  user,
  notification
) {
  const key =
    getVendorNotificationsKey(user);

  if (!key) return;

  const existing =
    getArray(key);

  const item = {
    id: `vendor-notification-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`,

    read: false,

    createdAt:
      new Date().toISOString(),

    ...notification,
  };

  saveArray(key, [
    item,
    ...existing,
  ]);

  window.dispatchEvent(
    new CustomEvent(
      "eventflow-vendor-notifications-updated",
      {
        detail: item,
      }
    )
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
  accent = "indigo",
}) {
  const accentClasses = {
    indigo:
      "bg-gold/10 text-gold",
    emerald:
      "bg-emerald-50 text-emerald-600",
    amber:
      "bg-amber/10 text-amber",
    violet:
      "bg-violet-50 text-violet-600",
  };

  return (
    <div className="group rounded-2xl border border-line bg-raised p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-line-bright hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-fog">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-cream">
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-fog">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
            accentClasses[accent]
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-line bg-surface/70 p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-fog">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold text-cream">
        {value || "—"}
      </p>
    </div>
  );
}

export default function VendorBookings() {
  const navigate = useNavigate();

  const [user, setUser] =
    useState(getCurrentUser);

  const [bookings, setBookings] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  const [selectedBookingId, setSelectedBookingId] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("all");

  const [search, setSearch] =
    useState("");

  const [quoteModal, setQuoteModal] =
    useState(null);

  const [quoteAmount, setQuoteAmount] =
    useState("");

  const [counterModal, setCounterModal] =
    useState(null);

  const [counterAmount, setCounterAmount] =
    useState("");

  const [processingId, setProcessingId] =
    useState("");

  const loadEverything = () => {
    const currentUser =
      getCurrentUser();

    setUser(currentUser);

    if (!currentUser) {
      setBookings([]);
      setNotifications([]);
      return;
    }

    setBookings(
      readBookingsForVendor(
        currentUser
      )
    );

    const notificationKey =
      getVendorNotificationsKey(
        currentUser
      );

    setNotifications(
      notificationKey
        ? getArray(notificationKey)
        : []
    );
  };

  useEffect(() => {
    loadEverything();

    const events = [
      BOOKINGS_UPDATED_EVENT,
      BOOKING_UPDATED_EVENT,
      QUOTATIONS_UPDATED_EVENT,
      PAYMENT_UPDATED_EVENT,
      "eventflow-vendor-notifications-updated",
      "eventflow-auth-changed",
    ];

    events.forEach((eventName) => {
      window.addEventListener(
        eventName,
        loadEverything
      );
    });

    const handleStorage = () => {
      loadEverything();
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          loadEverything
        );
      });

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const role =
      user.accountType ||
      user.role;

    if (role !== "vendor") {
      navigate("/discover", {
        replace: true,
      });
    }
  }, [user, navigate]);

  const filteredBookings =
    useMemo(() => {
      let result = [
        ...bookings,
      ];

      if (activeTab === "requests") {
        result = result.filter(
          (booking) =>
            isWaitingForVendor(
              booking
            ) ||
            isOrganizerCounter(
              booking
            )
        );
      }

      if (activeTab === "negotiation") {
        result = result.filter(
          (booking) =>
            isWaitingForOrganizer(
              booking
            ) ||
            isOrganizerCounter(
              booking
            )
        );
      }

      if (activeTab === "confirmed") {
        result = result.filter(
          (booking) =>
            getStatus(booking) ===
            "accepted"
        );
      }

      if (activeTab === "payments") {
        result = result.filter(
          (booking) =>
            getStatus(booking) ===
              "accepted" ||
            getAmountPaid(
              booking
            ) > 0
        );
      }

      if (activeTab === "rejected") {
        result = result.filter(
          (booking) =>
            isRejected(booking)
        );
      }

      const query =
        search.trim().toLowerCase();

      if (query) {
        result = result.filter(
          (booking) => {
            const text = [
              getEventName(
                booking
              ),
              getServiceName(
                booking
              ),
              getOrganizerName(
                booking
              ),
              booking.eventType,
              getEventLocation(
                booking
              ),
              booking.id,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return text.includes(
              query
            );
          }
        );
      }

      return result;
    }, [
      bookings,
      activeTab,
      search,
    ]);

  const selectedBooking =
    bookings.find(
      (booking) =>
        String(booking.id) ===
        String(selectedBookingId)
    ) || null;

  const stats =
    useMemo(() => {
      const pending =
        bookings.filter(
          (booking) =>
            isWaitingForVendor(
              booking
            )
        ).length;

      const counters =
        bookings.filter(
          (booking) =>
            isOrganizerCounter(
              booking
            )
        ).length;

      const confirmed =
        bookings.filter(
          (booking) =>
            getStatus(booking) ===
            "accepted"
        ).length;

      const paid =
        bookings.filter(
          (booking) =>
            getPaymentStatus(
              booking
            ) === "paid"
        ).length;

      const received =
        bookings.reduce(
          (total, booking) =>
            total +
            getAmountPaid(
              booking
            ),
          0
        );

      const outstanding =
        bookings.reduce(
          (total, booking) =>
            total +
            getRemainingBalance(
              booking
            ),
          0
        );

      return {
        pending,
        counters,
        confirmed,
        paid,
        received,
        outstanding,
      };
    }, [bookings]);

  const unreadNotifications =
    notifications.filter(
      (item) => !item.read
    ).length;

  function updateBooking(
    booking,
    changes
  ) {
    return saveBookingEverywhere({
      ...booking,
      ...changes,
      updatedAt:
        new Date().toISOString(),
    });
  }

  function sendQuotation(booking) {
    const amount =
      Number(quoteAmount);

    if (!amount || amount <= 0) {
      alert(
        "Please enter a valid quotation amount."
      );
      return;
    }

    setProcessingId(
      String(booking.id)
    );

    try {
      const now =
        new Date().toISOString();

      const updatedBooking =
        updateBooking(
          booking,
          {
            status:
              "quotation_sent",

            vendorQuotationPrice:
              amount,

            quotationPrice:
              amount,

            quotedPrice:
              amount,

            proposedPrice:
              amount,

            vendorQuote:
              amount,

            quotationSentAt:
              now,

            quotationRejectedAt:
              null,

            vendorCounterPrice:
              null,

            providerCounterPrice:
              null,
          }
        );

      notifyOrganizer(
        updatedBooking,
        {
          type:
            "quotation-received",

          title:
            "Quotation received",

          message:
            `${getVendorName(
              user
            )} sent a quotation of ${money(
              amount
            )} for ${getEventName(
              updatedBooking
            )}.`,

          amount,
        }
      );

      addVendorNotification(
        user,
        {
          type:
            "quotation-sent",

          bookingId:
            booking.id,

          title:
            "Quotation sent",

          message:
            `Your quotation of ${money(
              amount
            )} was sent to ${getOrganizerName(
              booking
            )}.`,
        }
      );

      setQuoteModal(null);
      setQuoteAmount("");

      loadEverything();
    } finally {
      setProcessingId("");
    }
  }

  function rejectBooking(booking) {
    const confirmed =
      window.confirm(
        "Reject this booking request? The organizer will be notified."
      );

    if (!confirmed) return;

    setProcessingId(
      String(booking.id)
    );

    try {
      const updatedBooking =
        updateBooking(
          booking,
          {
            status:
              "rejected",

            vendorResponse:
              "rejected",

            vendorResponseMessage:
              "The vendor is unable to accept this booking request.",

            rejectedBy:
              "vendor",

            rejectedAt:
              new Date().toISOString(),
          }
        );

      notifyOrganizer(
        updatedBooking,
        {
          type:
            "booking-rejected",

          title:
            "Booking request declined",

          message:
            `${getVendorName(
              user
            )} declined your booking request for ${getEventName(
              updatedBooking
            )}.`,
        }
      );

      loadEverything();
    } finally {
      setProcessingId("");
    }
  }

  function acceptOrganizerCounter(
    booking
  ) {
    const counter =
      getOrganizerCounterPrice(
        booking
      );

    if (!counter || counter <= 0) {
      alert(
        "No valid organizer counter-offer was found."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Accept the organizer's counter-offer of ${money(
          counter
        )}? This will lock the agreed price.`
      );

    if (!confirmed) return;

    setProcessingId(
      String(booking.id)
    );

    try {
      const now =
        new Date().toISOString();

      const updatedBooking =
        updateBooking(
          booking,
          {
            status:
              "accepted",

            agreedPrice:
              counter,

            finalPrice:
              counter,

            acceptedPrice:
              counter,

            agreedAt:
              now,

            paymentStatus:
              "unpaid",

            paymentOption:
              null,

            amountPaid:
              0,

            remainingBalance:
              counter,

            agreementLocked:
              true,

            locked:
              true,

            organizerCounterAcceptedAt:
              now,
          }
        );

      notifyOrganizer(
        updatedBooking,
        {
          type:
            "counter-accepted",

          title:
            "Counter-offer accepted",

          message:
            `${getVendorName(
              user
            )} accepted your counter-offer of ${money(
              counter
            )} for ${getEventName(
              updatedBooking
            )}. The agreed price is now locked.`,

          amount:
            counter,
        }
      );

      addVendorNotification(
        user,
        {
          type:
            "agreement-confirmed",

          bookingId:
            booking.id,

          title:
            "Booking confirmed",

          message:
            `You accepted ${getOrganizerName(
              booking
            )}'s counter-offer. Agreed price: ${money(
              counter
            )}.`,
        }
      );

      loadEverything();
    } finally {
      setProcessingId("");
    }
  }

  function rejectOrganizerCounter(
    booking
  ) {
    const confirmed =
      window.confirm(
        "Reject this counter-offer? The organizer will be notified."
      );

    if (!confirmed) return;

    setProcessingId(
      String(booking.id)
    );

    try {
      const updatedBooking =
        updateBooking(
          booking,
          {
            status:
              "quotation_rejected",

            quotationRejectedAt:
              new Date().toISOString(),

            counterRejectedBy:
              "vendor",

            vendorResponse:
              "counter_rejected",
          }
        );

      notifyOrganizer(
        updatedBooking,
        {
          type:
            "counter-rejected",

          title:
            "Counter-offer declined",

          message:
            `${getVendorName(
              user
            )} declined your counter-offer for ${getEventName(
              updatedBooking
            )}.`,
        }
      );

      loadEverything();
    } finally {
      setProcessingId("");
    }
  }

  function sendVendorCounter(
    booking
  ) {
    const amount =
      Number(counterAmount);

    if (!amount || amount <= 0) {
      alert(
        "Please enter a valid counter-offer."
      );
      return;
    }

    setProcessingId(
      String(booking.id)
    );

    try {
      const now =
        new Date().toISOString();

      const updatedBooking =
        updateBooking(
          booking,
          {
            status:
              "vendor_counter",

            vendorCounterPrice:
              amount,

            providerCounterPrice:
              amount,

            vendorCounterOffer:
              amount,

            proposedPrice:
              amount,

            counterOfferPrice:
              amount,

            vendorCounterSentAt:
              now,
          }
        );

      notifyOrganizer(
        updatedBooking,
        {
          type:
            "vendor-counter",

          title:
            "New counter-offer",

          message:
            `${getVendorName(
              user
            )} sent a counter-offer of ${money(
              amount
            )} for ${getEventName(
              updatedBooking
            )}.`,

          amount,
        }
      );

      setCounterModal(null);
      setCounterAmount("");

      loadEverything();
    } finally {
      setProcessingId("");
    }
  }

  function markNotificationRead(
    notificationId
  ) {
    const key =
      getVendorNotificationsKey(
        user
      );

    if (!key) return;

    const updated =
      getArray(key).map(
        (notification) =>
          String(notification.id) ===
          String(notificationId)
            ? {
                ...notification,
                read: true,
              }
            : notification
      );

    saveArray(key, updated);
    setNotifications(updated);
  }

  function markAllNotificationsRead() {
    const key =
      getVendorNotificationsKey(
        user
      );

    if (!key) return;

    const updated =
      getArray(key).map(
        (notification) => ({
          ...notification,
          read: true,
        })
      );

    saveArray(key, updated);
    setNotifications(updated);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-ink">
        <Navbar />

        <main className="mx-auto max-w-3xl px-5 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-2xl">
            🔐
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-cream">
            Vendor account required
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-mist">
            Please sign in to access your
            booking workspace.
          </p>

          <Link
            to="/login"
            className="mt-7 inline-flex rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-gold-dim"
          >
            Sign in
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-cream">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* PAGE HEADER */}

        <section className="relative overflow-hidden rounded-3xl bg-ink px-5 py-7 text-cream shadow-sm sm:px-7 sm:py-8">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />

          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-line bg-raised/10 px-3 py-1 text-xs font-semibold text-mist">
                  Vendor workspace
                </span>

                {unreadNotifications > 0 && (
                  <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-cream">
                    {unreadNotifications} new
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Booking management
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-mist sm:text-base">
                Manage organizer requests, quotations,
                negotiations, confirmed bookings and
                payment activity from one professional
                workspace.
              </p>
            </div>

            <Link
              to="/dashboard/vendor"
              className="inline-flex w-fit items-center rounded-xl border border-white/15 bg-raised/10 px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-raised/15"
            >
              ← Dashboard
            </Link>
          </div>
        </section>

        {/* STATS */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="New requests"
            value={stats.pending}
            description="Awaiting your response"
            icon="📥"
            accent="indigo"
          />

          <StatCard
            label="Negotiations"
            value={stats.counters}
            description="Organizer counter-offers"
            icon="↔"
            accent="amber"
          />

          <StatCard
            label="Confirmed"
            value={stats.confirmed}
            description="Agreed bookings"
            icon="✓"
            accent="emerald"
          />

          <StatCard
            label="Received"
            value={money(stats.received)}
            description="Recorded payments"
            icon="₵"
            accent="violet"
          />
        </section>

        {/* SEARCH / FILTER */}

        <section className="mt-6 rounded-2xl border border-line bg-raised p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-cream">
                  Your bookings
                </h2>

                <p className="mt-1 text-xs text-fog">
                  {filteredBookings.length}{" "}
                  {filteredBookings.length === 1
                    ? "booking"
                    : "bookings"}{" "}
                  shown
                </p>
              </div>

              <div className="relative w-full sm:max-w-sm">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fog">
                  ⌕
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search bookings..."
                  className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-gold/50 focus:bg-raised focus:ring-4 focus:ring-gold/20"
                />
              </div>
            </div>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {[
                ["all", "All", bookings.length],
                [
                  "requests",
                  "Requests",
                  stats.pending,
                ],
                [
                  "negotiation",
                  "Negotiation",
                  bookings.filter(
                    (booking) =>
                      isWaitingForOrganizer(
                        booking
                      ) ||
                      isOrganizerCounter(
                        booking
                      )
                  ).length,
                ],
                [
                  "confirmed",
                  "Confirmed",
                  stats.confirmed,
                ],
                [
                  "payments",
                  "Payments",
                  bookings.filter(
                    (booking) =>
                      getStatus(
                        booking
                      ) === "accepted" ||
                      getAmountPaid(
                        booking
                      ) > 0
                  ).length,
                ],
                [
                  "rejected",
                  "Rejected",
                  bookings.filter(
                    (booking) =>
                      isRejected(
                        booking
                      )
                  ).length,
                ],
              ].map(
                ([value, label, count]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        value
                      )
                    }
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                      activeTab === value
                        ? "bg-ink text-cream shadow-sm"
                        : "bg-surface text-mist hover:bg-elevated"
                    }`}
                  >
                    {label}

                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        activeTab === value
                          ? "bg-raised/15 text-cream"
                          : "bg-raised text-mist"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* CONTENT */}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

          {/* BOOKINGS */}

          <section className="min-w-0 space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line-bright bg-raised px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-2xl">
                  📋
                </div>

                <h2 className="mt-5 text-lg font-bold text-cream">
                  No bookings found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-mist">
                  {search
                    ? "Try a different search term or clear the current search."
                    : "Booking requests from organizers will appear here when they select one of your services."}
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch("")
                    }
                    className="mt-5 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-cream hover:bg-gold-dim"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredBookings.map(
                (booking) => {
                  const locked =
                    isLocked(
                      booking
                    );

                  const organizerCounter =
                    getOrganizerCounterPrice(
                      booking
                    );

                  const vendorQuote =
                    getQuotationPrice(
                      booking
                    );

                  const vendorCounter =
                    getVendorCounterPrice(
                      booking
                    );

                  const agreed =
                    getAgreedPrice(
                      booking
                    );

                  const paid =
                    getAmountPaid(
                      booking
                    );

                  const balance =
                    getRemainingBalance(
                      booking
                    );

                  const expanded =
                    String(
                      selectedBookingId
                    ) ===
                    String(
                      booking.id
                    );

                  const waitingForVendor =
                    isWaitingForVendor(
                      booking
                    );

                  const waitingForOrganizer =
                    isWaitingForOrganizer(
                      booking
                    );

                  const waitingOnCounter =
                    isOrganizerCounter(
                      booking
                    );

                  return (
                    <article
                      key={
                        booking.id
                      }
                      className={`overflow-hidden rounded-2xl border bg-raised shadow-sm transition ${
                        waitingOnCounter
                          ? "border-amber/20"
                          : locked
                          ? "border-emerald-200"
                          : "border-line"
                      }`}
                    >
                      {/* CARD TOP */}

                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClasses(
                                  booking
                                )}`}
                              >
                                {statusLabel(
                                  booking
                                )}
                              </span>

                              {locked && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                  ✓ Price locked
                                </span>
                              )}
                            </div>

                            <h2 className="mt-3 truncate text-xl font-bold tracking-tight text-cream sm:text-2xl">
                              {getEventName(
                                booking
                              )}
                            </h2>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-mist">
                              <span>
                                {getServiceName(
                                  booking
                                )}
                              </span>

                              <span className="text-mist">
                                •
                              </span>

                              <span>
                                {getOrganizerName(
                                  booking
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 sm:text-right">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-fog">
                              Booking reference
                            </p>

                            <p className="mt-1 font-mono text-xs font-semibold text-mist">
                              {booking.id}
                            </p>

                            <p className="mt-1 text-[11px] text-fog">
                              {formatDate(
                                booking.createdAt
                              )}
                            </p>
                          </div>
                        </div>

                        {/* EVENT SUMMARY */}

                        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          <DetailItem
                            label="Event date"
                            value={formatDate(
                              booking.eventDate
                            )}
                          />

                          <DetailItem
                            label="Guests"
                            value={getGuests(
                              booking
                            )}
                          />

                          <DetailItem
                            label="Location"
                            value={getEventLocation(
                              booking
                            )}
                          />

                          <DetailItem
                            label="Event type"
                            value={
                              booking.eventType ||
                              "Event"
                            }
                          />
                        </div>

                        {/* FINANCIAL SUMMARY */}

                        <div className="mt-5 overflow-hidden rounded-2xl border border-line">
                          <div className="grid divide-y divide-gray-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                            <div className="p-4">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-fog">
                                Starting price
                              </p>

                              <p className="mt-1.5 text-lg font-bold text-cream">
                                {money(
                                  getBasePrice(
                                    booking
                                  )
                                )}
                              </p>

                              <p className="mt-1 text-xs text-fog">
                                Starting from
                              </p>
                            </div>

                            <div className="p-4">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-fog">
                                Current offer
                              </p>

                              <p className="mt-1.5 text-lg font-bold text-gold">
                                {locked
                                  ? money(
                                      agreed
                                    )
                                  : organizerCounter
                                  ? money(
                                      organizerCounter
                                    )
                                  : vendorCounter
                                  ? money(
                                      vendorCounter
                                    )
                                  : vendorQuote
                                  ? money(
                                      vendorQuote
                                    )
                                  : "Not quoted"}
                              </p>

                              <p className="mt-1 text-xs text-fog">
                                {locked
                                  ? "Agreed amount"
                                  : "Current negotiation"}
                              </p>
                            </div>

                            <div className="p-4">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-fog">
                                Payment
                              </p>

                              <span
                                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${paymentClasses(
                                  booking
                                )}`}
                              >
                                {paymentLabel(
                                  booking
                                )}
                              </span>

                              {locked && (
                                <p className="mt-1 text-xs text-fog">
                                  Balance:{" "}
                                  {money(
                                    balance
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ORGANIZER COUNTER */}

                        {waitingOnCounter && (
                          <div className="mt-5 overflow-hidden rounded-2xl border border-amber/20 bg-amber/10">
                            <div className="border-b border-amber/20 px-4 py-3">
                              <p className="text-xs font-bold uppercase tracking-[0.1em] text-amber">
                                Action required
                              </p>
                            </div>

                            <div className="p-4">
                              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-mist">
                                    Organizer's counter-offer
                                  </p>

                                  <p className="mt-1 text-2xl font-bold tracking-tight text-cream">
                                    {money(
                                      organizerCounter
                                    )}
                                  </p>

                                  <p className="mt-1 max-w-lg text-sm leading-5 text-mist">
                                    {getOrganizerName(
                                      booking
                                    )}{" "}
                                    has proposed this
                                    amount. Accept it,
                                    make another offer,
                                    or decline.
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={
                                      processingId ===
                                      String(
                                        booking.id
                                      )
                                    }
                                    onClick={() =>
                                      acceptOrganizerCounter(
                                        booking
                                      )
                                    }
                                    className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-raised disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Accept
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      processingId ===
                                      String(
                                        booking.id
                                      )
                                    }
                                    onClick={() => {
                                      setCounterModal(
                                        booking
                                      );
                                      setCounterAmount(
                                        ""
                                      );
                                    }}
                                    className="rounded-xl border border-line-bright bg-raised px-4 py-2.5 text-sm font-semibold text-mist transition hover:border-gold/40 hover:text-gold disabled:opacity-50"
                                  >
                                    Counter
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      processingId ===
                                      String(
                                        booking.id
                                      )
                                    }
                                    onClick={() =>
                                      rejectOrganizerCounter(
                                        booking
                                      )
                                    }
                                    className="rounded-xl border border-rose/20 bg-raised px-4 py-2.5 text-sm font-semibold text-rose transition hover:bg-rose/10 disabled:opacity-50"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CONFIRMED PAYMENT PANEL */}

                        {locked && (
                          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-700">
                                    ✓
                                  </span>

                                  <p className="text-sm font-bold text-emerald-900">
                                    Booking confirmed
                                  </p>
                                </div>

                                <p className="mt-2 text-2xl font-bold tracking-tight text-cream">
                                  {money(
                                    agreed
                                  )}
                                </p>

                                <p className="mt-1 text-sm leading-5 text-mist">
                                  The agreed price is
                                  locked. Payment
                                  activity is shown
                                  below.
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-3 lg:min-w-[280px]">
                                <div className="rounded-xl border border-emerald-100 bg-raised p-3.5">
                                  <p className="text-xs text-fog">
                                    Received
                                  </p>

                                  <p className="mt-1 font-bold text-emerald-700">
                                    {money(
                                      paid
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-emerald-100 bg-raised p-3.5">
                                  <p className="text-xs text-fog">
                                    Balance
                                  </p>

                                  <p className="mt-1 font-bold text-cream">
                                    {money(
                                      balance
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ACTIONS */}

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          {waitingForVendor && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuoteModal(
                                    booking
                                  );
                                  setQuoteAmount(
                                    ""
                                  );
                                }}
                                className="inline-flex items-center rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-cream shadow-sm transition hover:bg-gold-dim"
                              >
                                Send quotation
                                <span className="ml-2">
                                  →
                                </span>
                              </button>

                              <button
                                type="button"
                                disabled={
                                  processingId ===
                                  String(
                                    booking.id
                                  )
                                }
                                onClick={() =>
                                  rejectBooking(
                                    booking
                                  )
                                }
                                className="rounded-xl border border-rose/20 bg-raised px-4 py-2.5 text-sm font-semibold text-rose transition hover:bg-rose/10 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {waitingForOrganizer && (
                            <button
                              type="button"
                              onClick={() => {
                                setCounterModal(
                                  booking
                                );

                                setCounterAmount(
                                  ""
                                );
                              }}
                              className="rounded-xl border border-line-bright bg-raised px-4 py-2.5 text-sm font-semibold text-mist transition hover:border-gold/40 hover:text-gold"
                            >
                              Adjust quotation
                            </button>
                          )}

                          {locked && (
                            <span className="inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-sm font-semibold text-mist">
                              <span>🔒</span>
                              Agreement locked
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedBookingId(
                                expanded
                                  ? null
                                  : booking.id
                              )
                            }
                            className="rounded-xl border border-line bg-raised px-4 py-2.5 text-sm font-semibold text-mist transition hover:border-line-bright hover:text-cream"
                          >
                            {expanded
                              ? "Hide details"
                              : "View details"}
                          </button>
                        </div>

                        {/* EXPANDED DETAILS */}

                        {expanded && (
                          <div className="mt-6 border-t border-line pt-6">
                            <div className="grid gap-6 lg:grid-cols-2">

                              {/* EVENT INFORMATION */}

                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-sm text-gold">
                                    📅
                                  </div>

                                  <h3 className="text-sm font-bold text-cream">
                                    Event information
                                  </h3>
                                </div>

                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                  <DetailItem
                                    label="Event"
                                    value={getEventName(
                                      booking
                                    )}
                                  />

                                  <DetailItem
                                    label="Type"
                                    value={
                                      booking.eventType ||
                                      "—"
                                    }
                                  />

                                  <DetailItem
                                    label="Date"
                                    value={formatDate(
                                      booking.eventDate
                                    )}
                                  />

                                  <DetailItem
                                    label="Time"
                                    value={
                                      booking.eventTime ||
                                      "—"
                                    }
                                  />

                                  <DetailItem
                                    label="Guests"
                                    value={getGuests(
                                      booking
                                    )}
                                  />

                                  <DetailItem
                                    label="Location"
                                    value={getEventLocation(
                                      booking
                                    )}
                                  />
                                </div>
                              </div>

                              {/* ORGANIZER */}

                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-sm text-violet-600">
                                    👤
                                  </div>

                                  <h3 className="text-sm font-bold text-cream">
                                    Organizer
                                  </h3>
                                </div>

                                <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
                                  <p className="font-semibold text-cream">
                                    {getOrganizerName(
                                      booking
                                    )}
                                  </p>

                                  {getOrganizerEmail(
                                    booking
                                  ) && (
                                    <p className="mt-1 break-all text-sm text-mist">
                                      {getOrganizerEmail(
                                        booking
                                      )}
                                    </p>
                                  )}

                                  {booking.organizerPhone && (
                                    <p className="mt-1 text-sm text-mist">
                                      {booking.organizerPhone}
                                    </p>
                                  )}
                                </div>

                                {booking.message && (
                                  <div className="mt-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-fog">
                                      Organizer message
                                    </p>

                                    <p className="mt-2 rounded-2xl border border-line bg-raised p-4 text-sm leading-6 text-mist">
                                      {booking.message}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* NEGOTIATION HISTORY */}

                            <div className="mt-7">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-sm text-mist">
                                  ₵
                                </div>

                                <div>
                                  <h3 className="text-sm font-bold text-cream">
                                    Negotiation history
                                  </h3>

                                  <p className="text-xs text-fog">
                                    Price discussion for
                                    this booking
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-line bg-raised p-4">
                                  <div className="flex items-center justify-between gap-4">
                                    <div>
                                      <p className="text-sm font-semibold text-cream">
                                        Starting price
                                      </p>

                                      <p className="mt-1 text-xs text-fog">
                                        Original service
                                        listing price
                                      </p>
                                    </div>

                                    <p className="font-bold text-cream">
                                      {money(
                                        getBasePrice(
                                          booking
                                        )
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {vendorQuote > 0 && (
                                  <div className="rounded-2xl border border-gold/20 bg-gold/10/50 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                      <div>
                                        <p className="text-sm font-semibold text-charcoal">
                                          Your quotation
                                        </p>

                                        <p className="mt-1 text-xs text-gold">
                                          Sent to organizer
                                        </p>
                                      </div>

                                      <p className="font-bold text-gold">
                                        {money(
                                          vendorQuote
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {organizerCounter > 0 && (
                                  <div className="rounded-2xl border border-amber/20 bg-amber/10/60 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                      <div>
                                        <p className="text-sm font-semibold text-amber-900">
                                          Organizer counter
                                        </p>

                                        <p className="mt-1 text-xs text-amber">
                                          Organizer's proposed
                                          amount
                                        </p>
                                      </div>

                                      <p className="font-bold text-amber">
                                        {money(
                                          organizerCounter
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {vendorCounter > 0 && (
                                  <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                      <div>
                                        <p className="text-sm font-semibold text-violet-900">
                                          Your counter-offer
                                        </p>

                                        <p className="mt-1 text-xs text-violet-600">
                                          Sent to organizer
                                        </p>
                                      </div>

                                      <p className="font-bold text-violet-700">
                                        {money(
                                          vendorCounter
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {agreed > 0 && (
                                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 md:col-span-2">
                                    <div className="flex items-center justify-between gap-4">
                                      <div>
                                        <p className="text-sm font-semibold text-emerald-900">
                                          Agreed price
                                        </p>

                                        <p className="mt-1 text-xs text-emerald-600">
                                          Final agreed amount
                                        </p>
                                      </div>

                                      <p className="text-xl font-bold text-emerald-700">
                                        {money(
                                          agreed
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-6 rounded-xl bg-surface px-4 py-3">
                              <p className="text-xs text-fog">
                                Last updated{" "}
                                <span className="font-medium text-mist">
                                  {formatDateTime(
                                    booking.updatedAt ||
                                      booking.createdAt
                                  )}
                                </span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                }
              )
            )}
          </section>

          {/* SIDEBAR */}

          <aside className="space-y-5">

            {/* NOTIFICATIONS */}

            <section className="overflow-hidden rounded-2xl border border-line bg-raised shadow-sm">
              <div className="flex items-center justify-between border-b border-line p-5">
                <div>
                  <h2 className="font-bold text-cream">
                    Notifications
                  </h2>

                  <p className="mt-1 text-xs text-fog">
                    Recent booking activity
                  </p>
                </div>

                {unreadNotifications >
                  0 && (
                  <span className="rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-cream">
                    {unreadNotifications}
                  </span>
                )}
              </div>

              <div className="max-h-[420px] overflow-y-auto">
                {notifications.length ===
                0 ? (
                  <div className="p-6 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-surface">
                      🔔
                    </div>

                    <p className="mt-3 text-sm font-semibold text-mist">
                      No notifications yet
                    </p>

                    <p className="mt-1 text-xs leading-5 text-fog">
                      Updates about your bookings
                      will appear here.
                    </p>
                  </div>
                ) : (
                  notifications
                    .slice(0, 8)
                    .map(
                      (
                        notification
                      ) => (
                        <button
                          key={
                            notification.id
                          }
                          type="button"
                          onClick={() => {
                            markNotificationRead(
                              notification.id
                            );

                            if (
                              notification.bookingId
                            ) {
                              setSelectedBookingId(
                                notification.bookingId
                              );
                            }
                          }}
                          className={`w-full border-b border-line p-4 text-left transition hover:bg-surface ${
                            notification.read
                              ? "bg-raised"
                              : "bg-gold/10/40"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                notification.read
                                  ? "bg-elevated"
                                  : "bg-gold"
                              }`}
                            />

                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-cream">
                                {
                                  notification.title
                                }
                              </p>

                              <p className="mt-1 text-xs leading-5 text-mist">
                                {
                                  notification.message
                                }
                              </p>

                              <p className="mt-2 text-[10px] text-fog">
                                {formatDateTime(
                                  notification.createdAt
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    )
                )}
              </div>

              {notifications.length >
                0 && (
                <div className="border-t border-line p-4">
                  <button
                    type="button"
                    onClick={
                      markAllNotificationsRead
                    }
                    className="text-sm font-semibold text-gold transition hover:text-gold-dim"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </section>

            {/* PAYMENT SUMMARY */}

            <section className="rounded-2xl border border-line bg-raised p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  ₵
                </div>

                <div>
                  <h2 className="font-bold text-cream">
                    Payment activity
                  </h2>

                  <p className="mt-0.5 text-xs text-fog">
                    Booking payment overview
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-mist">
                    Received
                  </span>

                  <span className="font-bold text-emerald-700">
                    {money(
                      stats.received
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-mist">
                    Outstanding
                  </span>

                  <span className="font-bold text-cream">
                    {money(
                      stats.outstanding
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-mist">
                    Fully paid
                  </span>

                  <span className="font-bold text-cream">
                    {stats.paid}
                  </span>
                </div>

                <div className="border-t border-line pt-4">
                  <p className="text-[11px] leading-5 text-fog">
                    Payment amounts shown here are
                    based on recorded organizer payment
                    activity. EventFlow's current payment
                    flow is a demonstration and does not
                    process real funds.
                  </p>
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS */}

            <section className="rounded-2xl border border-line bg-raised p-5 shadow-sm">
              <div>
                <h2 className="font-bold text-cream">
                  Quick actions
                </h2>

                <p className="mt-1 text-xs text-fog">
                  Manage your vendor workspace
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <Link
                  to="/dashboard/vendor"
                  className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-mist transition hover:bg-gold/10 hover:text-gold-dim"
                >
                  <span>
                    Vendor dashboard
                  </span>

                  <span>→</span>
                </Link>

                <Link
                  to="/dashboard/vendor/services"
                  className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-mist transition hover:bg-gold/10 hover:text-gold-dim"
                >
                  <span>
                    Manage services
                  </span>

                  <span>→</span>
                </Link>

                <Link
                  to="/vendor/profile"
                  className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-mist transition hover:bg-gold/10 hover:text-gold-dim"
                >
                  <span>
                    View profile
                  </span>

                  <span>→</span>
                </Link>
              </div>
            </section>

          </aside>
        </div>
      </main>

      {/* QUOTATION MODAL */}

      {quoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 py-6 backdrop-blur-xl">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-raised p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  ₵
                </div>

                <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-gold">
                  New quotation
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-cream">
                  Send your price
                </h2>

                <p className="mt-2 text-sm leading-6 text-mist">
                  Set the amount you are prepared to
                  charge for this specific event.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setQuoteModal(null)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl text-fog transition hover:bg-surface hover:text-mist"
                aria-label="Close quotation modal"
              >
                ×
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
              <p className="font-semibold text-cream">
                {getEventName(
                  quoteModal
                )}
              </p>

              <p className="mt-1 text-sm text-mist">
                {getServiceName(
                  quoteModal
                )}
              </p>

              <p className="mt-2 text-xs text-fog">
                Organizer:{" "}
                {getOrganizerName(
                  quoteModal
                )}
              </p>
            </div>

            <label className="mt-6 block">
              <span className="text-sm font-semibold text-mist">
                Quotation amount
              </span>

              <span className="mt-1 block text-xs text-fog">
                This becomes your proposed price for
                this booking.
              </span>

              <div className="mt-3 flex items-center rounded-2xl border border-line bg-raised transition focus-within:border-gold/50 focus-within:ring-4 focus-within:ring-indigo-50">
                <span className="pl-4 text-sm font-bold text-fog">
                  GH₵
                </span>

                <input
                  type="number"
                  min="1"
                  value={quoteAmount}
                  onChange={(event) =>
                    setQuoteAmount(
                      event.target.value
                    )
                  }
                  placeholder="2,500"
                  className="w-full rounded-2xl border-0 bg-transparent px-3 py-4 text-xl font-bold outline-none"
                  autoFocus
                />
              </div>
            </label>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  setQuoteModal(null)
                }
                className="flex-1 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-mist transition hover:bg-surface"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  processingId ===
                  String(
                    quoteModal.id
                  )
                }
                onClick={() =>
                  sendQuotation(
                    quoteModal
                  )
                }
                className="flex-1 rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-gold-dim disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send quotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COUNTER MODAL */}

      {counterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 py-6 backdrop-blur-xl">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-raised p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  ↔
                </div>

                <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-violet-600">
                  Counter-offer
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-cream">
                  Propose another amount
                </h2>

                <p className="mt-2 text-sm leading-6 text-mist">
                  Send a revised amount to the
                  organizer. The booking remains under
                  negotiation until both sides agree.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCounterModal(null)
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl text-fog transition hover:bg-surface hover:text-mist"
                aria-label="Close counter-offer modal"
              >
                ×
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-amber/20 bg-amber/10 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber">
                    Current organizer offer
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    {getEventName(
                      counterModal
                    )}
                  </p>
                </div>

                <span className="text-xl font-bold text-amber-800">
                  {money(
                    getOrganizerCounterPrice(
                      counterModal
                    ) ||
                      getQuotationPrice(
                        counterModal
                      )
                  )}
                </span>
              </div>
            </div>

            <label className="mt-6 block">
              <span className="text-sm font-semibold text-mist">
                Your counter-offer
              </span>

              <span className="mt-1 block text-xs text-fog">
                Propose the amount you would like to
                receive.
              </span>

              <div className="mt-3 flex items-center rounded-2xl border border-line bg-raised transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-50">
                <span className="pl-4 text-sm font-bold text-fog">
                  GH₵
                </span>

                <input
                  type="number"
                  min="1"
                  value={counterAmount}
                  onChange={(event) =>
                    setCounterAmount(
                      event.target.value
                    )
                  }
                  placeholder="2,300"
                  className="w-full rounded-2xl border-0 bg-transparent px-3 py-4 text-xl font-bold outline-none"
                  autoFocus
                />
              </div>
            </label>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  setCounterModal(null)
                }
                className="flex-1 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-mist transition hover:bg-surface"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  processingId ===
                  String(
                    counterModal.id
                  )
                }
                onClick={() =>
                  sendVendorCounter(
                    counterModal
                  )
                }
                className="flex-1 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-raised disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send counter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
