import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

const BOOKINGS_KEY = "eventflowBookings";
const LATEST_BOOKING_KEY = "eventflowLatestBooking";

function formatDate(date) {
  if (!date) return "Not provided";

  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-GH",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  } catch {
    return date;
  }
}

function formatTime(time) {
  if (!time) return "Not provided";

  try {
    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-GH", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return time;
  }
}

function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return `GH₵${amount.toLocaleString("en-GH")}`;
}

function getProviderName(booking) {
  return (
    booking?.vendorName ||
    booking?.venueName ||
    booking?.serviceProviderName ||
    "Event provider"
  );
}

function getServiceName(booking) {
  return (
    booking?.serviceName ||
    booking?.vendorType ||
    "Event service"
  );
}

function getStatusDetails(status) {
  const normalized = String(status || "pending").toLowerCase();

  if (
    normalized === "accepted" ||
    normalized === "confirmed"
  ) {
    return {
      label: "Booking agreed",
      description:
        "Your booking has been accepted and the agreed price is locked.",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  if (
    normalized === "quotation_sent" ||
    normalized === "vendor_counter"
  ) {
    return {
      label: "Quotation received",
      description:
        "The provider has responded to your request. Review the quotation from your dashboard.",
      className:
        "border-indigo-200 bg-indigo-50 text-indigo-700",
      dot: "bg-indigo-500",
    };
  }

  if (normalized === "organizer_counter") {
    return {
      label: "Counter offer sent",
      description:
        "Your counter offer has been sent to the provider for review.",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  if (
    normalized === "rejected" ||
    normalized === "declined"
  ) {
    return {
      label: "Request declined",
      description:
        "This booking request was not accepted by the provider.",
      className:
        "border-red-200 bg-red-50 text-red-700",
      dot: "bg-red-500",
    };
  }

  return {
    label: "Request pending",
    description:
      "Your request has been sent. The provider will review your requirements and respond with a quotation.",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  };
}

function DetailRow({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span
        className={`break-words text-sm font-semibold sm:text-right ${
          highlight
            ? "text-indigo-600"
            : "text-slate-900"
        }`}
      >
        {value || "Not provided"}
      </span>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
          {eyebrow}
        </p>
      )}

      <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

export default function BookingSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const bookings = JSON.parse(
        localStorage.getItem(BOOKINGS_KEY) || "[]"
      );

      const found = Array.isArray(bookings)
        ? bookings.find(
            (item) =>
              String(item?.id) === String(id)
          )
        : null;

      if (found) {
        setBooking(found);
        setLoading(false);
        return;
      }

      const latest = JSON.parse(
        localStorage.getItem(
          LATEST_BOOKING_KEY
        ) || "null"
      );

      if (
        latest &&
        String(latest.id) === String(id)
      ) {
        setBooking(latest);
      }
    } catch (error) {
      console.error(
        "Unable to load booking:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  const statusDetails = useMemo(
    () => getStatusDetails(booking?.status),
    [booking?.status]
  );

  const quotedPrice = useMemo(() => {
    return (
      booking?.agreedPrice ||
      booking?.finalPrice ||
      booking?.vendorQuotationPrice ||
      booking?.quotationPrice ||
      booking?.quotedPrice ||
      booking?.proposedPrice ||
      null
    );
  }, [booking]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        <Navbar />

        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <div className="mx-auto h-20 w-20 rounded-full bg-slate-200" />

            <div className="mx-auto mt-6 h-8 w-64 rounded bg-slate-200" />

            <div className="mx-auto mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />

            <div className="mt-10 space-y-4">
              <div className="h-5 rounded bg-slate-200" />
              <div className="h-5 rounded bg-slate-200" />
              <div className="h-5 rounded bg-slate-200" />
              <div className="h-5 rounded bg-slate-200" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
        <Navbar />

        <main className="mx-auto flex min-h-[72vh] max-w-2xl items-center justify-center px-4 py-16 sm:px-6">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
              !
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              EventFlow booking
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Booking not found
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              We couldn't find this booking in your current
              EventFlow session. You can check your dashboard
              for your latest booking activity.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/dashboard/organizer"
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Go to dashboard
              </Link>

              <Link
                to="/discover"
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Discover services
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const providerName = getProviderName(booking);
  const serviceName = getServiceName(booking);

  const isPaid =
    String(booking?.paymentStatus || '').toLowerCase() === 'paid' ||
    String(booking?.paymentStatus || '').toLowerCase() === 'deposit_paid';

  const isVenue =
    String(booking.vendorType || "").toLowerCase() ===
      "venue" ||
    Boolean(booking.venueId);

  const formattedQuotedPrice =
    formatPrice(quotedPrice);

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8 pb-16 sm:px-6 lg:px-8 lg:py-12">
        {/* Success header */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="relative px-6 pb-8 pt-10 text-center sm:px-10 sm:pt-12">
            <div className="absolute inset-x-0 top-0 h-1 bg-indigo-600" />

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-xl font-bold text-white shadow-sm">
                ✓
              </div>
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              Request submitted
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Your event request is on its way
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Your request has been sent to{" "}
              <span className="font-semibold text-slate-700">
                {providerName}
              </span>
              . They can review your event requirements and
              respond with a quotation.
            </p>

            <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
              <span
                className={`h-2 w-2 rounded-full ${statusDetails.dot}`}
              />

              <span className="text-xs font-semibold text-slate-700">
                {statusDetails.label}
              </span>
            </div>
          </div>

          {/* Booking ID */}
          <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Booking reference
                </p>

                <p className="mt-1 font-mono text-sm font-bold tracking-wide text-slate-800">
                  {booking.id}
                </p>
              </div>

              <span className="text-xs text-slate-400">
                Keep this reference for your records
              </span>
            </div>
          </div>
        </section>

        {!isPaid && (
          <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg text-amber-600">
                💳
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  Payment required
                </h3>
                <p className="mt-1 text-sm text-slate-600 leading-6">
                  Your booking is not yet secured. Complete payment to confirm
                  your event with {providerName}.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() =>
                  navigate(`/payment/${booking.id}`)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition"
              >
                Pay now →
              </button>
            </div>
          </section>
        )}

        {/* Status information */}
        <section
          className={`mt-5 rounded-2xl border p-5 ${statusDetails.className}`}
        >
          <div className="flex gap-3">
            <div className="mt-0.5 font-bold">
              ●
            </div>

            <div>
              <p className="text-sm font-bold">
                {statusDetails.label}
              </p>

              <p className="mt-1 text-sm leading-6 opacity-80">
                {statusDetails.description}
              </p>
            </div>
          </div>
        </section>

        {/* Main grid */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Event details */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <SectionHeading
              eyebrow="Your request"
              title="Event details"
              description="The information you submitted to the provider."
            />

            <div className="mt-5">
              <DetailRow
                label="Event name"
                value={booking.eventName}
                highlight
              />

              <DetailRow
                label="Event type"
                value={booking.eventType}
              />

              <DetailRow
                label="Event date"
                value={formatDate(
                  booking.eventDate
                )}
              />

              <DetailRow
                label="Event time"
                value={formatTime(
                  booking.eventTime
                )}
              />

              <DetailRow
                label="Expected guests"
                value={
                  booking.guestCount
                    ? `${Number(
                        booking.guestCount
                      ).toLocaleString(
                        "en-GH"
                      )} guests`
                    : null
                }
              />

              <DetailRow
                label="Location"
                value={booking.location}
              />
            </div>

            {booking.message && (
              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Additional requirements
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {booking.message}
                </p>
              </div>
            )}
          </section>

          {/* Provider */}
          <aside className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeading
                eyebrow={
                  isVenue
                    ? "Venue"
                    : "Service provider"
                }
                title={providerName}
              />

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700">
                  {providerName
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {serviceName}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {booking.vendorType ||
                      (isVenue
                        ? "Venue"
                        : "Event service")}
                  </p>
                </div>
              </div>

              {formattedQuotedPrice && (
                <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                    Current quotation
                  </p>

                  <p className="mt-1 text-2xl font-bold text-indigo-900">
                    {formattedQuotedPrice}
                  </p>
                </div>
              )}

              {!formattedQuotedPrice && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Pricing
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    Awaiting quotation
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The provider will review your requirements
                    before sending a quotation.
                  </p>
                </div>
              )}
            </section>

            {/* What happens next */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeading
                eyebrow="Next steps"
                title="What happens next?"
              />

              <div className="mt-5 space-y-5">
                <Step
                  number="01"
                  title="Provider reviews"
                  description="Your event requirements are reviewed by the provider."
                  active
                />

                <Step
                  number="02"
                  title="Quotation"
                  description="The provider can send a quotation based on your requirements."
                />

                <Step
                  number="03"
                  title="You decide"
                  description="Accept the quotation, reject it or make a counter offer."
                />

                <Step
                  number="04"
                  title="Agreement"
                  description="Once both sides agree, the agreed price becomes locked."
                />
              </div>
            </section>
          </aside>
        </div>

        {/* Important pricing note */}
        <section className="mt-5 rounded-3xl border border-indigo-100 bg-indigo-50 p-6 sm:p-7">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white font-bold text-indigo-600 shadow-sm">
              ₵
            </div>

            <div>
              <h2 className="text-sm font-bold text-indigo-950">
                About pricing on EventFlow
              </h2>

              <p className="mt-1 text-sm leading-6 text-indigo-900/70">
                Listing prices are starting prices and should not
                be treated as the final cost of your event. Your
                provider reviews the requirements you submitted
                before sending a quotation. You can then accept,
                reject or negotiate the quotation.
              </p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/dashboard/organizer"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            View my dashboard
          </Link>

          <Link
            to="/discover"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Continue exploring
          </Link>
        </section>

        <p className="mt-5 text-center text-xs text-slate-400">
          You can track quotations, counter offers and booking
          updates from your EventFlow dashboard.
        </p>
      </main>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  active = false,
}) {
  return (
    <div className="flex gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
          active
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {number}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
