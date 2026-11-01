import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";

const BOOKINGS_KEY = "eventflowBookings";

const EVENT_TYPES = [
  "Wedding",
  "Engagement",
  "Birthday",
  "Funeral",
  "Naming Ceremony",
  "Graduation",
  "Corporate Event",
  "Conference",
  "Church Event",
  "Party",
  "Other",
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

function getStoredVenues() {
  try {
    const venues = JSON.parse(
      localStorage.getItem("eventflowVenues") || "[]"
    );

    return Array.isArray(venues) ? venues : [];
  } catch {
    return [];
  }
}

function formatPrice(value) {
  const amount = Number(value || 0);

  if (!amount) {
    return "Price on request";
  }

  return `GH₵${amount.toLocaleString("en-GH")}`;
}

function getVenueName(venue) {
  return (
    venue?.name ||
    venue?.businessName ||
    venue?.venueName ||
    "Event Venue"
  );
}

function getVenueImages(venue) {
  if (!venue) {
    return [];
  }

  const possibleImages = [];

  // New gallery format
  if (Array.isArray(venue.images)) {
    possibleImages.push(...venue.images);
  }

  if (Array.isArray(venue.photos)) {
    possibleImages.push(...venue.photos);
  }

  // Older/single-image formats
  possibleImages.push(
    venue.coverImage,
    venue.image,
    venue.imageUrl,
    venue.photo,
    venue.thumbnail
  );

  const uniqueImages = [];

  for (const image of possibleImages) {
    if (
      typeof image === "string" &&
      image.trim() &&
      !uniqueImages.includes(image)
    ) {
      uniqueImages.push(image);
    }
  }

  return uniqueImages;
}

export default function VenueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [formData, setFormData] = useState({
    eventName: "",
    eventType: "",
    eventDate: "",
    eventTime: "",
    guestCount: "",
    message: "",
  });

  /*
   * ============================================================
   * LOAD VENUE
   * ============================================================
   */

  const loadVenue = () => {
    try {
      const savedVenues = getStoredVenues();

      const foundVenue = savedVenues.find(
        (item) => String(item.id) === String(id)
      );

      if (!foundVenue || foundVenue.status !== "approved") {
        setVenue(null);
      } else {
        setVenue(foundVenue);
      }
    } catch (err) {
      console.error("Failed to load venue:", err);
      setVenue(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenue();
  }, [id]);

  /*
   * ============================================================
   * LISTEN FOR VENUE UPDATES
   * ============================================================
   */

  useEffect(() => {
    const handleUpdate = () => {
      loadVenue();
    };

    window.addEventListener(
      "eventflow-venues-updated",
      handleUpdate
    );

    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(
        "eventflow-venues-updated",
        handleUpdate
      );

      window.removeEventListener("storage", handleUpdate);
    };
  }, [id]);

  /*
   * ============================================================
   * VENUE DATA
   * ============================================================
   */

  const venueName = useMemo(
    () => getVenueName(venue),
    [venue]
  );

  const venueType = venue?.venueType || "Event Venue";

  const venueLocation =
    venue?.location || "Location not provided";

  const venueCapacity = Number(venue?.capacity || 0);

  const venuePrice = Number(venue?.price || 0);

  const venueImages = useMemo(
    () => getVenueImages(venue),
    [venue]
  );

  const venueImage =
    venueImages[activeImageIndex] ||
    venueImages[0] ||
    "";

  const venueDescription =
    venue?.description ||
    "This venue has been approved and listed on EventFlow. Contact the venue owner for more information about availability, pricing and event arrangements.";

  /*
   * ============================================================
   * RESET GALLERY WHEN VENUE CHANGES
   * ============================================================
   */

  useEffect(() => {
    setActiveImageIndex(0);
    setLightboxOpen(false);
  }, [venue]);

  /*
   * ============================================================
   * SAVED VENUE
   * ============================================================
   */

  useEffect(() => {
    const user = getCurrentUser();

    if (!user?.email || !venue) {
      setSaved(false);
      return;
    }

    try {
      const key = `eventflowSavedItems_${user.email.toLowerCase()}`;

      const items = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      if (!Array.isArray(items)) {
        setSaved(false);
        return;
      }

      const isSaved = items.some(
        (item) =>
          String(item.id) === String(venue.id) &&
          item.type === "venue"
      );

      setSaved(isSaved);
    } catch {
      setSaved(false);
    }
  }, [venue]);

  const handleSaveVenue = () => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    const key = `eventflowSavedItems_${currentUser.email.toLowerCase()}`;

    try {
      const existing = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      const savedItems = Array.isArray(existing)
        ? existing
        : [];

      const alreadySaved = savedItems.some(
        (item) =>
          String(item.id) === String(venue.id) &&
          item.type === "venue"
      );

      let updatedItems;

      if (alreadySaved) {
        updatedItems = savedItems.filter(
          (item) =>
            !(
              String(item.id) === String(venue.id) &&
              item.type === "venue"
            )
        );

        setSaved(false);
      } else {
        updatedItems = [
          ...savedItems,
          {
            id: venue.id,
            type: "venue",
            name: venueName,
            location: venueLocation,
            category: venueType,
            image: venueImage,
            savedAt: new Date().toISOString(),
          },
        ];

        setSaved(true);
      }

      localStorage.setItem(
        key,
        JSON.stringify(updatedItems)
      );

      window.dispatchEvent(
        new Event("eventflow-saved-items-updated")
      );
    } catch (err) {
      console.error("Failed to save venue:", err);
      alert("Unable to update saved venue.");
    }
  };

  /*
   * ============================================================
   * GALLERY CONTROLS
   * ============================================================
   */

  const openGallery = (index = 0) => {
    if (!venueImages.length) {
      return;
    }

    setActiveImageIndex(index);
    setLightboxOpen(true);
  };

  const closeGallery = () => {
    setLightboxOpen(false);
  };

  const showNextImage = () => {
    if (!venueImages.length) {
      return;
    }

    setActiveImageIndex(
      (previous) =>
        (previous + 1) % venueImages.length
    );
  };

  const showPreviousImage = () => {
    if (!venueImages.length) {
      return;
    }

    setActiveImageIndex(
      (previous) =>
        (previous - 1 + venueImages.length) %
        venueImages.length
    );
  };

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    const handleKeyboard = (event) => {
      if (event.key === "Escape") {
        closeGallery();
      }

      if (event.key === "ArrowRight") {
        showNextImage();
      }

      if (event.key === "ArrowLeft") {
        showPreviousImage();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyboard
    );

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyboard
      );

      document.body.style.overflow =
        originalOverflow;
    };
  }, [lightboxOpen, venueImages.length]);

  /*
   * ============================================================
   * FORM
   * ============================================================
   */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  /*
   * ============================================================
   * START BOOKING
   * ============================================================
   */

  const handleRequestVenue = () => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser.accountType !== "organizer") {
      alert("Only organizers can request a venue.");
      return;
    }

    setError("");
    setShowBookingForm(true);

    setTimeout(() => {
      document
        .getElementById("booking-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  /*
   * ============================================================
   * SUBMIT VENUE REQUEST
   * ============================================================
   */

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");

    const currentUser = getCurrentUser();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser.accountType !== "organizer") {
      setError("Only organizers can request a venue.");
      return;
    }

    if (
      !formData.eventName.trim() ||
      !formData.eventType ||
      !formData.eventDate ||
      !formData.eventTime ||
      !formData.guestCount
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const guestCount = Number(formData.guestCount);

    if (guestCount <= 0) {
      setError("Guest count must be greater than zero.");
      return;
    }

    if (
      venueCapacity &&
      guestCount > venueCapacity
    ) {
      setError(
        `This venue can accommodate up to ${venueCapacity.toLocaleString()} guests.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const organizerName =
        currentUser.firstName &&
        currentUser.lastName
          ? `${currentUser.firstName} ${currentUser.lastName}`
          : currentUser.firstName ||
            currentUser.name ||
            "Event Organizer";

      const bookingId = `EF-BOOK-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`;

      const now = new Date().toISOString();

      /*
       * Keep venue bookings compatible with the existing
       * EventFlow booking / quotation system.
       */

      const booking = {
        id: bookingId,

        /* Venue */
        venueId: venue.id,
        venueName,
        venueEmail:
          venue.email ||
          venue.ownerEmail ||
          "",
        venuePhone: venue.phone || "",
        venueOwnerId: venue.ownerId || "",
        venueOwnerName:
          venue.ownerName || "",

        /* Compatibility with provider dashboards */
        vendorId: venue.id,
        vendorName: venueName,
        vendorEmail:
          venue.email ||
          venue.ownerEmail ||
          "",
        vendorPhone: venue.phone || "",
        vendorType: "Venue",

        /* Service */
        serviceId: `venue_${venue.id}`,
        serviceName: venueName,
        serviceCategory: venueType,
        price: venuePrice,
        pricingType: "Starting from",

        /* Event */
        eventName: formData.eventName.trim(),
        eventType: formData.eventType,
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        guestCount,
        location: venueLocation,
        message: formData.message.trim(),

        /* Organizer */
        organizerId: currentUser.id || "",
        organizerName,
        organizerEmail:
          currentUser.email || "",
        organizerPhone:
          currentUser.phone || "",

        /* Booking */
        status: "pending",
        createdAt: now,
        updatedAt: now,

        /*
         * Payment remains unset until both sides agree
         * on a quotation.
         */
        paymentStatus: "unpaid",
        paymentOption: "",
        amountPaid: 0,
        remainingBalance: 0,
      };

      /*
       * ========================================================
       * CANONICAL BOOKINGS
       * ========================================================
       */

      let existingBookings = [];

      try {
        existingBookings = JSON.parse(
          localStorage.getItem(BOOKINGS_KEY) || "[]"
        );
      } catch {
        existingBookings = [];
      }

      const updatedBookings = [
        ...existingBookings,
        booking,
      ];

      localStorage.setItem(
        BOOKINGS_KEY,
        JSON.stringify(updatedBookings)
      );

      /*
       * ========================================================
       * ORGANIZER BOOKINGS
       * ========================================================
       */

      let organizerBookings = [];

      try {
        organizerBookings = JSON.parse(
          localStorage.getItem(
            "eventflowOrganizerBookings"
          ) || "[]"
        );
      } catch {
        organizerBookings = [];
      }

      localStorage.setItem(
        "eventflowOrganizerBookings",
        JSON.stringify([
          ...organizerBookings,
          booking,
        ])
      );

      /*
       * ========================================================
       * VENUE OWNER BOOKINGS
       * ========================================================
       */

      if (venue.email || venue.ownerEmail) {
        const venueEmail = (
          venue.email ||
          venue.ownerEmail ||
          ""
        ).toLowerCase();

        const venueBookingKey =
          `eventflowVendorBookings_${venueEmail}`;

        let venueBookings = [];

        try {
          venueBookings = JSON.parse(
            localStorage.getItem(
              venueBookingKey
            ) || "[]"
          );
        } catch {
          venueBookings = [];
        }

        localStorage.setItem(
          venueBookingKey,
          JSON.stringify([
            ...venueBookings,
            booking,
          ])
        );
      }

      /*
       * ========================================================
       * LATEST BOOKING
       * ========================================================
       */

      localStorage.setItem(
        "eventflowLatestBooking",
        JSON.stringify(booking)
      );

      /*
       * ========================================================
       * EVENTS
       * ========================================================
       */

      window.dispatchEvent(
        new Event("eventflow-bookings-updated")
      );

      window.dispatchEvent(
        new Event("eventflow-booking-created")
      );

      navigate(
        `/booking-success/${bookingId}`
      );
    } catch (err) {
      console.error(
        "Failed to create venue booking:",
        err
      );

      setError(
        "Something went wrong while creating your booking request."
      );

      setSubmitting(false);
    }
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-500">
              Loading venue...
            </p>
          </div>
        </main>
      </div>
    );
  }

  /*
   * ============================================================
   * NOT FOUND
   * ============================================================
   */

  if (!venue) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <main className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-5 py-12">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-3xl">
              🏛️
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              EventFlow Venues
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Venue not found
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              This venue may have been removed, is no longer
              available, or has not yet been approved by EventFlow.
            </p>

            <Link
              to="/venues"
              className="mt-7 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              ← Browse venues
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
        {/* =====================================================
            BREADCRUMB
        ====================================================== */}

        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/venues"
            className="font-semibold text-slate-500 transition hover:text-indigo-600"
          >
            Venues
          </Link>

          <span className="text-slate-300">/</span>

          <span className="truncate font-semibold text-slate-900">
            {venueName}
          </span>
        </div>

        {/* =====================================================
            VENUE HERO / GALLERY
        ====================================================== */}

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          {/* GALLERY HERO */}

          <div className="relative h-72 overflow-hidden bg-slate-950 sm:h-96 lg:h-[500px]">
            {venueImages.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    openGallery(activeImageIndex)
                  }
                  className="group absolute inset-0 z-10 block h-full w-full cursor-zoom-in"
                  aria-label="Open venue gallery"
                >
                  <img
                    src={venueImage}
                    alt={`${venueName} venue`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />

                  <div className="absolute right-5 top-20 hidden rounded-xl bg-black/30 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition group-hover:bg-black/50 sm:block">
                    Click to view gallery
                  </div>
                </button>

                {/* Gallery count */}

                {venueImages.length > 1 && (
                  <div className="pointer-events-none absolute bottom-5 right-5 z-20 rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs font-bold text-white backdrop-blur-md">
                    📷 {activeImageIndex + 1} /{" "}
                    {venueImages.length}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.5),_transparent_45%),linear-gradient(115deg,_#020617,_#1e1b4b,_#4338ca)]" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/10 bg-white/10 text-6xl shadow-2xl backdrop-blur-sm sm:h-36 sm:w-36 sm:text-7xl">
                    🏛️
                  </div>
                </div>

                <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />

                <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border border-white/10" />
              </>
            )}

            {/* Back */}

            <div className="absolute left-5 top-5 z-30 sm:left-7 sm:top-7">
              <Link
                to="/venues"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/25 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-black/40"
              >
                ← Venues
              </Link>
            </div>

            {/* Verified */}

            <div className="absolute right-5 top-5 z-30 sm:right-7 sm:top-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                EventFlow Verified
              </div>
            </div>

            {/* Hero title */}

            <div className="absolute bottom-6 left-5 right-5 z-30 sm:bottom-8 sm:left-8 sm:right-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                  {venueType}
                </span>

                <span className="rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-bold text-white">
                  ✓ Approved
                </span>
              </div>

              <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {venueName}
              </h1>

              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white/80 sm:text-base">
                <span>📍</span>
                {venueLocation}
              </p>
            </div>
          </div>

          {/* ===================================================
              GALLERY THUMBNAILS
          ==================================================== */}

          {venueImages.length > 1 && (
            <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {venueImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() =>
                      setActiveImageIndex(index)
                    }
                    className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-24 sm:w-32 ${
                      index === activeImageIndex
                        ? "border-indigo-600 ring-2 ring-indigo-100"
                        : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${venueName} gallery ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Cover
                      </span>
                    )}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    openGallery(activeImageIndex)
                  }
                  className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:h-24 sm:w-32"
                >
                  View all
                </button>
              </div>
            </div>
          )}

          {/* HERO DETAILS */}

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                  Event venue
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  A place for your next event
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  Explore the venue details and photo gallery below.
                  When you're ready, send a booking request and let
                  the venue owner review your event requirements.
                </p>
              </div>

              {/* PRICE */}

              <div className="shrink-0 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 lg:min-w-[220px]">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Starting from
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-950">
                  {venuePrice > 0
                    ? formatPrice(venuePrice)
                    : "Contact owner"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Final price confirmed after requirements review
                </p>
              </div>
            </div>

            {/* INFORMATION */}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <VenueInfoCard
                icon="🏛️"
                label="Venue type"
                value={venueType}
              />

              <VenueInfoCard
                icon="👥"
                label="Capacity"
                value={
                  venueCapacity > 0
                    ? `${venueCapacity.toLocaleString()} guests`
                    : "Not specified"
                }
              />

              <VenueInfoCard
                icon="📍"
                label="Location"
                value={venueLocation}
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
          {/* ===================================================
              LEFT
          ==================================================== */}

          <div className="min-w-0 space-y-8">
            {/* PHOTO GALLERY */}

            {venueImages.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                      Venue gallery
                    </p>

                    <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                      Explore the space
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      View photos uploaded by the venue owner.
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                    {venueImages.length} photo
                    {venueImages.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {venueImages.map((image, index) => (
                    <button
                      key={`${image}-${index}-gallery`}
                      type="button"
                      onClick={() =>
                        openGallery(index)
                      }
                      className={`group relative overflow-hidden rounded-2xl bg-slate-100 text-left ${
                        index === 0
                          ? "col-span-2 aspect-[16/9] sm:col-span-2"
                          : "aspect-[4/3]"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${venueName} photo ${index + 1}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 transition group-hover:opacity-100">
                        <span className="rounded-lg bg-black/50 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                          View photo
                        </span>

                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-sm text-slate-900">
                          ↗
                        </span>
                      </div>

                      {index === 0 && (
                        <span className="absolute left-3 top-3 rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                          Cover photo
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ABOUT */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg">
                  ✦
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    About the venue
                  </p>

                  <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                    Venue overview
                  </h2>
                </div>
              </div>

              <p className="mt-6 text-sm leading-7 text-slate-600">
                {venueDescription}
              </p>
            </section>

            {/* VENUE HIGHLIGHTS */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                Venue information
              </p>

              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                Everything you need to know
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Highlight
                  icon="👥"
                  title="Guest capacity"
                  text={
                    venueCapacity
                      ? `Suitable for up to ${venueCapacity.toLocaleString()} guests.`
                      : "Capacity information has not been provided."
                  }
                />

                <Highlight
                  icon="📍"
                  title="Event location"
                  text={venueLocation}
                />

                <Highlight
                  icon="🏛️"
                  title="Venue category"
                  text={venueType}
                />

                <Highlight
                  icon="✓"
                  title="EventFlow approval"
                  text="This venue has been reviewed and approved for public listing."
                />
              </div>
            </section>

            {/* OWNER */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                  🏢
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    Venue provider
                  </p>

                  <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                    Venue owner
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <OwnerInfo
                  label="Owner"
                  value={
                    venue.ownerName ||
                    "Venue Owner"
                  }
                  icon="👤"
                />

                <OwnerInfo
                  label="Contact"
                  value={
                    venue.phone ||
                    "Contact through EventFlow"
                  }
                  icon="☎"
                />

                {venue.email && (
                  <OwnerInfo
                    label="Email"
                    value={venue.email}
                    icon="✉"
                  />
                )}
              </div>
            </section>

            {/* BOOKING FORM */}

            {showBookingForm ? (
              <section
                id="booking-form"
                className="overflow-hidden rounded-3xl border border-indigo-100 bg-indigo-50"
              >
                <div className="border-b border-indigo-100 bg-white/60 p-6 sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    Booking request
                  </p>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                    Request {venueName}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Tell the venue owner about your event. They can
                    review your requirements and respond with a
                    quotation.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="p-6 sm:p-8"
                >
                  {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
                      <span>!</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      label="Event name"
                      required
                    >
                      <input
                        type="text"
                        name="eventName"
                        value={formData.eventName}
                        onChange={handleChange}
                        placeholder="e.g. Christopher & Ama Wedding"
                        className="form-input"
                      />
                    </Field>

                    <Field
                      label="Event type"
                      required
                    >
                      <select
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleChange}
                        className="form-input"
                      >
                        <option value="">
                          Select event type
                        </option>

                        {EVENT_TYPES.map((type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {type}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field
                      label="Event date"
                      required
                    >
                      <input
                        type="date"
                        name="eventDate"
                        value={formData.eventDate}
                        onChange={handleChange}
                        min={
                          new Date()
                            .toISOString()
                            .split("T")[0]
                        }
                        className="form-input"
                      />
                    </Field>

                    <Field
                      label="Event time"
                      required
                    >
                      <input
                        type="time"
                        name="eventTime"
                        value={formData.eventTime}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </Field>

                    <Field
                      label="Number of guests"
                      required
                      hint={
                        venueCapacity
                          ? `Maximum ${venueCapacity.toLocaleString()} guests`
                          : ""
                      }
                    >
                      <input
                        type="number"
                        name="guestCount"
                        value={formData.guestCount}
                        onChange={handleChange}
                        min="1"
                        max={
                          venueCapacity || undefined
                        }
                        placeholder="e.g. 200"
                        className="form-input"
                      />
                    </Field>

                    <Field label="Venue location">
                      <input
                        type="text"
                        value={venueLocation}
                        readOnly
                        className="form-input cursor-default bg-slate-100 text-slate-500"
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field label="Message to venue owner">
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows="5"
                          placeholder="Tell the venue owner anything important about your event, setup requirements, expected guests, or special arrangements..."
                          className="form-input resize-none"
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Sending request...
                        </>
                      ) : (
                        <>
                          Send venue request
                          <span>→</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setShowBookingForm(false);
                        setError("");
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>

                  <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                    Your request does not automatically confirm the
                    venue. The venue owner must review and respond.
                  </p>
                </form>
              </section>
            ) : (
              <section className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                      Interested in this venue?
                    </p>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                      Start your booking request
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                      Share your event details and let the venue
                      owner review your requirements.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestVenue}
                    className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    Request this venue →
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* ===================================================
              RIGHT
          ==================================================== */}

          <aside className="space-y-6">
            {/* BOOKING CARD */}

            <section className="sticky top-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-950 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300">
                  Reserve your date
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {venueName}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Send a request with your event details and receive
                  a response from the venue owner.
                </p>
              </div>

              <div className="p-6">
                <div className="flex items-end justify-between border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Starting from
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-950">
                      {venuePrice > 0
                        ? formatPrice(venuePrice)
                        : "On request"}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    Approved
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRequestVenue}
                  className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  Request this venue →
                </button>

                <button
                  type="button"
                  onClick={handleSaveVenue}
                  className={`mt-3 w-full rounded-xl border px-5 py-3 text-sm font-bold transition ${
                    saved
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  {saved
                    ? "♥ Saved venue"
                    : "♡ Save venue"}
                </button>

                <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                  Final pricing is confirmed after the venue reviews
                  your event requirements.
                </p>
              </div>
            </section>

            {/* VENUE QUICK FACTS */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-slate-950">
                Venue details
              </h2>

              <div className="mt-5 space-y-4">
                <DetailRow
                  icon="🏛️"
                  label="Venue type"
                  value={venueType}
                />

                <DetailRow
                  icon="👥"
                  label="Capacity"
                  value={
                    venueCapacity
                      ? `${venueCapacity.toLocaleString()} guests`
                      : "Not specified"
                  }
                />

                <DetailRow
                  icon="📍"
                  label="Location"
                  value={venueLocation}
                />

                <DetailRow
                  icon="📷"
                  label="Photos"
                  value={
                    venueImages.length
                      ? `${venueImages.length} available`
                      : "No photos"
                  }
                />

                <DetailRow
                  icon="✓"
                  label="Status"
                  value="EventFlow approved"
                />
              </div>
            </section>

            {/* TRUST */}

            <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                ✓
              </div>

              <h3 className="mt-4 font-bold text-slate-950">
                Verified by EventFlow
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                This venue has been approved by EventFlow and is
                available for organizers to discover and request.
              </p>
            </section>

            {/* BOOKING PROCESS */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                How booking works
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-950">
                Simple and transparent
              </h2>

              <div className="mt-5 space-y-4">
                <MiniStep
                  number="01"
                  title="Send your request"
                  text="Share your event date, guest count and requirements."
                />

                <MiniStep
                  number="02"
                  title="Venue reviews"
                  text="The venue owner reviews your event details."
                />

                <MiniStep
                  number="03"
                  title="Agree on price"
                  text="Review the quotation before confirming the booking."
                />
              </div>
            </section>

            {/* DISCOVER MORE */}

            <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-400">
                Still exploring?
              </p>

              <h3 className="mt-3 text-xl font-bold">
                Find another venue
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Compare more approved venues and find a location
                that fits your event.
              </p>

              <Link
                to="/venues"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
              >
                Browse venues →
              </Link>
            </section>
          </aside>
        </section>
      </main>

      {/* =======================================================
          GALLERY LIGHTBOX
      ======================================================== */}

      {lightboxOpen && venueImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${venueName} photo gallery`}
          onClick={closeGallery}
        >
          {/* Close */}

          <button
            type="button"
            onClick={closeGallery}
            className="absolute right-4 top-4 z-[110] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xl text-white backdrop-blur-md transition hover:bg-white/20 sm:right-7 sm:top-7"
            aria-label="Close gallery"
          >
            ×
          </button>

          {/* Counter */}

          <div className="absolute left-4 top-5 z-[110] rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur-md sm:left-7 sm:top-7">
            {activeImageIndex + 1} /{" "}
            {venueImages.length}
          </div>

          {/* Main Image */}

          <div
            className="relative flex h-full w-full max-w-6xl items-center justify-center"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <img
              src={venueImages[activeImageIndex]}
              alt={`${venueName} photo ${
                activeImageIndex + 1
              }`}
              className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />

            {/* Previous */}

            {venueImages.length > 1 && (
              <button
                type="button"
                onClick={showPreviousImage}
                className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-2xl text-white backdrop-blur-md transition hover:bg-white/20 sm:left-4 sm:h-14 sm:w-14"
                aria-label="Previous image"
              >
                ‹
              </button>
            )}

            {/* Next */}

            {venueImages.length > 1 && (
              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-2xl text-white backdrop-blur-md transition hover:bg-white/20 sm:right-4 sm:h-14 sm:w-14"
                aria-label="Next image"
              >
                ›
              </button>
            )}

            {/* Bottom thumbnails */}

            {venueImages.length > 1 && (
              <div className="absolute bottom-0 left-1/2 flex max-w-full -translate-x-1/2 gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-2 backdrop-blur-md">
                {venueImages.map(
                  (image, index) => (
                    <button
                      type="button"
                      key={`lightbox-${image}-${index}`}
                      onClick={() =>
                        setActiveImageIndex(index)
                      }
                      className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-14 sm:w-20 ${
                        index === activeImageIndex
                          ? "border-white"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          SMALL FORM STYLES
      ======================================================== */}

      <style>{`
        .form-input {
          margin-top: 0.5rem;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          line-height: 1.5rem;
          color: rgb(15 23 42);
          outline: none;
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease;
        }

        .form-input::placeholder {
          color: rgb(148 163 184);
        }

        .form-input:focus {
          border-color: rgb(99 102 241);
          box-shadow: 0 0 0 3px rgb(224 231 255);
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   VENUE INFO CARD
============================================================ */

function VenueInfoCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-1 truncate text-sm font-bold text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HIGHLIGHT
============================================================ */

function Highlight({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-950">
        {title}
      </h3>

      <p className="mt-1.5 text-sm leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}

/* ============================================================
   OWNER INFO
============================================================ */

function OwnerInfo({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm shadow-sm">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-sm">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   MINI STEP
============================================================ */

function MiniStep({ number, title, text }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-[10px] font-bold text-white">
        {number}
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-950">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

function Field({
  label,
  required = false,
  hint = "",
  children,
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-700">
          {label}

          {required && (
            <span className="ml-1 text-indigo-600">
              *
            </span>
          )}
        </label>

        {hint && (
          <span className="text-xs text-slate-400">
            {hint}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}
