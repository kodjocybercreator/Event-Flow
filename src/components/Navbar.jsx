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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-paper shadow-sm">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-6 sm:px-8 lg:px-12">

        {/* LOGO */}
        <Link
          to={dashboardPath}
          onClick={() => setMobileOpen(false)}
          className="flex shrink-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none bg-ink text-paper font-black text-lg shadow-lg">
            EF
          </div>
          <span className="text-xl font-bold tracking-tight text-ink">
            Event<span className="text-gold">Flow</span>
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navigationLinks.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`text-sm font-bold tracking-[0.1em] transition-colors ${
                  active
                    ? 'text-gold'
                    : 'text-slate-500 hover:text-gold'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* DESKTOP ACCOUNT AREA */}
        <div className="hidden items-center gap-6 md:flex">
          {!user ? (
            <>
              <Link
                to="/login"
                className="text-sm font-bold text-slate-500 transition-colors hover:text-gold"
              >
                Login
              </Link>
              <Button to="/register" variant="gold" asChild className="px-8 py-4 text-xs">
                Get Started
              </Button>
            </>
          ) : (
            <>
              <Link
                to={isOrganizer ? '/organizer/me' : dashboardPath}
                className="flex items-center gap-3 rounded-none border border-slate-200 bg-paper px-4 py-3 shadow-sm transition hover:border-gold"
              >
                <Avatar src={user.profileImage} label={accountName} size="md" />
                <span className="max-w-[130px]">
                  <span className="block truncate text-sm font-bold text-ink">
                    {user.firstName || 'My Account'}
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                    {accountLabel}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-bold text-slate-500 transition-colors hover:text-gold"
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
          className="flex h-11 w-11 items-center justify-center rounded-none border border-slate-200 text-xl text-slate-600 transition hover:bg-slate-100 md:flex lg:hidden"
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
            className="border-t border-slate-200 bg-paper px-6 pb-8 pt-4 shadow-2xl md:flex lg:hidden"
          >
            {user && (
              <Link
                to={isOrganizer ? '/organizer/me' : dashboardPath}
                onClick={() => setMobileOpen(false)}
                className="mb-8 flex items-center gap-3 rounded-none border border-slate-200 bg-gold-soft p-6"
              >
                <Avatar src={user.profileImage} label={accountName} size="md" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">
                    {accountName}
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                    {accountLabel}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {isOrganizer ? 'View your profile' : 'Open your dashboard'}
                  </span>
                </span>
              </Link>
            )}

            <nav className="flex flex-col gap-1 mb-8">
              {navigationLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-6 py-4 rounded-none text-sm font-bold transition-colors ${
                    isActive(item.to)
                      ? 'bg-gold-soft text-gold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-gold'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {!user ? (
              <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-200">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-none border border-slate-200 bg-paper px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.1em] text-slate-600 transition hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-none bg-ink px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.1em] text-paper transition hover:bg-gold hover:text-paper"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 w-full rounded-none border border-slate-200 px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.1em] text-slate-600 transition hover:bg-slate-50 hover:text-red-500"
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
