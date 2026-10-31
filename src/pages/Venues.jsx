import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const SAVED_ITEMS_PREFIX = "eventflowSavedItems_";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Funeral",
  "Naming Ceremony",
  "Conference",
  "Graduation",
  "Engagement",
  "Corporate Event",
  "Church Event",
  "Party",
];

const CAPACITY_OPTIONS = [
  "Guest capacity",
  "50 - 100",
  "100 - 300",
  "300 - 500",
  "500 - 1000",
  "1000+",
];

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("eventflowUser") || "null");
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

function getVenueImage(venue) {
  if (venue?.coverImage) return venue.coverImage;
  if (venue?.image) return venue.image;
  if (venue?.imageUrl) return venue.imageUrl;
  if (venue?.photo) return venue.photo;

  if (Array.isArray(venue?.images) && venue.images.length > 0) {
    return venue.images[0];
  }

  if (Array.isArray(venue?.photos) && venue.photos.length > 0) {
    return venue.photos[0];
  }

  return null;
}

function formatPrice(price) {
  const amount = Number(price || 0);

  if (!amount) return "Contact owner";

  return `GH₵${amount.toLocaleString()}`;
}

export default function Venues() {
  const [venues, setVenues] = useState([]);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("Event type");
  const [capacity, setCapacity] = useState("Guest capacity");
  const [sortBy, setSortBy] = useState("Recommended");
  const [savedItems, setSavedItems] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const user = getCurrentUser();

  /*
   * Load approved venues.
   */
  useEffect(() => {
    const loadVenues = () => {
      try {
        const savedVenues = JSON.parse(
          localStorage.getItem("eventflowVenues") || "[]"
        );

        const approvedVenues = savedVenues.filter(
          (venue) => venue.status === "approved"
        );

        setVenues(approvedVenues);
      } catch (error) {
        console.error("Failed to load venues:", error);
        setVenues([]);
      }
    };

    loadVenues();

    window.addEventListener("eventflow-venues-updated", loadVenues);
    window.addEventListener("storage", loadVenues);

    return () => {
      window.removeEventListener("eventflow-venues-updated", loadVenues);
      window.removeEventListener("storage", loadVenues);
    };
  }, []);

  /*
   * Load saved venues for the current organizer.
   */
  useEffect(() => {
    const loadSavedItems = () => {
      const currentUser = getCurrentUser();

      if (!currentUser?.email) {
        setSavedItems([]);
        return;
      }

      setSavedItems(getSavedItems(currentUser.email));
    };

    loadSavedItems();

    window.addEventListener("eventflow-saved-items-updated", loadSavedItems);
    window.addEventListener("eventflow-auth-changed", loadSavedItems);
    window.addEventListener("storage", loadSavedItems);

    return () => {
      window.removeEventListener(
        "eventflow-saved-items-updated",
        loadSavedItems
      );
      window.removeEventListener("eventflow-auth-changed", loadSavedItems);
      window.removeEventListener("storage", loadSavedItems);
    };
  }, []);

  const isVenueSaved = (venueId) => {
    return savedItems.some(
      (item) =>
        String(item.id) === String(venueId) && item.type === "venue"
    );
  };

  /*
   * Save / unsave a venue.
   */
  const toggleSaveVenue = (venue) => {
    const currentUser = getCurrentUser();

    if (!currentUser?.email) {
      window.alert("Please sign in to save venues.");
      return;
    }

    const storageKey = `${SAVED_ITEMS_PREFIX}${String(
      currentUser.email
    ).toLowerCase()}`;

    const existing = getSavedItems(currentUser.email);

    const alreadySaved = existing.some(
      (item) =>
        String(item.id) === String(venue.id) && item.type === "venue"
    );

    let updated;

    if (alreadySaved) {
      updated = existing.filter(
        (item) =>
          !(
            String(item.id) === String(venue.id) &&
            item.type === "venue"
          )
      );
    } else {
      updated = [
        ...existing,
        {
          id: venue.id,
          type: "venue",
          name: venue.name || venue.businessName || "Venue",
          businessName: venue.businessName || venue.name || "Venue",
          location: venue.location || "",
          venueType: venue.venueType || "Event Venue",
          capacity: venue.capacity || 0,
          price: venue.price || 0,
          image: getVenueImage(venue),
          savedAt: new Date().toISOString(),
        },
      ];
    }

    localStorage.setItem(storageKey, JSON.stringify(updated));
    setSavedItems(updated);

    window.dispatchEvent(
      new Event("eventflow-saved-items-updated")
    );
  };

  /*
   * Filter and sort venues.
   */
  const filteredVenues = useMemo(() => {
    let result = [...venues];

    /*
     * Search
     */
    if (search.trim()) {
      const query = search.trim().toLowerCase();

      result = result.filter((venue) =>
        [
          venue.name,
          venue.businessName,
          venue.location,
          venue.city,
          venue.region,
          venue.venueType,
          venue.description,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          )
      );
    }

    /*
     * Event type
     */
    if (eventType !== "Event type") {
      const type = eventType.toLowerCase();

      result = result.filter((venue) => {
        const venueType = String(
          venue.venueType || ""
        ).toLowerCase();

        const description = String(
          venue.description || ""
        ).toLowerCase();

        const supportedTypes = Array.isArray(
          venue.eventTypes
        )
          ? venue.eventTypes
              .map((item) => String(item).toLowerCase())
              .join(" ")
          : String(venue.eventTypes || "").toLowerCase();

        return (
          venueType.includes(type) ||
          description.includes(type) ||
          supportedTypes.includes(type) ||
          type.includes(venueType)
        );
      });
    }

    /*
     * Guest capacity
     */
    if (capacity !== "Guest capacity") {
      result = result.filter((venue) => {
        const venueCapacity = Number(venue.capacity || 0);

        if (capacity === "50 - 100") {
          return venueCapacity >= 50 && venueCapacity <= 100;
        }

        if (capacity === "100 - 300") {
          return venueCapacity > 100 && venueCapacity <= 300;
        }

        if (capacity === "300 - 500") {
          return venueCapacity > 300 && venueCapacity <= 500;
        }

        if (capacity === "500 - 1000") {
          return venueCapacity > 500 && venueCapacity <= 1000;
        }

        if (capacity === "1000+") {
          return venueCapacity > 1000;
        }

        return true;
      });
    }

    /*
     * Sorting
     *
     * Only use rating when the venue actually has one.
     * No artificial ratings are created.
     */
    if (sortBy === "Highest rated") {
      result.sort(
        (a, b) =>
          Number(b.rating || 0) - Number(a.rating || 0)
      );
    }

    if (sortBy === "Lowest price") {
      result.sort(
        (a, b) =>
          Number(a.price || 0) - Number(b.price || 0)
      );
    }

    if (sortBy === "Highest capacity") {
      result.sort(
        (a, b) =>
          Number(b.capacity || 0) - Number(a.capacity || 0)
      );
    }

    return result;
  }, [
    venues,
    search,
    eventType,
    capacity,
    sortBy,
  ]);

  const clearFilters = () => {
    setSearch("");
    setEventType("Event type");
    setCapacity("Guest capacity");
    setSortBy("Recommended");
  };

  const hasActiveFilters =
    search.trim() ||
    eventType !== "Event type" ||
    capacity !== "Guest capacity";

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-gray-950">
      <Navbar />

      <main>
        {/* =====================================================
            HERO
        ====================================================== */}
        <section className="relative overflow-hidden bg-gray-950">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-indigo-300 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                EventFlow Venues
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Find a venue that fits your event.
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
                Explore approved venues across Ghana and compare
                spaces by location, guest capacity, event type and
                starting price.
              </p>
            </div>

            {/* Search panel */}
            <div className="relative mt-10 rounded-3xl border border-white/10 bg-white p-3 shadow-2xl shadow-black/20">
              <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
                {/* Search */}
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-4-4" />
                    </svg>
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search venue or location"
                    className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                {/* Event type */}
                <select
                  value={eventType}
                  onChange={(e) =>
                    setEventType(e.target.value)
                  }
                  className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option>Event type</option>

                  {EVENT_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>

                {/* Capacity */}
                <select
                  value={capacity}
                  onChange={(e) =>
                    setCapacity(e.target.value)
                  }
                  className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                >
                  {CAPACITY_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById("venue-results")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }}
                  className="h-14 rounded-2xl bg-indigo-600 px-7 text-sm font-bold text-white transition hover:bg-indigo-700 active:scale-[0.98]"
                >
                  Search Venues
                </button>
              </div>

              {/* Mobile filter button */}
              <div className="mt-3 lg:hidden">
                <button
                  type="button"
                  onClick={() =>
                    setShowMobileFilters(
                      (current) => !current
                    )
                  }
                  className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 6h16M7 12h10M10 18h4" />
                    </svg>
                    More filters
                  </span>

                  <span className="text-gray-400">
                    {showMobileFilters ? "−" : "+"}
                  </span>
                </button>

                {showMobileFilters && (
                  <div className="mt-3 grid gap-3 border-t border-gray-100 pt-3">
                    <select
                      value={eventType}
                      onChange={(e) =>
                        setEventType(e.target.value)
                      }
                      className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none focus:border-indigo-500"
                    >
                      <option>Event type</option>

                      {EVENT_TYPES.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>

                    <select
                      value={capacity}
                      onChange={(e) =>
                        setCapacity(e.target.value)
                      }
                      className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none focus:border-indigo-500"
                    >
                      {CAPACITY_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            RESULTS
        ====================================================== */}
        <section
          id="venue-results"
          className="mx-auto max-w-7xl scroll-mt-24 px-5 py-10 sm:px-6 lg:px-8 lg:py-14"
        >
          {/* Results header */}
          <div className="flex flex-col gap-5 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                  {filteredVenues.length}{" "}
                  {filteredVenues.length === 1
                    ? "venue"
                    : "venues"}
                </span>

                {hasActiveFilters && (
                  <span className="text-xs font-medium text-gray-400">
                    Filtered results
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                Available venues
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Spaces ready to be discovered for your next event.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                >
                  Clear filters
                </button>
              )}

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-9 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-indigo-500"
                >
                  <option>Recommended</option>
                  <option>Highest rated</option>
                  <option>Lowest price</option>
                  <option>Highest capacity</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="mt-5 flex flex-wrap gap-2">
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm"
                >
                  Search: {search}
                  <span className="text-gray-400">
                    ×
                  </span>
                </button>
              )}

              {eventType !== "Event type" && (
                <button
                  type="button"
                  onClick={() =>
                    setEventType("Event type")
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm"
                >
                  {eventType}
                  <span className="text-gray-400">
                    ×
                  </span>
                </button>
              )}

              {capacity !== "Guest capacity" && (
                <button
                  type="button"
                  onClick={() =>
                    setCapacity("Guest capacity")
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm"
                >
                  {capacity} guests
                  <span className="text-gray-400">
                    ×
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Venue cards */}
          {filteredVenues.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredVenues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  saved={isVenueSaved(venue.id)}
                  onToggleSave={() =>
                    toggleSaveVenue(venue)
                  }
                />
              ))}
            </div>
          ) : (
            <section className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-white">
              <div className="flex flex-col items-center px-6 py-20 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-9 w-9 text-indigo-500"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V8l7-4 7 4v13" />
                    <path d="M9 21v-4h6v4" />
                    <path d="M8 10h.01M12 10h.01M16 10h.01M8 13h.01M16 13h.01" />
                  </svg>
                </div>

                <h3 className="mt-6 text-xl font-bold text-gray-950">
                  No venues found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                  We couldn't find an approved venue matching
                  your current search and filters.
                </p>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-6 rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-600"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </section>
          )}
        </section>

        {/* =====================================================
            VENUE OWNER CTA
        ====================================================== */}
        <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 lg:px-8 lg:pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-gray-950 px-6 py-10 sm:px-10 sm:py-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />

            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-400">
                  Venue owners
                </span>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Turn your venue into a business opportunity.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-gray-300">
                  List your space on EventFlow, showcase what
                  makes it unique and connect with organizers
                  searching for venues across Ghana.
                </p>
              </div>

              <Link
                to="/register/venue"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-gray-950 transition hover:bg-indigo-50"
              >
                Register Your Venue
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
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ============================================================
   VENUE CARD
============================================================ */

function VenueCard({ venue, saved, onToggleSave }) {
  const image = getVenueImage(venue);

  const venueName =
    venue.name ||
    venue.businessName ||
    "Event Venue";

  const location =
    venue.location ||
    venue.city ||
    "Location not provided";

  const venueType =
    venue.venueType ||
    "Event Venue";

  const capacity = Number(venue.capacity || 0);

  const price = Number(venue.price || 0);

  return (
    <article className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl">
      {/* Image */}
      <div className="relative h-60 overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-gray-100">
        {image ? (
          <img
            src={image}
            alt={venueName}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-9 w-9 text-indigo-500"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 21h18" />
                <path d="M5 21V8l7-4 7 4v13" />
                <path d="M9 21v-4h6v4" />
                <path d="M8 10h.01M12 10h.01M16 10h.01M8 13h.01M12 13h.01M16 13h.01" />
              </svg>
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent" />

        {/* Verified */}
        <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-indigo-700 shadow-lg">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] text-white">
            ✓
          </span>
          Verified Venue
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={onToggleSave}
          className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur transition ${
            saved
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-white/60 bg-white/90 text-gray-700 hover:bg-white"
          }`}
          aria-label={
            saved ? "Remove saved venue" : "Save venue"
          }
          title={
            saved ? "Remove from saved" : "Save venue"
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill={saved ? "currentColor" : "none"}
            className="h-5 w-5"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M20.8 8.8c0 5.5-8.8 10.3-8.8 10.3S3.2 14.3 3.2 8.8A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.7Z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-gray-950">
              {venueName}
            </h3>

            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-3.5 w-3.5 shrink-0 text-gray-400"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z" />
                <circle cx="12" cy="9" r="2.2" />
              </svg>

              <span className="truncate">
                {location}
              </span>
            </p>
          </div>

          {venue.rating ? (
            <div className="shrink-0 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
              ★ {venue.rating}
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gray-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Venue type
            </p>

            <p className="mt-1.5 truncate text-xs font-semibold text-gray-800">
              {venueType}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Capacity
            </p>

            <p className="mt-1.5 text-xs font-semibold text-gray-800">
              {capacity > 0
                ? `${capacity.toLocaleString()} guests`
                : "Not specified"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-gray-100 pt-5">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Starting from
            </p>

            <p className="mt-1 truncate text-base font-bold text-gray-950">
              {formatPrice(price)}
            </p>

            {price > 0 && (
              <p className="mt-0.5 text-[10px] text-gray-400">
                Final price confirmed with owner
              </p>
            )}
          </div>

          <Link
            to={`/venues/${venue.id}`}
            className="inline-flex shrink-0 items-center rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-600"
          >
            View Venue
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="ml-1.5 h-3.5 w-3.5"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}