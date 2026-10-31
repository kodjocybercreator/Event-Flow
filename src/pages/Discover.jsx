import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const categories = [
  'All',
  'Venues',
  'Photography',
  'Videography',
  'Decoration',
  'DJ & Music',
  'Catering',
  'Transportation',
];

const categoryIcons = {
  Venues: '🏛️',
  Photography: '📸',
  Videography: '🎥',
  Decoration: '🎨',
  'DJ & Music': '🎧',
  Catering: '🍽️',
  Transportation: '🚐',
};

export default function Discover() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  const [venues, setVenues] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [services, setServices] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const organizerEmail =
    currentUser?.accountType === 'organizer'
      ? currentUser.email?.toLowerCase()
      : null;

  const loadData = () => {
    try {
      const storedVenues = JSON.parse(
        localStorage.getItem('eventflowVenues') || '[]'
      );
      const storedAccounts = JSON.parse(
        localStorage.getItem('eventflowAccounts') || '[]'
      );
      const storedUser = JSON.parse(
        localStorage.getItem('eventflowUser') || 'null'
      );

      setVenues(Array.isArray(storedVenues) ? storedVenues : []);
      setAccounts(Array.isArray(storedAccounts) ? storedAccounts : []);
      setCurrentUser(storedUser);

      const allServices = [];

      storedAccounts
        .filter(
          (account) =>
            account.accountType === 'vendor' &&
            account.status === 'approved'
        )
        .forEach((vendor) => {
          const vendorEmail = vendor.email?.toLowerCase();
          if (!vendorEmail) return;

          let vendorServices = [];
          try {
            vendorServices = JSON.parse(
              localStorage.getItem(`eventflowServices_${vendorEmail}`) ||
                '[]'
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
                    'Event Professional',
              vendorPhone: vendor.phone || '',
              vendorLocation:
                vendor.location || vendor.city || service.location || '',
              profileType: 'vendor',
            });
          });
        });

      setServices(allServices);

      if (storedUser?.accountType === 'organizer' && storedUser.email) {
        const key = `eventflowSavedItems_${storedUser.email.toLowerCase()}`;
        let storedSaved = [];
        try {
          storedSaved = JSON.parse(localStorage.getItem(key) || '[]');
        } catch {
          storedSaved = [];
        }
        setSavedItems(Array.isArray(storedSaved) ? storedSaved : []);
      } else {
        setSavedItems([]);
      }
    } catch (error) {
      console.error('Unable to load EventFlow discover data:', error);
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
    window.addEventListener('eventflow-venues-updated', refresh);
    window.addEventListener('eventflow-auth-changed', refresh);
    window.addEventListener('eventflow-services-updated', refresh);
    window.addEventListener('eventflow-saved-items-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('eventflow-venues-updated', refresh);
      window.removeEventListener('eventflow-auth-changed', refresh);
      window.removeEventListener('eventflow-services-updated', refresh);
      window.removeEventListener('eventflow-saved-items-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const listings = useMemo(() => {
    const approvedVenues = venues
      .filter((venue) => venue.status === 'approved')
      .map((venue) => ({
        id: venue.id,
        type: 'Venues',
        icon: '🏛️',
        name: venue.name || venue.businessName || 'Unnamed Venue',
        location: venue.location || venue.city || 'Location not provided',
        rating: Number(venue.rating || 0),
        reviews: Number(venue.reviewCount || 0),
        price: Number(venue.price || 0),
        capacity: venue.capacity
          ? `Up to ${venue.capacity} guests`
          : 'Capacity not provided',
        verified: true,
        profileType: 'venue',
        description:
          venue.description ||
          'A professional event venue available through EventFlow.',
        image:
          venue.image ||
          venue.coverImage ||
          venue.photo ||
          venue.imageUrl ||
          '',
      }));

    const vendorListings = services.map((service) => {
      const serviceCategory =
        service.category ||
        service.serviceCategory ||
        service.type ||
        'Other';
      return {
        id: service.vendorId,
        serviceId: service.id,
        type: serviceCategory,
        icon: categoryIcons[serviceCategory] || '🎉',
        name: service.vendorName,
        location:
          service.location ||
          service.vendorLocation ||
          'Ghana',
        rating: Number(service.rating || 0),
        reviews: Number(service.reviewCount || 0),
        price: Number(service.price || 0),
        capacity:
          service.description ||
          service.serviceName ||
          service.name ||
          'Professional event service',
        verified: true,
        profileType: 'vendor',
        serviceName:
          service.serviceName ||
          service.name ||
          'Event Service',
        description:
          service.description ||
          'Professional event services available through EventFlow.',
        image:
          service.image ||
          service.coverImage ||
          service.photo ||
          service.imageUrl ||
          '',
      };
    });

    return [...approvedVenues, ...vendorListings];
  }, [venues, services]);

  const filteredListings = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const locationValue = location.trim().toLowerCase();

    let results = listings.filter((listing) => {
      const matchesCategory =
        activeCategory === 'All' ||
        listing.type === activeCategory ||
        (activeCategory === 'Venues' && listing.profileType === 'venue');

      const searchableText = [
        listing.name,
        listing.type,
        listing.location,
        listing.capacity,
        listing.serviceName,
        listing.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !searchValue || searchableText.includes(searchValue);
      const matchesLocation =
        !locationValue ||
        String(listing.location || '')
          .toLowerCase()
          .includes(locationValue);

      return matchesCategory && matchesSearch && matchesLocation;
    });

    results = [...results];
    if (sortBy === 'price-low') {
      results.sort((a, b) => {
        if (a.price === 0) return 1;
        if (b.price === 0) return -1;
        return a.price - b.price;
      });
    }
    if (sortBy === 'price-high') {
      results.sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'rating') {
      results.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviews - a.reviews;
      });
    }
    if (sortBy === 'name') {
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
          (category === 'Venues' && listing.profileType === 'venue')
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
    if (!currentUser || currentUser.accountType !== 'organizer') {
      setSaveMessage(
        'Please log in with an organizer account to save favorites.'
      );
      return;
    }
    if (!currentUser.email) {
      setSaveMessage('Your account email is missing. Please log in again.');
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
      setSaveMessage('Removed from your saved items.');
    } else {
      const savedItem = {
        id: listing.id,
        serviceId: listing.serviceId || '',
        profileType: listing.profileType,
        name: listing.name,
        type: listing.type,
        location: listing.location,
        price: listing.price,
        icon: listing.icon,
        serviceName: listing.serviceName || '',
        image: listing.image || '',
        savedAt: new Date().toISOString(),
      };
      updatedItems = [...savedItems, savedItem];
      setSaveMessage('Added to your saved items.');
    }

    localStorage.setItem(key, JSON.stringify(updatedItems));
    setSavedItems(updatedItems);
    window.dispatchEvent(new Event('eventflow-saved-items-updated'));
    setTimeout(() => setSaveMessage(''), 3500);
  };

  const clearFilters = () => {
    setSearch('');
    setLocation('');
    setActiveCategory('All');
    setSortBy('recommended');
  };

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (location.trim() ? 1 : 0) +
    (activeCategory !== 'All' ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#f7f7fb] text-slate-900"
    >
      <Navbar />
      <main>
        {/* HERO / SEARCH */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="absolute -left-40 bottom-0 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-14 lg:pt-14">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                EVENTFLOW MARKETPLACE
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl"
              >
                Find the people and places{' '}
                <span className="block text-indigo-600">
                  behind your perfect event.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg"
              >
                Explore approved venues and event professionals across Ghana.
                Compare options, save your favourites, and connect with the
                right provider for your event.
              </motion.p>
            </motion.div>

            {/* SEARCH CARD */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              className="relative mt-8 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              <div className="grid gap-2 lg:grid-cols-[1.5fr_1fr_auto]">
                <div className="flex min-h-[68px] items-center gap-3 rounded-2xl bg-slate-50 px-4 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
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
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      What are you looking for?
                    </p>
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Venue, photographer, DJ..."
                      className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex min-h-[68px] items-center gap-3 rounded-2xl bg-slate-50 px-4 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
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
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Location
                    </p>
                    <input
                      type="text"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder="Accra, Kumasi..."
                      className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById('discover-results')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="min-h-[68px] rounded-2xl bg-gradient-to-r from-indigo-600 to-amber-600 px-7 text-sm font-bold text-white transition hover:from-indigo-700 hover:to-amber-700"
                >
                  Search
                </button>
              </div>

              {/* QUICK CATEGORY LINKS */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold text-slate-400">
                  Popular:
                </span>
                {[
                  'Venues',
                  'Photography',
                  'Decoration',
                  'DJ & Music',
                ].map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category);
                      document
                        .getElementById('discover-results')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* MARKETPLACE CONTENT */}
        <section
          id="discover-results"
          className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8"
        >
          {/* CATEGORY EXPLORER */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                  Explore
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Browse by service
                </h2>
              </div>
              <span className="hidden text-sm text-slate-500 sm:block">
                {listings.length} approved listings
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {categories.map((category) => {
                const active = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`group rounded-2xl border p-4 text-left transition-all duration-300 ${
                      active
                        ? 'border-amber-600 bg-amber-600 text-white shadow-lg shadow-amber-200'
                        : 'border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all duration-300 ${
                        active
                          ? 'bg-white/15'
                          : 'bg-slate-50 group-hover:bg-indigo-50'
                      }`}
                    >
                      {category === 'All' ? '✦' : categoryIcons[category]}
                    </div>
                    <p className="mt-3 text-xs font-bold leading-4">
                      {category}
                    </p>
                    <p
                      className={`mt-1 text-[11px] ${
                        active
                          ? 'text-amber-100'
                          : 'text-slate-400'
                      }`}
                    >
                      {categoryCounts[category] || 0}{' '}
                      {categoryCounts[category] === 1
                        ? 'listing'
                        : 'listings'}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* TOOLBAR */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mt-12 border-b border-slate-200 pb-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                  Marketplace
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  {activeCategory === 'All'
                    ? 'All event services'
                    : activeCategory}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredListings.length}{' '}
                  {filteredListings.length === 1
                    ? 'option'
                    : 'options'}{' '}
                  available
                  {location ? ` in or around ${location}` : ''}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-amber-300 hover:text-slate-900"
                  >
                    Clear filters
                  </button>
                )}
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="recommended">Sort: Recommended</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Lowest Price</option>
                  <option value="price-high">Highest Price</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileFilters((value) => !value)}
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 lg:hidden"
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
                  <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <span>
                {showMobileFilters ? 'Hide' : 'Show'}
              </span>
            </button>

            {showMobileFilters && (
              <div className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:hidden">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Search
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search services..."
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Accra, Kumasi..."
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* SAVE MESSAGE */}
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              role="status"
              className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between"
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
                onClick={() => setSaveMessage('')}
                className="self-start font-bold text-amber-700 hover:text-amber-900 sm:self-auto"
                aria-label="Dismiss message"
              >
                ×
              </button>
            </motion.div>
          )}

          {/* LISTINGS */}
          {filteredListings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
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
              <h3 className="mt-5 text-xl font-bold text-slate-950">
                We couldn't find a match
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try changing your search, choosing another category, or
                searching a different location.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 px-5 py-3 text-sm font-bold text-white transition"
              >
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
            >
              {filteredListings.map((listing) => {
                const saved = isSaved(listing);
                const profileLink =
                  listing.profileType === 'venue'
                    ? `/venues/${listing.id}`
                    : `/vendor/${listing.id}`;

                return (
                  <motion.div
                    key={`${listing.profileType}-${listing.id}-${listing.serviceId || ''}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.random() * 0.2 }}
                    whileHover={{ y: -5 }}
                    className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                  >
                    {/* IMAGE */}
                    <div className="relative h-60 overflow-hidden bg-slate-100">
                      {listing.image ? (
                        <img
                          src={listing.image}
                          alt={listing.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-amber-50">
                          <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white text-4xl shadow-sm">
                            {listing.icon}
                          </div>
                        </div>
                      )}

                      {/* IMAGE OVERLAY */}
                      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                        <span className="rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur">
                          {listing.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSaved(listing)}
                          aria-label={saved ? 'Remove from saved items' : 'Save item'}
                          title={saved ? 'Remove from saved items' : 'Save item'}
                          className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition-all duration-300 ${
                            saved
                              ? 'border-amber-200 bg-amber-50 text-amber-600'
                              : 'border-white/70 bg-white/95 text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600'
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill={saved ? 'currentColor' : 'none'}
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
                        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-slate-950/85 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px]">
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
                          <h3 className="truncate text-lg font-bold text-slate-950">
                            {listing.name}
                          </h3>
                          {listing.serviceName && (
                            <p className="mt-1 truncate text-sm font-medium text-indigo-600">
                              {listing.serviceName}
                            </p>
                          )}
                        </div>
                        {listing.rating > 0 && (
                          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                            <span>★</span>
                            {listing.rating.toFixed(1)}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
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
                        <span className="truncate">{listing.location}</span>
                      </div>

                      {listing.rating > 0 &&
                        listing.reviews > 0 && (
                          <p className="mt-1 text-xs text-slate-400">
                            {listing.reviews.toLocaleString()} {' '}
                            {listing.reviews === 1 ? 'review' : 'reviews'}
                          </p>
                        )}

                      <p className="mt-4 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-500">
                        {listing.description}
                      </p>

                      <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Starting from
                          </p>
                          <p className="mt-0.5 text-base font-bold text-slate-950">
                            {listing.price > 0
                              ? `GH₵${listing.price.toLocaleString()}`
                              : 'Price on request'}
                          </p>
                          <p className="mt-0.5 max-w-[170px] truncate text-xs text-slate-400">
                            {listing.capacity}
                          </p>
                        </div>
                        <Link
                          to={profileLink}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 px-4 py-2.5 text-sm font-bold text-white transition group-hover:from-indigo-700 group-hover:to-amber-700"
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-14 grid gap-4 sm:grid-cols-3"
          >
            <Card padding="p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4">
                ✓
              </div>
              <h3 className="font-bold text-slate-950">Approved businesses</h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Listings shown on EventFlow are reviewed before they become
                available in the marketplace.
              </p>
            </Card>
            <Card padding="p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4">
                ↔
              </div>
              <h3 className="font-bold text-slate-950">Compare your options</h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Explore different services, locations and starting prices
                before contacting a provider.
              </p>
            </Card>
            <Card padding="p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-4">
                ♡
              </div>
              <h3 className="font-bold text-slate-950">Save what you like</h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Keep your favourite venues and services together while you
                plan your event.
              </p>
            </Card>
          </motion.div>

          {/* MAP / LOCATION AREA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-14 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
          >
            <div className="grid lg:grid-cols-[1fr_1.1fr]">
              <div className="p-7 sm:p-9 lg:p-11">
                <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-indigo-700">
                  Coming to EventFlow
                </span>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Discover what is around you.
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">
                  EventFlow is being built to make it easier to discover
                  event businesses near your chosen location. Soon you will
                  be able to explore nearby options, compare distances and
                  plan your event with a clearer view of what is around you.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-400">Search</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      By location
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold text-slate-400">Explore</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      Nearby options
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative min-h-[300px] overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-amber-100">
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute left-[18%] top-[25%] h-24 w-24 rounded-full border border-indigo-300" />
                  <div className="absolute right-[18%] top-[40%] h-32 w-32 rounded-full border border-amber-300" />
                  <div className="absolute bottom-[10%] left-[40%] h-20 w-20 rounded-full border border-indigo-200" />
                </div>
                <div className="absolute left-[25%] top-[30%] flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-300">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <div className="absolute right-[24%] top-[48%] flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg">
                  <span className="text-lg">🏛️</span>
                </div>
                <div className="absolute bottom-[23%] left-[45%] flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-lg">
                  📸
                </div>
                <div className="absolute bottom-5 left-5 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
                  <p className="text-xs font-bold text-slate-400">EventFlow</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-950">
                    Local discovery
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* BUSINESS CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mt-14 overflow-hidden rounded-[2rem] bg-slate-950 px-7 py-10 text-white sm:px-10 sm:py-12 lg:px-12"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-600/20 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  For event businesses
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                  Put your business where event organisers are already looking.
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base">
                  Showcase your work, receive enquiries and manage bookings
                  through a professional EventFlow profile.
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-50"
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
          </motion.div>
        </section>
      </main>
      <Footer />
    </motion.div>
  );
}
