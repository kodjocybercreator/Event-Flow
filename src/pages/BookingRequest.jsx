import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

const EVENT_TYPES = [
  "Wedding",
  "Engagement",
  "Birthday",
  "Corporate Event",
  "Funeral",
  "Graduation",
  "Baby Shower",
  "Anniversary",
  "Party",
  "Naming Ceremony",
  "Conference",
  "Church Event",
  "Other",
];

/* =========================================================
   STORAGE HELPERS
========================================================= */

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readObject(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function saveRecord(key, record) {
  const records = readArray(key);
  const exists = records.some(
    (item) => String(item.id) === String(record.id)
  );

  const updated = exists
    ? records.map((item) =>
        String(item.id) === String(record.id) ? record : item
      )
    : [record, ...records];

  localStorage.setItem(key, JSON.stringify(updated));
}

function saveNotification(key, notification) {
  const notifications = readArray(key);

  if (
    notifications.some(
      (item) => String(item.id) === String(notification.id)
    )
  ) {
    return;
  }

  localStorage.setItem(
    key,
    JSON.stringify([notification, ...notifications])
  );
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Price on request";
  }

  return `GH₵${amount.toLocaleString("en-GH")}`;
}

function getVendorName(account) {
  const fullName = `${account.firstName || ""} ${
    account.lastName || ""
  }`.trim();

  return (
    account.businessName ||
    account.name ||
    account.vendorName ||
    fullName ||
    "EventFlow Vendor"
  );
}

function getVendorIcon(account) {
  if (account.icon) return account.icon;

  const type = String(
    account.vendorType || account.specialization || ""
  ).toLowerCase();

  if (type.includes("photo")) return "📸";
  if (type.includes("video")) return "🎥";
  if (type.includes("decor")) return "✨";
  if (type.includes("dj") || type.includes("music")) return "🎵";
  if (type.includes("cater")) return "🍽️";
  if (type.includes("transport")) return "🚘";
  if (type.includes("makeup") || type.includes("beauty")) return "💄";
  if (type.includes("planning")) return "📋";

  return "🎉";
}

function getOrganizerName(organizer) {
  const fullName = `${organizer.firstName || ""} ${
    organizer.lastName || ""
  }`.trim();

  return (
    fullName ||
    organizer.name ||
    organizer.fullName ||
    "EventFlow Organizer"
  );
}

