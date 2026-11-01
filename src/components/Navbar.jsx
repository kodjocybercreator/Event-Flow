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
    <header className="sticky top-0 z-50 border-b border-line bg-ink/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-6 sm:px-8 lg:px-12">

        {/* LOGO */}
        <Link
          to={dashboardPath}
          onClick={() => setMobileOpen(false)}
          className="flex shrink-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-dim text-cream font-black text-lg shadow-lg shadow-gold/20">
            EF
          </div>
          <span className="text-xl font-bold tracking-tight text-cream">
            Event<span className="text-gold">Flow</span>
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navigationLinks.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'text-gold bg-gold/10'
                    : 'text-mist hover:text-cream hover:bg-raised'
                }`}
              >
                {item.label}
                {active && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-x-2 -bottom-px h-px bg-gold"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
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
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-mist transition-colors hover:text-cream hover:bg-raised"
              >
                Login
              </Link>
              <Button to="/register" variant="gold" asChild className="rounded-xl px-6 py-3 text-xs">
                Get Started
              </Button>
            </>
          ) : (
            <>
              <Link
                to={isOrganizer ? '/organizer/me' : dashboardPath}
                className="flex items-center gap-3 rounded-xl border border-line bg-raised px-4 py-2.5 transition-all hover:border-gold/30 hover:bg-surface"
              >
                <Avatar src={user.profileImage} label={accountName} size="sm" />
                <span className="max-w-[130px]">
                  <span className="block truncate text-sm font-medium text-cream">
                    {user.firstName || 'My Account'}
                  </span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">
                    {accountLabel}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-sm font-medium text-fog transition-colors hover:text-rose"
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
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-cream transition-all hover:bg-raised md:flex lg:hidden"
        >
          {mobileOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* MOBILE NAVIGATION */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-line bg-ink/95 backdrop-blur-xl md:flex lg:hidden"
          >
            <div className="px-6 pb-8 pt-4">
              {user && (
                <Link
                  to={isOrganizer ? '/organizer/me' : dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="mb-6 flex items-center gap-3 rounded-xl border border-line bg-raised p-5"
                >
                  <Avatar src={user.profileImage} label={accountName} size="md" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-cream">
                      {accountName}
                    </span>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-gold">
                      {accountLabel}
                    </span>
                    <span className="mt-1 block text-xs text-fog">
                      {isOrganizer ? 'View your profile' : 'Open your dashboard'}
                    </span>
                  </span>
                </Link>
              )}

              <nav className="mb-6 flex flex-col gap-1">
                {navigationLinks.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive(item.to)
                        ? 'bg-gold/10 text-gold'
                        : 'text-mist hover:bg-raised hover:text-cream'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {!user ? (
                <div className="grid grid-cols-2 gap-3 border-t border-line pt-6">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-line-bright bg-raised px-6 py-3.5 text-center text-xs font-bold uppercase tracking-[0.1em] text-cream transition-all hover:bg-surface"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl bg-gold px-6 py-3.5 text-center text-xs font-bold uppercase tracking-[0.1em] text-ink transition-all hover:bg-gold-dim"
                  >
                    Get Started
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 w-full rounded-xl border border-line px-6 py-3.5 text-left text-xs font-bold uppercase tracking-[0.1em] text-fog transition-colors hover:border-rose/30 hover:text-rose"
                >
                  Log out of EventFlow
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
