import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SAVED_ITEMS_PREFIX = "eventflowSavedItems_";

const listings = [
  {
    id: 1,
    type: "Venue",
    icon: "🏛️",
    name: "Golden Palace Events",
    location: "Kumasi, Ashanti Region",
    rating: "4.8",
    reviews: 124,
    price: 5000,
    capacity: "Up to 500 guests",
    description:
      "Golden Palace Events is a spacious and elegant event venue designed for weddings, engagements, birthdays, corporate events and other special occasions.",
    verified: true,
    features: [
      "Up to 500 guests",
      "Parking available",
      "Indoor and outdoor spaces",
      "Event decoration support",
      "Security available",
      "Accessible location",
    ],
  },

  {
    id: 2,
    type: "Photography",
    icon: "📸",
    name: "Kofi Visuals",
    location: "Kumasi, Ashanti Region",
    rating: "4.9",
    reviews: 87,
    price: 2000,
    capacity: "Photography",
    description:
      "Kofi Visuals provides professional photography coverage for weddings, engagements, birthdays, graduations, corporate events and other memorable occasions.",
    verified: true,
    vendorId: "kofi-visuals",
    features: [
      "Wedding photography",
      "Engagement photography",
      "Birthday photography",
      "Corporate events",
      "Professional editing",
      "Digital photo delivery",
    ],
  },

  {
    id: 3,
    type: "Decoration",
    icon: "🎨",
    name: "Creative Moments GH",
    location: "Accra, Greater Accra",
    rating: "4.7",
    reviews: 63,
    price: 3500,
    capacity: "Event Decoration",
    description:
      "Creative Moments GH transforms event spaces into beautiful experiences with professional decoration, styling and creative event setups.",
    verified: true,
    features: [
      "Wedding decoration",
      "Birthday decoration",
      "Engagement decoration",
      "Corporate decoration",
      "Stage setup",
      "Table styling",
    ],
  },

  {
    id: 4,
    type: "DJ & Music",
    icon: "🎧",
    name: "DJ Mike Events",
    location: "Accra, Greater Accra",
    rating: "4.8",
    reviews: 51,
    price: 1500,
    capacity: "DJ & Sound",
    description:
      "DJ Mike Events provides professional DJ entertainment and sound services for weddings, parties, corporate events and celebrations.",
    verified: true,
    features: [
      "Professional DJ",
      "Sound system",
      "Wedding entertainment",
      "Birthday parties",
      "Corporate events",
      "MC support",
    ],
  },

  {
    id: 5,
    type: "Venue",
    icon: "🏛️",
    name: "Royal Gardens",
    location: "Accra, Greater Accra",
    rating: "4.6",
    reviews: 96,
    price: 4000,
    capacity: "Up to 300 guests",
    description:
      "Royal Gardens offers a beautiful and comfortable setting for weddings, engagements, birthdays, private celebrations and corporate events.",
    verified: true,
    features: [
      "Up to 300 guests",
      "Parking available",
      "Garden space",
      "Indoor event area",
      "Security available",
      "Event support",
    ],
  },

  {
    id: 6,
    type: "Videography",
    icon: "🎥",
    name: "Vision Films GH",
    location: "Kumasi, Ashanti Region",
    rating: "4.9",
    reviews: 72,
    price: 2500,
    capacity: "Event Videography",
    description:
      "Vision Films GH captures the important moments of your event with professional video coverage, creative storytelling and high-quality editing.",
    verified: true,
    vendorId: "vision-films-gh",
    features: [
      "Wedding videography",
      "Engagement videography",
      "Birthday events",
      "Corporate events",
      "Professional editing",
      "Highlight videos",
    ],
  },
];

function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem("eventflowUser") || "null"
    );
  } catch {
    return null;
  }
}

function getSavedItems(email) {
  if (!email) return [];

  try {
    return JSON.parse(
      localStorage.getItem(
        `${SAVED_ITEMS_PREFIX}${String(email).toLowerCase()}`
      ) || "[]"
    );
  } catch {
    return [];
  }
}

function ListingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [saved, setSaved] = useState(false);

  const listing = useMemo(
    () =>
      listings.find(
        (item) => String(item.id) === String(id)
      ),
    [id]
  );

  /*
   * Check saved state when the listing loads.
   */
  useEffect(() => {
    const loadSavedState = () => {
      const user = getCurrentUser();

      if (!user?.email || !listing) {
        setSaved(false);
        return;
      }

      const items = getSavedItems(user.email);

      setSaved(
        items.some(
          (item) =>
            String(item.id) === String(listing.id) &&
            item.type ===
              (listing.type === "Venue"
                ? "venue"
                : "vendor")
        )
      );
    };

    loadSavedState();

    window.addEventListener(
      "eventflow-saved-items-updated",
      loadSavedState
    );

    window.addEventListener(
      "eventflow-auth-changed",
      loadSavedState
    );

    window.addEventListener("storage", loadSavedState);

    return () => {
      window.removeEventListener(
        "eventflow-saved-items-updated",
        loadSavedState
      );

      window.removeEventListener(
        "eventflow-auth-changed",
        loadSavedState
      );

      window.removeEventListener(
        "storage",
        loadSavedState
      );
    };
  }, [listing]);

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#f7f7fb] text-cream">
        <Navbar />

        <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-5 py-16 sm:px-6 lg:px-8">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gold/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-9 w-9 text-gold"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-gold">
              EventFlow
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-cream">
              Listing not found
            </h1>

            <p className="mt-3 text-sm leading-6 text-mist">
              We couldn't find the venue or event professional
              you're looking for. It may have been removed or is
              no longer available.
            </p>

            <Link
              to="/discover"
              className="mt-7 inline-flex items-center rounded-xl bg-paper px-6 py-3 text-sm font-bold text-cream transition hover:bg-gold"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="mr-2 h-4 w-4"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>

              Back to Discover
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const isVendor = listing.type !== "Venue";

  const formattedPrice = Number(
    listing.price || 0
  ).toLocaleString();

  /*
   * Save / unsave listing.
   */
  const handleSave = () => {
    const user = getCurrentUser();

    if (!user?.email) {
      navigate("/login", {
        state: {
          from: `/listing/${listing.id}`,
        },
      });

      return;
    }

    const storageKey = `${SAVED_ITEMS_PREFIX}${String(
      user.email
    ).toLowerCase()}`;

    const existing = getSavedItems(user.email);

    const itemType =
      listing.type === "Venue" ? "venue" : "vendor";

    const alreadySaved = existing.some(
      (item) =>
        String(item.id) === String(listing.id) &&
        item.type === itemType
    );

    let updated;

    if (alreadySaved) {
      updated = existing.filter(
        (item) =>
          !(
            String(item.id) === String(listing.id) &&
            item.type === itemType
          )
      );
    } else {
      updated = [
        ...existing,
        {
          id: listing.id,
          type: itemType,
          name: listing.name,
          location: listing.location,
          category: listing.type,
          price: listing.price,
          capacity: listing.capacity,
          savedAt: new Date().toISOString(),
        },
      ];
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify(updated)
    );

    setSaved(!alreadySaved);

    window.dispatchEvent(
      new Event("eventflow-saved-items-updated")
    );
  };

  /*
   * Booking action.
   *
   * Venue listings use the venue details page.
   * Vendor listings use the existing booking route.
   */
  const handleBooking = () => {
    if (listing.type === "Venue") {
      navigate(`/venues/${listing.id}`);
      return;
    }

    if (listing.vendorId) {
      navigate(`/booking/${listing.vendorId}`);
      return;
    }

    window.alert(
      "This listing is currently unavailable for booking."
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-cream">
      <Navbar />

      <main>
        {/* =====================================================
            TOP / HERO
        ====================================================== */}
        <section className="border-b border-line bg-raised">
          <div className="mx-auto max-w-7xl px-5 pb-10 pt-6 sm:px-6 lg:px-8 lg:pb-12">
            <Link
              to="/discover"
              className="inline-flex items-center rounded-xl px-2 py-2 text-sm font-semibold text-mist transition hover:bg-surface hover:text-gold"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="mr-2 h-4 w-4"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>

              Back to Discover
            </Link>

            <div className="mt-5 overflow-hidden rounded-[2rem] border border-line bg-raised shadow-sm">
              {/* COVER */}
              <div className="relative flex h-64 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-white sm:h-80 lg:h-96">
                <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold/30/20 blur-3xl" />
                <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-gold/30/20 blur-3xl" />

                <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-raised/80 text-7xl shadow-xl backdrop-blur sm:h-36 sm:w-36 sm:text-8xl">
                  {listing.icon}
                </div>

                {listing.verified && (
                  <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-line-bright bg-raised/90 px-3.5 py-2 text-xs font-bold text-emerald-700 shadow-lg backdrop-blur">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-cream">
                      ✓
                    </span>

                    Verified listing
                  </div>
                )}

                <div className="absolute bottom-5 right-5 rounded-full bg-paper/85 px-3.5 py-2 text-xs font-semibold text-cream backdrop-blur">
                  {listing.type}
                </div>
              </div>

              {/* INFORMATION */}
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                      {listing.type}
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-cream sm:text-4xl lg:text-5xl">
                      {listing.name}
                    </h1>

                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-mist">
                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-4 w-4 text-fog"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z" />
                          <circle cx="12" cy="9" r="2.2" />
                        </svg>

                        {listing.location}
                      </span>

                      {listing.rating && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-amber">
                            ★
                          </span>

                          <strong className="text-cream">
                            {listing.rating}
                          </strong>

                          {listing.reviews ? (
                            <span>
                              ({listing.reviews} reviews)
                            </span>
                          ) : null}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-4 w-4 text-fog"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        >
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>

                        {listing.capacity}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleSave}
                      className={`inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-bold transition ${
                        saved
                          ? "border-gold/30 bg-gold/10 text-gold"
                          : "border-line bg-raised text-mist hover:border-gold/30 hover:bg-gold/10 hover:text-gold-dim"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill={saved ? "currentColor" : "none"}
                        className="mr-2 h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M20.8 8.8c0 5.5-8.8 10.3-8.8 10.3S3.2 14.3 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z" />
                      </svg>

                      {saved ? "Saved" : "Save listing"}
                    </button>

                    <button
                      type="button"
                      onClick={handleBooking}
                      className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3 text-sm font-bold text-cream shadow-sm transition hover:bg-gold-dim active:scale-[0.98]"
                    >
                      Request Booking

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="ml-2 h-4 w-4"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.55fr_0.85fr]">
            {/* =================================================
                LEFT COLUMN
            ================================================== */}
            <div className="space-y-7">
              {/* ABOUT */}
              <section className="rounded-3xl border border-line bg-raised p-6 shadow-sm sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                  About this listing
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight text-cream">
                  About {listing.name}
                </h2>

                <p className="mt-4 text-sm leading-7 text-mist">
                  {listing.description}
                </p>
              </section>

              {/* FEATURES */}
              <section className="rounded-3xl border border-line bg-raised p-6 shadow-sm sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                  Features & services
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight text-cream">
                  What this listing offers
                </h2>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {listing.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-gold/20 hover:bg-gold/10/40"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-600">
                        ✓
                      </div>

                      <span className="text-sm font-semibold text-mist">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* RATINGS / REVIEWS */}
              <section className="rounded-3xl border border-line bg-raised p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                      Customer feedback
                    </p>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-cream">
                      Ratings & reviews
                    </h2>
                  </div>

                  {listing.rating ? (
                    <div className="rounded-2xl bg-amber/10 px-5 py-4 text-center">
                      <p className="text-2xl font-bold text-cream">
                        {listing.rating}
                      </p>

                      <div className="mt-1 text-sm tracking-wide text-amber">
                        ★★★★★
                      </div>

                      {listing.reviews ? (
                        <p className="mt-1 text-xs text-mist">
                          Based on {listing.reviews} reviews
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-surface px-5 py-4 text-center">
                      <p className="text-sm font-bold text-mist">
                        No ratings yet
                      </p>

                      <p className="mt-1 text-xs text-fog">
                        Reviews will appear here as they are
                        collected.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-raised text-gold shadow-sm">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
                    </svg>
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-cream">
                    Reviews will appear here
                  </h3>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-mist">
                    EventFlow will display verified customer
                    feedback here as completed bookings generate
                    reviews.
                  </p>
                </div>
              </section>
            </div>

            {/* =================================================
                RIGHT COLUMN
            ================================================== */}
            <aside className="space-y-6">
              {/* PRICE CARD */}
              <section className="rounded-3xl border border-line bg-raised p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-fog">
                  Starting price
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-cream">
                  GH₵{formattedPrice}
                </p>

                <p className="mt-2 text-sm leading-6 text-mist">
                  This is an indicative starting price. Your final
                  price is confirmed after the provider reviews
                  your event requirements.
                </p>

                <button
                  type="button"
                  onClick={handleBooking}
                  className="mt-6 flex w-full items-center justify-center rounded-xl bg-gold py-3.5 text-sm font-bold text-cream transition hover:bg-gold-dim"
                >
                  Request Booking

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="ml-2 h-4 w-4"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </button>
              </section>

              {/* LOCATION */}
              <section className="rounded-3xl border border-line bg-raised p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">
                  Location
                </p>

                <h2 className="mt-2 text-xl font-bold text-cream">
                  Where you'll find them
                </h2>

                <div className="mt-5 flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z" />
                      <circle cx="12" cy="9" r="2.2" />
                    </svg>
                  </div>

                  <div>
                    <p className="font-bold text-cream">
                      {listing.location}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-mist">
                      Location details can be confirmed with the
                      provider before booking.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-gray-50">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-raised shadow-sm">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-6 w-6 text-gold"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M3 6.5 9 3l6 3 6-3v14.5L15 21l-6-3-6 3Z" />
                        <path d="M9 3v15M15 6v15" />
                      </svg>
                    </div>

                    <p className="mt-3 text-xs font-semibold text-mist">
                      Map integration coming soon
                    </p>
                  </div>
                </div>
              </section>

              {/* TRUST */}
              <section className="rounded-3xl border border-gold/20 bg-gold/10 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-raised shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6 text-gold"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
                    <path d="m8.5 12 2.3 2.3 4.8-5" />
                  </svg>
                </div>

                <h3 className="mt-4 font-bold text-cream">
                  EventFlow verified
                </h3>

                <p className="mt-2 text-sm leading-6 text-mist">
                  This listing has been approved for display on
                  EventFlow. Organizers can review the provider's
                  information before sending a booking request.
                </p>
              </section>

              {/* VENDOR PROFILE */}
              {isVendor && listing.vendorId && (
                <section className="overflow-hidden rounded-3xl bg-paper p-6 text-cream">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-raised/10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5 text-gold"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M5 21a7 7 0 0 1 14 0" />
                    </svg>
                  </div>

                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-gold">
                    Vendor profile
                  </p>

                  <h3 className="mt-2 text-xl font-bold">
                    Explore {listing.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-fog">
                    View the provider's profile and available
                    services before sending your booking request.
                  </p>

                  <Link
                    to={`/vendor/${listing.vendorId}`}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-raised px-5 py-3 text-sm font-bold text-cream transition hover:bg-gold/10"
                  >
                    View Vendor Profile

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="ml-2 h-4 w-4"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </Link>
                </section>
              )}
            </aside>
          </div>

          {/* ===================================================
              BOTTOM CTA
          ==================================================== */}
          <section className="relative mt-10 overflow-hidden rounded-3xl bg-paper p-7 text-cream sm:p-10">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                  Ready to plan?
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Interested in {listing.name}?
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-fog">
                  Send your event requirements and start the
                  conversation with the provider. Pricing can be
                  discussed before an agreement is reached.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBooking}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-raised px-6 py-3.5 text-sm font-bold text-cream transition hover:bg-gold/10"
              >
                Request Booking

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="ml-2 h-4 w-4"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </button>
            </div>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default ListingDetails;
