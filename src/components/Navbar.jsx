import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Discover', to: '/discover' },
  { label: 'Venues', to: '/venues' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eventflowUser') || 'null');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const updateUser = () => {
      try {
        setUser(JSON.parse(localStorage.getItem('eventflowUser') || 'null'));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener('eventflow-auth-changed', updateUser);
    window.addEventListener('storage', updateUser);
    return () => {
      window.removeEventListener('eventflow-auth-changed', updateUser);
      window.removeEventListener('storage', updateUser);
    };
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const isOrganizer = user?.accountType === 'organizer';
  const isVendor = user?.accountType === 'vendor';
  const isVenueOwner =
    user?.accountType === 'venue' ||
    user?.accountType === 'venueOwner' ||
    user?.accountType === 'venue_owner';

  const dashboardPath = isOrganizer
    ? '/dashboard/organizer'
    : isVendor
      ? '/dashboard/vendor'
      : isVenueOwner
        ? '/dashboard/venue'
        : '/';

  const accountLabel = isOrganizer
    ? 'Event Organizer'
    : isVendor
      ? 'Vendor Partner'
      : isVenueOwner
        ? 'Venue Owner'
        : 'Account';

  const accountIcon = isOrganizer
    ? '🎉'
    : isVendor
      ? '🎥'
      : isVenueOwner
        ? '🏛️'
        : '👤';

  const accountName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    'My Account';

  const navigationLinks = !user
    ? navLinks
    : isOrganizer
      ? [
          ...navLinks,
          { label: 'Dashboard', to: '/dashboard/organizer' },
          { label: 'My Bookings', to: '/dashboard/organizer' },
          { label: 'Me', to: '/organizer/me' },
        ]
      : isVendor
        ? [
            ...navLinks,
            { label: 'Dashboard', to: '/dashboard/vendor' },
            { label: 'My Services', to: '/dashboard/vendor/services' },
            { label: 'Bookings', to: '/dashboard/vendor/bookings' },
          ]
        : isVenueOwner
          ? [
              ...navLinks,
              { label: 'Dashboard', to: '/dashboard/venue' },
              { label: 'My Venue', to: '/dashboard/venue' },
            ]
          : [];

  const isActive = (to) => {
    const path = to.split('#')[0];
    if (path === '/') return location.pathname === '/';
    if (to.includes('#')) {
      return (
        location.pathname === path &&
        location.hash === to.substring(to.indexOf('#'))
      );
    }
    return location.pathname === path && !location.hash;
  };

  const handleLogout = () => {
    localStorage.removeItem('eventflowUser');
    localStorage.removeItem('eventflowLoggedIn');
    setUser(null);
    setMobileOpen(false);
    window.dispatchEvent(new Event('eventflow-auth-changed'));
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* LOGO */}
        <Link
          to={dashboardPath}
          onClick={() => setMobileOpen(false)}
          className="flex shrink-0 items-center gap-2.5 group"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-amber-600 text-xl font-black text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-300">
            EF
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-950">
            Event<span className="text-amber-600">Flow</span>
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-6 lg:flex">
          {navigationLinks.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`text-sm font-medium transition-colors ${
                  active
                    ? 'text-indigo-600'
                    : 'text-slate-500 hover:text-indigo-600'
                } ${active ? 'border-b-2 border-amber-600 pb-[6px]' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* DESKTOP ACCOUNT AREA */}
        <div className="hidden items-center gap-4 md:flex">
          {!user ? (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
              >
                Login
              </Link>
              <Button
                to="/register"
                variant="gold"
                asChild
                className="px-6 py-3"
              >
                Get Started
              </Button>
            </>
          ) : (
            <>
              <Link
                to={isOrganizer ? '/organizer/me' : dashboardPath}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
              >
                <Avatar src={user.profileImage} label={accountName} size="md" />
                <span className="max-w-[130px]">
                  <span className="block truncate text-sm font-bold text-slate-900">
                    {user.firstName || 'My Account'}
                  </span>
                  <span className="block text-xs font-medium text-amber-600">
                    {accountLabel}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-semibold text-slate-500 hover:text-amber-600 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-xl text-slate-600 transition hover:bg-slate-50 md:flex lg:hidden"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* MOBILE NAVIGATION */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/50 bg-white px-4 pb-6 pt-4 shadow-2xl md:flex lg:hidden"
          >
            {/* MOBILE ACCOUNT CARD */}
            {user && (
              <Link
                to={isOrganizer ? '/organizer/me' : dashboardPath}
                onClick={() => setMobileOpen(false)}
                className="mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-amber-50 p-5"
              >
                <Avatar src={user.profileImage} label={accountName} size="md" />
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-900">
                    {accountName}
                  </span>
                  <span className="block text-xs font-medium text-amber-600">
                    {accountLabel}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {isOrganizer ? 'View your profile' : 'Open your dashboard'}
                  </span>
                </span>
              </Link>
            )}

            {/* MOBILE LINKS */}
            <nav className="flex flex-col gap-1 mb-6">
              {navigationLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition ${
                    isActive(item.to)
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* MOBILE LOGIN / LOGOUT */}
            {!user ? (
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/50">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 px-4 py-3 text-center text-sm font-bold text-white transition"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 w-full rounded-xl border border-amber-100 px-4 py-3 text-left text-sm font-bold text-amber-600 transition hover:bg-amber-50"
              >
                Log out of EventFlow
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
