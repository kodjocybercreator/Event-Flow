import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { FadeIn } from "../components/ui/FadeIn";

const categories = [
  "All",
  "Venues",
  "Photography",
  "Videography",
  "Decoration",
  "DJ & Music",
  "Catering",
  "Transportation",
];

const categoryIcons = {
  Venues: "🏛️",
  Photography: "📸",
  Videography: "🎥",
  Decoration: "🎨",
  "DJ & Music": "🎧",
  Catering: "🍽️",
  Transportation: "🚐",
};

export default function Discover() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("recommended");

  const [venues, setVenues] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [services, setServices] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [saveMessage, setSaveMessage] = useState("");

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const organizerEmail =
    currentUser?.accountType === "organizer"
      ? currentUser.email?.toLowerCase()
      : null;

  const loadData = () => {
    try {
      const storedVenues = JSON.parse(
        localStorage.getItem("eventflowVenues") || "[]"
      );
      const storedAccounts = JSON.parse(
        localStorage.getItem("eventflowAccounts") || "[]"
      );
      const storedUser = JSON.parse(
        localStorage.getItem("eventflowUser") || "null"
      );

      setVenues(Array.isArray(storedVenues) ? storedVenues : []);
      setAccounts(Array.isArray(storedAccounts) ? storedAccounts : []);
      setCurrentUser(storedUser);

      const allServices = [];

      storedAccounts
        .filter(
          (account) =>
            account.accountType === "vendor" &&
            account.status === "approved"
        )
        .forEach((vendor) => {
          const vendorEmail = vendor.email?.toLowerCase();
          if (!vendorEmail) return;

          let vendorServices = [];
          try {
            vendorServices = JSON.parse(
              localStorage.getItem(`eventflowServices_${vendorEmail}`) ||
                "[]"
            );
          } catch {
            vendorServices = [];
          }

          if (!Array.isArray(vendorServices)) return;

          vendorServices.forEach((service) => {
            allServices.push({
              ...service,
              vendorId: vendor.id,
              vendorEmail: vendor.email,
              vendorName:
                vendor.firstName && vendor.lastName
                  ? `${vendor.firstName} ${vendor.lastName}`
                  : vendor.firstName ||
                    vendor.businessName ||
                    vendor.name ||
                    "Event Professional",
              vendorPhone: vendor.phone || "",
              vendorLocation:
                vendor.location || vendor.city || service.location || "",
              profileType: "vendor",
            });
          });
        });

      setServices(allServices);

      if (storedUser?.accountType === "organizer" && storedUser.email) {
        const key = `eventflowSavedItems_${storedUser.email.toLowerCase()}`;
        let storedSaved = [];
        try {
          storedSaved = JSON.parse(localStorage.getItem(key) || "[]");
        } catch {
          storedSaved = [];
        }
        setSavedItems(Array.isArray(storedSaved) ? storedSaved : []);
      } else {
        setSavedItems([]);
      }
    } catch (error) {
      console.error("Unable to load EventFlow discover data:", error);
      setVenues([]);
      setAccounts([]);
      setServices([]);
      setCurrentUser(null);
      setSavedItems([]);
    }
  };

  useEffect(() => {
    loadData();
    const refresh = () => loadData();
    window.addEventListener("eventflow-venues-updated", refresh);
    window.addEventListener("eventflow-auth-changed", refresh);
    window.addEventListener("eventflow-services-updated", refresh);
    window.addEventListener("eventflow-saved-items-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("eventflow-venues-updated", refresh);
      window.removeEventListener("eventflow-auth-changed", refresh);
      window.removeEventListener("eventflow-services-updated", refresh);
      window.removeEventListener("eventflow-saved-items-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const listings = useMemo(() => {
    const approvedVenues = venues
      .filter((venue) => venue.status === "approved")
      .map((venue) => ({
        id: venue.id,
        type: "Venues",
        icon: "🏛️",
        name: venue.name || venue.businessName || "Unnamed Venue",
        location: venue.location || venue.city || "Location not provided",
        rating: Number(venue.rating || 0),
        reviews: Number(venue.reviewCount || 0),
        price: Number(venue.price || 0),
        capacity: venue.capacity
          ? `Up to ${venue.capacity} guests`
          : "Capacity not provided",
        verified: true,
        profileType: "venue",
        description:
          venue.description ||
          "A professional event venue available through EventFlow.",
        image:
          venue.image ||
          venue.coverImage ||
          venue.photo ||
          venue.imageUrl ||
          "",
      }));

    const vendorListings = services.map((service) => {
      const serviceCategory =
        service.category ||
        service.serviceCategory ||
        service.type ||
        "Other";
      return {
        id: service.vendorId,
        serviceId: service.id,
        type: serviceCategory,
        icon: categoryIcons[serviceCategory] || "🎉",
        name: service.vendorName,
        location:
          service.location ||
          service.vendorLocation ||
          "Ghana",
        rating: Number(service.rating || 0),
        reviews: Number(service.reviewCount || 0),
        price: Number(service.price || 0),
        capacity:
          service.description ||
          service.serviceName ||
          service.name ||
          "Professional event service",
        verified: true,
        profileType: "vendor",
        serviceName:
          service.serviceName ||
          service.name ||
          "Event Service",
        description:
          service.description ||
          "Professional event services available through EventFlow.",
        image:
          service.image ||
          service.coverImage ||
          service.photo ||
          service.imageUrl ||
          "",
      };
    });

    return [...approvedVenues, ...vendorListings];
  }, [venues, services]);

  const filteredListings = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const locationValue = location.trim().toLowerCase();

    let results = listings.filter((listing) => {
      const matchesCategory =
        activeCategory === "All" ||
        listing.type === activeCategory ||
        (activeCategory === "Venues" && listing.profileType === "venue");

      const searchableText = [
        listing.name,
        listing.type,
        listing.location,
        listing.capacity,
        listing.serviceName,
        listing.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue || searchableText.includes(searchValue);
      const matchesLocation =
        !locationValue ||
        String(listing.location || "")
          .toLowerCase()
          .includes(locationValue);

      return matchesCategory && matchesSearch && matchesLocation;
    });

    results = [...results];
    if (sortBy === "price-low") {
      results.sort((a, b) => {
        if (a.price === 0) return 1;
        if (b.price === 0) return -1;
        return a.price - b.price;
      });
    }
    if (sortBy === "price-high") {
      results.sort((a, b) => b.price - a.price);
    }
    if (sortBy === "rating") {
      results.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviews - a.reviews;
      });
    }
    if (sortBy === "name") {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }
    return results;
  }, [listings, activeCategory, search, location, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts = { All: listings.length };
    categories.slice(1).forEach((category) => {
      counts[category] = listings.filter(
        (listing) =>
          listing.type === category ||
          (category === "Venues" && listing.profileType === "venue")
      ).length;
    });
    return counts;
  }, [listings]);

  const isSaved = (listing) => {
    return savedItems.some(
      (item) =>
        String(item.id) === String(listing.id) &&
        item.profileType === listing.profileType &&
        (!listing.serviceId ||
          !item.serviceId ||
          String(item.serviceId) === String(listing.serviceId))
    );
  };

  const toggleSaved = (listing) => {
    if (!currentUser || currentUser.accountType !== "organizer") {
      setSaveMessage(
        "Please log in with an organizer account to save favorites."
      );
      return;
    }
    if (!currentUser.email) {
      setSaveMessage("Your account email is missing. Please log in again.");
      return;
    }
    const key = `eventflowSavedItems_${currentUser.email.toLowerCase()}`;
    const alreadySaved = isSaved(listing);

    let updatedItems;
    if (alreadySaved) {
      updatedItems = savedItems.filter(
        (item) =>
          !(
            String(item.id) === String(listing.id) &&
            item.profileType === listing.profileType &&
            (!listing.serviceId ||
              !item.serviceId ||
              String(item.serviceId) === String(listing.serviceId))
          )
      );
      setSaveMessage("Removed from your saved items.");
    } else {
      const savedItem = {
        id: listing.id,
        serviceId: listing.serviceId || "",
        profileType: listing.profileType,
        name: listing.name,
        type: listing.type,
        location: listing.location,
        price: listing.price,
        icon: listing.icon,
        serviceName: listing.serviceName || "",
        image: listing.image || "",
        savedAt: new Date().toISOString(),
      };
      updatedItems = [...savedItems, savedItem];
      setSaveMessage("Added to your saved items.");
    }

    localStorage.setItem(key, JSON.stringify(updatedItems));
    setSavedItems(updatedItems);
    window.dispatchEvent(new Event("eventflow-saved-items-updated"));
    setTimeout(() => setSaveMessage(""), 3500);
  };

  const clearFilters = () => {
    setSearch("");
    setLocation("");
    setActiveCategory("All");
    setSortBy("recommended");
  };

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (location.trim() ? 1 : 0) +
    (activeCategory !== "All" ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-paper text-ink"
    >
      <Navbar />
      <main>
        {/* HERO / SEARCH */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-paper">
          <div className="absolute inset-0">
            <div className="absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-gold-soft/20 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 sm:px-8 sm:pb-28 sm:pt-20 lg:px-12 lg:pb-32 lg:pt-24">
            <div>
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-none border border-gold bg-gold-soft px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                  <span className="h-1.5 w-1.5 rounded-none bg-gold" />
                  EVENTFLOW MARKETPLACE
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="mt-6 text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl leading-[1]"
                >
                  Find the people and places{' '}
                  <span className="block text-gold">
                    behind your perfect event.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="mt-6 max-w-2xl text-lead sm:text-xl"
                >
                  Explore approved venues and event professionals across Ghana.
                  Compare options, save your favourites, and connect with the
                  right provider for your event.
                </motion.p>
              </div>

              {/* SEARCH CARD */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9 }}
                className="relative mt-10 rounded-none border border-slate-200 bg-paper p-6 shadow-lg sm:p-8"
              >
                <div className="grid gap-2 lg:grid-cols-[1.5fr_1fr_auto]">
                  <div className="flex min-h-[68px] items-center gap-3 rounded-none bg-gold-soft px-4 transition hover:border-gold/30 focus-within:bg-paper focus-within:ring-2 focus-within:ring-gold/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-paper text-slate-500 shadow-sm">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-4-4" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        What are you looking for?
                      </p>
                      <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Venue, photographer, DJ..."
                        className="mt-2 w-full bg-transparent text-sm font-bold text-ink outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex min-h-[68px] items-center gap-3 rounded-none bg-gold-soft px-4 transition hover:border-gold/30 focus-within:bg-paper focus-within:ring-2 focus-within:ring-gold/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-paper text-slate-500 shadow-sm">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Location
                      </p>
                      <input
                        type="text"
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder="Accra, Kumasi..."
                        className="mt-2 w-full bg-transparent text-sm font-bold text-ink outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      document
                        .getElementById("discover-results")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="flex min-h-[68px] items-center justify-center rounded-none bg-ink px-8 text-xs font-bold uppercase tracking-[0.15em] text-paper transition-colors duration-200 hover:bg-gold hover:text-paper"
                  >
                    Search
                  </button>
                </div>

                {/* QUICK CATEGORY LINKS */}
                <div className="mt-8 flex flex-wrap items-start gap-2">
                  <span className="mr-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Popular:
                  </span>
                  {[
                    "Venues",
                    "Photography",
                    "Decoration",
                    "DJ & Music",
                  ].map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setActiveCategory(category);
                        document
                          .getElementById("discover-results")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="rounded-none border border-slate-200 bg-paper px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-600 transition-colors hover:border-gold hover:bg-gold-soft hover:text-gold"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* MARKETPLACE CONTENT */}
        <section
          id="discover-results"
          className="mx-auto max-w-7xl px-6 py-10 sm:px-8 sm:py-16 lg:px-12 lg:py-24"
        >
          {/* CATEGORY EXPLORER */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                  Explore
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  Browse by service
                </h2>
              </div>
              <span className="hidden text-sm text-slate-500 sm:block">
                {listings.length} approved listings
              </span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {categories.map((category) => {
                const active = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-none border p-4 text-left transition-colors duration-200 ${
                      active
                        ? "border-gold bg-gold text-paper shadow-lg shadow-gold/20"
                        : "border-slate-200 bg-paper text-ink hover:border-gold/30 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-none text-lg transition-colors duration-200 ${
                        active
                          ? "bg-paper/15"
                          : "bg-gold-soft group-hover:bg-gold-soft"
                      }`}
                    >
                      {category === "All" ? "✦" : categoryIcons[category]}
                    </div>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] leading-4">
                      {category}
                    </p>
                    <p
                      className={`mt-1 text-[11px] ${
                        active
                          ? "text-gold"
                          : "text-slate-400"
                      }`}
                    >
                      {categoryCounts[category] || 0}{" "}
                      {categoryCounts[category] === 1
                        ? "listing"
                        : "listings"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="mt-12 border-b border-slate-200 pb-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                  Marketplace
                </p>
                <h2 className="mt-2 text-3xl font-bold text-ink">
                  {activeCategory === "All"
                    ? "All event services"
                    : activeCategory}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {filteredListings.length}{" "}
                  {filteredListings.length === 1
                    ? "option"
                    : "options"}{" "}
                  available
                  {location ? ` in or around ${location}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-none border border-slate-200 bg-paper px-4 py-2.5 text-sm font-bold uppercase tracking-[0.1em] text-slate-600 transition-colors hover:border-gold hover:text-ink"
                  >
                    Clear filters
                  </button>
                )}
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-none border border-slate-200 bg-paper px-4 py-2.5 text-sm font-bold uppercase tracking-[0.1em] text-slate-700 outline-none transition-colors focus:border-gold focus:ring-0"
                >
                  <option value="recommended">
                    Sort: Recommended
                  </option>
                  <option value="rating">
                    Highest Rated
                  </option>
                  <option value="price-low">
                    Lowest Price
                  </option>
                  <option value="price-high">
                    Highest Price
                  </option>
                  <option value="name">
                    Name A–Z
                  </option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileFilters((value) => !value)}
              className="mt-6 flex w-full items-center justify-between rounded-none border border-slate-200 bg-paper px-4 py-3 text-sm font-bold text-slate-700 lg:hidden"
            >
              <span className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path d="M4 6h16M7 12h10M10 18h4" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-none bg-gold px-2 py-0.5 text-[10px] text-paper">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <span>
                {showMobileFilters ? "Hide" : "Show"}
              </span>
            </button>

            {showMobileFilters && (
              <div className="mt-4 grid gap-4 rounded-none border border-slate-200 bg-paper p-4 lg:hidden">
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Search
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search services..."
                    className="mt-2 w-full rounded-none border border-slate-200 px-4 py-3 text-sm outline-none focus:border-gold focus:ring-0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Accra, Kumasi..."
                    className="mt-2 w-full rounded-none border border-slate-200 px-4 py-3 text-sm outline-none focus:border-gold focus:ring-0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SAVE MESSAGE */}
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              role="status"
              className="mt-6 rounded-none border border-gold bg-gold-soft px-4 py-3 text-sm text-gold"
            >
              <span>{saveMessage}</span>
              {!organizerEmail && (
                <Link
                  to="/login"
                  className="font-bold underline underline-offset-4"
                >
                  Log in
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSaveMessage("")}
                className="font-bold text-gold hover:text-ink"
                aria-label="Dismiss message"
              >
                ×
              </button>
            </motion.div>
          )}

          {/* LISTINGS */}
          {filteredListings.length === 0 ? (
            <div className="mt-10 rounded-none border border-slate-200 bg-paper px-8 py-20 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-none bg-slate-100">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-7 w-7 text-slate-500"
                >
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 5 5" />
                  <path d="M8.5 8.5 13.5 13.5" />
                  <path d="M13.5 8.5 8.5 13.5" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-bold text-ink">
                We couldn't find a match
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try changing your search, choosing another
                category, or searching a different location.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-none bg-ink px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-paper transition-colors hover:bg-gold hover:text-paper"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
            >
              {filteredListings.map((listing) => {
                const saved = isSaved(listing);
                const profileLink =
                  listing.profileType === "venue"
                    ? `/venues/${listing.id}`
                    : `/vendor/${listing.id}`;

                return (
                  <motion.div
                    key={`${listing.profileType}-${listing.id}-${listing.serviceId || ""}`}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.random() * 0.2 }}
                    whileHover={{ y: -8 }}
                    className="group overflow-hidden border border-slate-200 bg-paper shadow-sm transition-colors duration-300 hover:border-ink hover:shadow-lg"
                  >
                    {/* IMAGE */}
                    <div className="relative h-64 overflow-hidden bg-slate-100">
                      {listing.image ? (
                        <img
                          src={listing.image}
                          alt={listing.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-50 via-paper to-gold-50">
                          <div className="flex h-20 w-20 items-center justify-center rounded-sm bg-paper text-4xl shadow-sm">
                            {listing.icon}
                          </div>
                        </div>
                      )}

                      {/* IMAGE OVERLAY */}
                      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                        <span className="rounded-none bg-paper/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 shadow-sm">
                          {listing.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSaved(listing)}
                          aria-label={
                            saved
                              ? "Remove from saved items"
                              : "Save item"
                          }
                          title={
                            saved
                              ? "Remove from saved items"
                              : "Save item"
                          }
                          className={`flex h-10 w-10 items-center justify-center rounded-none border backdrop-blur transition-colors duration-200 ${
                            saved
                              ? "border-gold-200 bg-gold-50 text-gold-600"
                              : "border-white/70 bg-paper/95 text-slate-600 hover:border-gold/30 hover:bg-gold-50 hover:text-gold-600"
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill={saved ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                          >
                            <path d="M20.8 8.8c0 5.4-8.8 10-8.8 10s-8.8-4.6-8.8-10A4.6 4.6 0 0 1 12 6.2a4.6 4.6 0 0 1 8.8 2.6Z" />
                          </svg>
                        </button>
                      </div>

                      {/* APPROVED BADGE */}
                      {listing.verified && (
                        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-none bg-ink text-paper px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]">
                          <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-gold text-[9px]">
                            ✓
                          </span>
                          EventFlow approved
                        </div>
                      )}
                    </div>

                    {/* CARD CONTENT */}
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold text-ink">
                            {listing.name}
                          </h3>
                          {listing.serviceName && (
                            <p className="mt-2 truncate text-sm font-medium text-gold">
                              {listing.serviceName}
                            </p>
                          )}
                        </div>
                        {listing.rating > 0 && (
                          <div className="flex shrink-0 items-center gap-1 rounded-none bg-gold-soft px-2 py-1 text-xs font-bold text-gold">
                            <span>★</span>
                            {listing.rating.toFixed(1)}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4 shrink-0"
                        >
                          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                          <circle cx="12" cy="10" r="2.5" />
                        </svg>
                        <span className="truncate">
                          {listing.location}
                        </span>
                      </div>

                      {listing.rating > 0 &&
                        listing.reviews > 0 && (
                            <p className="mt-2 text-xs text-slate-400">
                              {listing.reviews.toLocaleString()} {' '}
                              {listing.reviews === 1 ? "review" : "reviews"}
                            </p>
                          )}

                        <p className="mt-6 line-clamp-2 min-h-[40px] text-sm leading-6 text-slate-500">
                          {listing.description}
                        </p>

                        <div className="mt-8 flex items-end justify-between border-t border-slate-100 pt-4">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                              Starting from
                            </p>
                            <p className="mt-1 text-base font-bold text-ink">
                              {listing.price > 0
                                ? `GH₵${listing.price.toLocaleString()}`
                                : "Price on request"}
                            </p>
                            <p className="mt-1 max-w-[170px] truncate text-xs text-slate-400">
                              {listing.capacity}
                            </p>
                          </div>
                          <Link
                            to={profileLink}
                            className="inline-flex items-center gap-2 rounded-none bg-ink px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-paper transition-colors hover:bg-gold hover:text-paper"
                          >
                            View
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="h-4 w-4"
                            >
                              <path d="M5 12h14" />
                              <path d="m13 6 6 6-6 6" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
          )}

          {/* TRUST SECTION */}
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            <Card padding="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-gold-soft text-lg font-bold text-gold mb-4">
                ✓
              </div>
              <h3 className="font-bold text-ink">Approved businesses</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Listings shown on EventFlow are reviewed before they become
                available in the marketplace.
              </p>
            </Card>
            <Card padding="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-ink-50 text-ink-600 mb-4">
                ↔
              </div>
              <h3 className="font-bold text-ink">Compare your options</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Explore different services, locations and starting prices
                before contacting a provider.
              </p>
            </Card>
            <Card padding="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-purple-50 text-purple-600 mb-4">
                ♡
              </div>
              <h3 className="font-bold text-ink">Save what you like</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Keep your favourite venues and services together while you
                plan your event.
              </p>
            </Card>
          </div>

          {/* MAP / LOCATION AREA */}
          <div className="mt-16 overflow-hidden rounded-none border border-slate-200 bg-paper shadow-lg">
            <div className="grid lg:grid-cols-[1fr_1.1fr]">
              <div className="p-8 sm:p-10 lg:p-12">
                <span className="inline-flex rounded-none bg-ink-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold">
                  Coming to EventFlow
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  Discover what is around you.
                </h2>
                <p className="mt-6 text-sm leading-8 text-slate-500 sm:text-base">
                  EventFlow is being built to make it easier to discover
                  event businesses near your chosen location. Soon you will
                  be able to explore nearby options, compare distances and
                  plan your event with a clearer view of what is around you.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <div className="rounded-none bg-gold-soft px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Search</p>
                    <p className="mt-1 text-sm font-bold text-ink">
                      By location
                    </p>
                  </div>
                  <div className="rounded-none bg-gold-soft px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Explore</p>
                    <p className="mt-1 text-sm font-bold text-ink">
                      Nearby options
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative min-h-[300px] overflow-hidden bg-gradient-to-br from-ink-100 via-paper to-gold-100">
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute left-[18%] top-[25%] h-24 w-24 rounded-none border border-ink-300" />
                  <div className="absolute right-[18%] top-[40%] h-32 w-32 rounded-none border border-gold-300" />
                  <div className="absolute bottom-[10%] left-[40%] h-20 w-20 rounded-none border border-ink-200" />
                </div>
                <div className="absolute left-[25%] top-[30%] flex h-12 w-12 items-center justify-center rounded-sm bg-ink text-paper shadow-lg shadow-ink-300">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <div className="absolute right-[24%] top-[48%] flex h-11 w-11 items-center justify-center rounded-sm bg-ink-950 text-paper shadow-lg">
                  <span className="text-lg">🏛️</span>
                </div>
                <div className="absolute bottom-[23%] left-[45%] flex h-11 w-11 items-center justify-center rounded-sm bg-paper text-xl shadow-lg">
                  📸
                </div>
                <div className="absolute bottom-6 left-6 rounded-none border border-paper/70 bg-paper/90 px-4 py-3 shadow-lg backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    EventFlow
                  </p>
                  <p className="mt-1 text-sm font-bold text-ink">
                    Local discovery
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BUSINESS CTA */}
          <div className="relative mt-16 overflow-hidden rounded-none bg-ink-950 px-8 py-10 text-paper sm:px-10 sm:py-12 lg:px-12 lg:py-16">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-none bg-gold/20 blur-[120px]" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-soft">
                  For event businesses
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-paper sm:text-4xl">
                  Put your business where event organisers are already looking.
                </h2>
                <p className="mt-6 text-sm leading-8 text-slate-300 sm:text-base">
                  Showcase your work, receive enquiries and manage bookings
                  through a professional EventFlow profile.
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-none bg-paper px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] text-ink transition-colors hover:bg-gold hover:text-paper"
              >
                Register your business
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </motion.div>
  );
}