function createBookingId() {
  return `EF-${Date.now().toString().slice(-8)}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;
}

function getVendorById(vendorId) {
  if (!vendorId) return null;

  const accounts = readArray("eventflowAccounts");
  const requestedId = String(vendorId);

  return (
    accounts.find((account) => {
      if (account.accountType !== "vendor") return false;

      const ids = [
        account.id,
        account.profileId,
        account.vendorId,
      ]
        .filter((value) => value !== undefined && value !== null)
        .map(String);

      const name = getVendorName(account);

      return (
        ids.includes(requestedId) ||
        slugify(name) === slugify(requestedId) ||
        slugify(account.businessName || "") === slugify(requestedId)
      );
    }) || null
  );
}

function getVendorServices(email) {
  if (!email) return [];

  return readArray(
    `eventflowServices_${String(email).trim().toLowerCase()}`
  );
}

/*
  Services with a recorded approval status must be approved.
  Older services without a status remain compatible with the
  existing localStorage data.
*/
function isPublicService(service) {
  if (service.available === false) return false;

  const status = String(
    service.status || service.approvalStatus || ""
  )
    .trim()
    .toLowerCase();

  return !status || status === "approved";
}

/* =========================================================
   BOOKING REQUEST PAGE
========================================================= */

export default function BookingRequest() {
  const { vendorId: routeVendorId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Supports both route params and query parameters.
  const vendorId = routeVendorId || searchParams.get("vendorId") || "";
  const requestedServiceId = searchParams.get("service") || "";

  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitLock = useRef(false);

  const [form, setForm] = useState({
    serviceId: requestedServiceId,
    eventType: "",
    eventDate: "",
    eventTime: "",
    eventLocation: "",
    guests: "",
    budget: "",
    message: "",
  });

  /* =========================================================
     LOAD VENDOR
  ========================================================= */

  const loadVendor = useCallback(() => {
    setLoading(true);

    const account = getVendorById(vendorId);

    if (!account) {
      setVendor(null);
      setServices([]);
      setLoading(false);
      return;
    }

    const vendorEmail = String(account.email || "").trim().toLowerCase();

    setVendor({
      ...account,
      id: account.id ?? account.profileId ?? account.vendorId,
      name: getVendorName(account),
      type:
        account.vendorType ||
        account.specialization ||
        "Event Vendor",
      icon: getVendorIcon(account),
      email: vendorEmail,
      phone: account.phone || account.phoneNumber || "",
      location: account.location || "Ghana",
      specialization:
        account.specialization ||
        account.vendorType ||
        "Event Services",
      status: String(
        account.status || account.approvalStatus || "pending"
      ).toLowerCase(),
    });

    setServices(getVendorServices(vendorEmail));
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    loadVendor();

    const handleUpdate = () => loadVendor();

    window.addEventListener("eventflow-services-updated", handleUpdate);
    window.addEventListener("eventflow-accounts-updated", handleUpdate);
    window.addEventListener("eventflow-auth-changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("eventflow-services-updated", handleUpdate);
      window.removeEventListener("eventflow-accounts-updated", handleUpdate);
      window.removeEventListener("eventflow-auth-changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadVendor]);

  /* =========================================================
     APPROVED / AVAILABLE SERVICES
  ========================================================= */

  const availableServices = useMemo(
    () => services.filter(isPublicService),
    [services]
  );

  useEffect(() => {
    setForm((previous) => {
      if (
        requestedServiceId &&
        availableServices.some(
          (service) => String(service.id) === String(requestedServiceId)
        )
      ) {
        return {
          ...previous,
          serviceId: String(requestedServiceId),
        };
      }

      if (
        previous.serviceId &&
        availableServices.some(
          (service) => String(service.id) === String(previous.serviceId)
        )
      ) {
        return previous;
      }

      if (availableServices.length === 1) {
        return {
          ...previous,
          serviceId: String(availableServices[0].id),
        };
      }

      return { ...previous, serviceId: "" };
    });
  }, [requestedServiceId, availableServices]);

  const selectedService = useMemo(
    () =>
      availableServices.find(
        (service) => String(service.id) === String(form.serviceId)
      ),
    [availableServices, form.serviceId]
  );

  /* =========================================================
     FORM HANDLING
  ========================================================= */

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  /* =========================================================
     SUBMIT BOOKING
  ========================================================= */

  function handleSubmit(event) {
    event.preventDefault();

    if (submitLock.current || submitting) return;

    setError("");

    const organizer = readObject("eventflowUser");

    if (!organizer) {
      setError("Please log in as an organizer before requesting a booking.");
      return;
    }

    if (organizer.accountType !== "organizer") {
      setError("Only organizer accounts can make booking requests.");
      return;
    }

    // Read the latest data before submitting.
    const latestAccount = getVendorById(vendorId);

    if (!latestAccount) {
      setError(
        "We could not find this vendor. Please return to Discover and try again."
      );
      return;
    }

    const latestVendorStatus = String(
      latestAccount.status || latestAccount.approvalStatus || "pending"
    ).toLowerCase();

    if (latestVendorStatus !== "approved") {
      setError("This vendor has not yet been approved by EventFlow.");
      return;
    }

    const vendorEmail = String(latestAccount.email || "")
      .trim()
      .toLowerCase();

    if (!vendorEmail) {
      setError("This vendor does not have a valid account email.");
      return;
    }

    const latestServices = getVendorServices(vendorEmail).filter(
      isPublicService
    );

    const service = latestServices.find(
      (item) => String(item.id) === String(form.serviceId)
    );

    if (!service) {
      setError("Please select an available service from this vendor.");
      return;
    }

    if (!form.eventType) {
      setError("Please select your event type.");
      return;
    }

    if (!form.eventDate) {
      setError("Please select your event date.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(`${form.eventDate}T00:00:00`);

    if (Number.isNaN(eventDate.getTime()) || eventDate < today) {
      setError("Please select today or a future event date.");
      return;
    }

    const eventLocation = form.eventLocation.trim();

    if (!eventLocation) {
      setError("Please enter the event location.");
      return;
    }

    const guestCount = Number(form.guests);

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      setError("Please enter a valid number of guests.");
      return;
    }

    const budget =
      form.budget === "" ? null : Number(form.budget);

    if (
      budget !== null &&
      (!Number.isFinite(budget) || budget < 0)
    ) {
      setError("Please enter a valid budget.");
      return;
    }

    submitLock.current = true;
    setSubmitting(true);

    try {
      const now = new Date().toISOString();
      const bookingId = createBookingId();

      const vendorName = getVendorName(latestAccount);
      const organizerName = getOrganizerName(organizer);
      const organizerId =
        organizer.id ||
        organizer.userId ||
        organizer.email ||
        `organizer-${Date.now()}`;

      const serviceName =
        service.name || service.serviceName || "Selected service";

      const startingPrice = Number(service.price || 0);

      const booking = {
        id: bookingId,

        // Provider details
        vendorId:
          latestAccount.id ??
          latestAccount.profileId ??
          latestAccount.vendorId,
        vendorName,
        vendorEmail,
        vendorPhone:
          latestAccount.phone || latestAccount.phoneNumber || "",
        vendorType:
          latestAccount.vendorType ||
          latestAccount.specialization ||
          "Event Vendor",
        vendorLocation: latestAccount.location || "Ghana",
        vendorSpecialization:
          latestAccount.specialization ||
          latestAccount.vendorType ||
          "Event Services",

        // Service details
        serviceId: service.id,
        serviceName,
        serviceCategory:
          service.category ||
          service.serviceCategory ||
          latestAccount.specialization ||
          latestAccount.vendorType ||
          "Event Services",
        serviceDescription: service.description || "",
        startingPrice,
        price: startingPrice,
        servicePrice: startingPrice,
        pricingType: service.pricingType || "Starting from",

        // Event details
        eventType: form.eventType,
        eventDate: form.eventDate,
        eventTime: form.eventTime,
        eventLocation,
        location: eventLocation,
        guests: guestCount,
        guestCount,
        budget,
        message: form.message.trim(),

        // Organizer details
        organizerId,
        organizerName,
        organizerEmail: organizer.email || "",
        organizerPhone:
          organizer.phone || organizer.phoneNumber || "",

        // Negotiation starts pending.
        // The starting price is not a final agreed price.
        status: "pending",
        quotationStatus: "pending",
        negotiationStatus: "pending",
        vendorCounterPrice: null,
        organizerCounterPrice: null,
        counterOffer: null,
        agreedPrice: null,
        finalPrice: null,
        vendorResponse: null,
        vendorResponseMessage: "",

        // Payment remains unpaid until agreement.
        paymentStatus: "unpaid",
        paymentOption: null,
        amountPaid: 0,
        remainingBalance: null,

        createdAt: now,
        updatedAt: now,
      };

      // Save the master booking.
      saveRecord("eventflowBookings", booking);

      // Save a copy for the organizer dashboard.
      saveRecord("eventflowOrganizerBookings", booking);

      // Save a vendor-specific copy.
      saveRecord(
        `eventflowVendorBookings_${vendorEmail}`,
        booking
      );

      // Notify the vendor of the new request.
      saveNotification(
        `eventflowVendorNotifications_${vendorEmail}`,
        {
          id: `notification-${bookingId}`,
          type: "booking",
          bookingId,
          title: "New booking request",
          message: `${organizerName} requested ${serviceName} for a ${form.eventType}.`,
          eventLocation,
          location: eventLocation,
          read: false,
          createdAt: now,
        }
      );

      // Notify listeners so dashboards can refresh.
      window.dispatchEvent(
        new CustomEvent("eventflow-booking-created", {
          detail: booking,
        })
      );

      window.dispatchEvent(
        new CustomEvent("eventflow-bookings-updated", {
          detail: booking,
        })
      );

      window.dispatchEvent(
        new CustomEvent("eventflow-booking-updated", {
          detail: booking,
        })
      );

      window.dispatchEvent(
        new CustomEvent("eventflow-vendor-bookings-updated", {
          detail: booking,
        })
      );

      window.dispatchEvent(
        new CustomEvent("eventflow-notifications-updated", {
          detail: booking,
        })
      );

      navigate(`/payment/${bookingId}`, {
        state: { booking },
      });
    } catch (err) {
      console.error("Booking submission failed:", err);

      setError(
        "The booking could not be saved. Please check your browser storage and try again."
      );

      submitLock.current = false;
      setSubmitting(false);
    }
  }

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Preparing your booking
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Loading the provider's available services.
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* =========================================================
     VENDOR NOT FOUND
  ========================================================= */

  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="mx-auto flex max-w-3xl items-center justify-center px-4 py-20">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-3xl">
              !
            </div>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">
              Provider not found
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              We couldn't find this provider. The profile may have changed,
              or the booking link may be missing the provider ID.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/discover"
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Browse providers
              </Link>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Go back
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const vendorApproved = vendor.status === "approved";

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-7">
          <Link
            to={`/vendor/${vendor.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            <span aria-hidden="true">←</span>
            Back to provider profile
          </Link>

          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              EventFlow bookings
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Request a booking
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Tell the provider about your event. They can review your request
              and send you a quotation before you agree on the final price.
            </p>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* BOOKING FORM */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            {!vendorApproved && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                This provider has not yet been approved by EventFlow, so a
                booking request cannot be submitted.
              </div>
            )}

            {availableServices.length === 0 && vendorApproved && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                This provider currently has no approved services available
                for booking.
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* SERVICE */}
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    1. Choose a service
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select the service you need for your event.
                  </p>
                </div>

                <label
                  htmlFor="serviceId"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Available service <span className="text-rose-500">*</span>
                </label>

                <select
                  id="serviceId"
                  name="serviceId"
                  value={form.serviceId}
                  onChange={handleChange}
                  required
                  disabled={!vendorApproved || availableServices.length === 0}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Select a service</option>
                  {availableServices.map((service) => (
                    <option key={service.id} value={String(service.id)}>
                      {service.name ||
                        service.serviceName ||
                        "Unnamed service"}{" "}
                      — {formatMoney(service.price)}
                      {service.pricingType
                        ? ` (${service.pricingType})`
                        : ""}
                    </option>
                  ))}
                </select>

                {selectedService && (
                  <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                    <p className="font-semibold text-slate-900">
                      {selectedService.name ||
                        selectedService.serviceName ||
                        "Selected service"}
                    </p>
                    {selectedService.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {selectedService.description}
                      </p>
                    )}
                    <p className="mt-3 text-sm font-bold text-indigo-700">
                      {formatMoney(selectedService.price)}
                      <span className="ml-2 font-medium text-slate-500">
                        {selectedService.pricingType || "Starting from"}
                      </span>
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      This is the listed price basis, not a final quotation.
                      The provider can quote based on your event requirements.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100" />

              {/* EVENT DETAILS */}
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    2. Event details
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Give the provider the key information about your event.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="eventType"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Event type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="eventType"
                      name="eventType"
                      value={form.eventType}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    >
                      <option value="">Select event type</option>
                      {EVENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="eventDate"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Event date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="eventDate"
                      name="eventDate"
                      type="date"
                      min={new Date().toLocaleDateString("en-CA")}
                      value={form.eventDate}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="eventTime"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Event time
                    </label>
                    <input
                      id="eventTime"
                      name="eventTime"
                      type="time"
                      value={form.eventTime}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="eventLocation"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Event location <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="eventLocation"
                      name="eventLocation"
                      type="text"
                      placeholder="e.g. East Legon, Accra"
                      value={form.eventLocation}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Enter the town, city, venue or address where the event
                      will take place.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="guests"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Expected guests <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="guests"
                      name="guests"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 150"
                      value={form.guests}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="budget"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Your budget (GH₵)
                    </label>
                    <input
                      id="budget"
                      name="budget"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      value={form.budget}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Additional requirements
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      placeholder="Describe what you need, special requests, preferred arrangements or other useful details..."
                      value={form.message}
                      onChange={handleChange}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* SUBMIT */}
              <div>
                <p className="mb-4 text-xs leading-5 text-slate-500">
                  Submitting this request does not confirm a booking or charge
                  you. The provider must respond with a quotation, and the
                  final price must be agreed before payment.
                </p>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !vendorApproved ||
                    availableServices.length === 0
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Submitting request...
                    </>
                  ) : (
                    "Submit booking request"
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* PROVIDER SUMMARY */}
          <aside className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-indigo-700 to-violet-700 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-100">
                  Your selected provider
                </p>
                <div className="mt-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-3xl">
                  {vendor.icon}
                </div>
                <h2 className="mt-4 text-xl font-bold">{vendor.name}</h2>
                <p className="mt-1 text-sm text-indigo-100">
                  {vendor.specialization}
                </p>
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Location
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {vendor.location}
                  </p>
                </div>

                {vendor.phone && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Contact
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {vendor.phone}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Services available
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {availableServices.length}{" "}
                    {availableServices.length === 1 ? "service" : "services"}
                  </p>
                </div>

                <Link
                  to={`/vendor/${vendor.id}`}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View provider profile
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    How booking works
                  </h3>
                  <ol className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                    <li>
                      <span className="font-semibold text-indigo-700">1.</span>{" "}
                      Send your event requirements.
                    </li>
                    <li>
                      <span className="font-semibold text-indigo-700">2.</span>{" "}
                      The provider reviews your request and sends a quote.
                    </li>
                    <li>
                      <span className="font-semibold text-indigo-700">3.</span>{" "}
                      You can accept, reject or counter the quotation.
                    </li>
                    <li>
                      <span className="font-semibold text-indigo-700">4.</span>{" "}
                      Payment follows after the final price is agreed.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
