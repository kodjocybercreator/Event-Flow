import { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { StatCard } from '../components/ui/StatCard';

const ACCOUNTS_KEY = 'eventflowAccounts';
const VENUES_KEY = 'eventflowVenues';

function getJson(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GH', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
function getAccountName(account) {
  const fullName = `${account?.firstName || ''} ${account?.lastName || ''}`.trim();
  return fullName || account?.businessName || account?.name || account?.email || 'Unknown user';
}
function getVendorImages(vendor) {
  const possible = [vendor?.images, vendor?.photos, vendor?.gallery, vendor?.portfolioImages, vendor?.portfolio];
  for (const value of possible) {
    if (Array.isArray(value) && value.length > 0) return value.filter(Boolean);
  }
  const single = vendor?.coverImage || vendor?.image || vendor?.imageUrl || vendor?.photo || vendor?.profileImage || '';
  return single ? [single] : [];
}

export default function AdminApprovals() {
  const [admin, setAdmin] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [venues, setVenues] = useState([]);
  const [activeTab, setActiveTab] = useState('vendors');

  const loadData = useCallback(() => {
    try {
      const storedAdmin = JSON.parse(localStorage.getItem('eventflowAdmin') || 'null');
      if (!storedAdmin || storedAdmin.role !== 'admin') return;
      setAdmin(storedAdmin);
      setAccounts(getJson(ACCOUNTS_KEY, []));
      setVenues(getJson(VENUES_KEY, []));
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('eventflow-accounts-updated', loadData);
    window.addEventListener('eventflow-venues-updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('eventflow-accounts-updated', loadData);
      window.removeEventListener('eventflow-venues-updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, [loadData]);

  const pendingVendors = useMemo(() =>
    accounts.filter((a) => a.accountType === 'vendor' && String(a.status || 'pending').toLowerCase() !== 'approved'),
  [accounts]);
  const pendingVenues = useMemo(() =>
    venues.filter((v) => String(v.status || 'pending').toLowerCase() !== 'approved'),
  [venues]);

  const approveVendor = (vendorId) => {
    if (!window.confirm('Approve this vendor? Their profile and media will become public.')) return;
    const current = getJson(ACCOUNTS_KEY, []);
    const updated = current.map((a) => (String(a.id) === String(vendorId)
      ? { ...a, status: 'approved', approvalStatus: 'approved', approved: true, updatedAt: new Date().toISOString() }
      : a));
    saveJson(ACCOUNTS_KEY, updated);
    setAccounts(updated);
    window.dispatchEvent(new Event('eventflow-accounts-updated'));
    window.dispatchEvent(new Event('eventflow-auth-changed'));
  };
  const rejectVendor = (vendorId) => {
    if (!window.confirm('Reject this vendor?')) return;
    const current = getJson(ACCOUNTS_KEY, []);
    const updated = current.map((a) => (String(a.id) === String(vendorId)
      ? { ...a, status: 'rejected', approvalStatus: 'rejected', approved: false, updatedAt: new Date().toISOString() }
      : a));
    saveJson(ACCOUNTS_KEY, updated);
    setAccounts(updated);
    window.dispatchEvent(new Event('eventflow-accounts-updated'));
  };
  const approveVenue = (venueId) => {
    if (!window.confirm('Approve this venue?')) return;
    const current = getJson(VENUES_KEY, []);
    const updated = current.map((v) => (String(v.id) === String(venueId)
      ? { ...v, status: 'approved', updatedAt: new Date().toISOString() }
      : v));
    saveJson(VENUES_KEY, updated);
    setVenues(updated);
    window.dispatchEvent(new Event('eventflow-venues-updated'));
  };
  const rejectVenue = (venueId) => {
    if (!window.confirm('Reject this venue?')) return;
    const current = getJson(VENUES_KEY, []);
    const updated = current.map((v) => (String(v.id) === String(venueId)
      ? { ...v, status: 'rejected', updatedAt: new Date().toISOString() }
      : v));
    saveJson(VENUES_KEY, updated);
    setVenues(updated);
    window.dispatchEvent(new Event('eventflow-venues-updated'));
  };

  const renderVendorCard = (vendor) => {
    const images = getVendorImages(vendor);
    return (
      <Card key={vendor.id} className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={vendor.profileImage || vendor.coverImage}
              label={getAccountName(vendor)}
              size="md"
            />
            <div>
              <h3 className="font-bold text-cream truncate">
                {getAccountName(vendor)}
              </h3>
              <p className="text-sm text-mist truncate max-w-xs">
                {vendor.businessName || vendor.email}
              </p>
              <p className="mt-1 text-xs text-fog truncate">
                {vendor.category || vendor.serviceCategory || 'Event Services'} · {vendor.location}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Badge variant={vendor.status === 'pending' ? 'amber' : 'slate'}>
              {vendor.status}
            </Badge>
            <div className="flex gap-2">
              <Button
                onClick={() => approveVendor(vendor.id)}
                variant="emerald"
                size="sm"
              >
                Approve
              </Button>
              <Button
                onClick={() => rejectVendor(vendor.id)}
                variant="red"
                size="sm"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>

        {images.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-fog mb-2">
              Portfolio ({images.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {images.slice(0, 6).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Portfolio ${i + 1}`}
                  className="h-16 w-16 rounded-xl object-cover border border-line"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-fog">
          Registered: {formatDate(vendor.createdAt)}
        </div>
      </Card>
    );
  };

  const renderVenueCard = (venue) => {
    const images = venue.images || venue.coverImage || venue.image ? [venue.coverImage || venue.image || venue.images?.[0]] : [];
    return (
      <Card key={venue.id} className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-xl text-gold">
              🏛️
            </div>
            <div>
              <h3 className="font-bold text-cream truncate">
                {venue.name || venue.businessName || 'Unnamed Venue'}
              </h3>
              <p className="text-sm text-mist truncate max-w-xs">
                {venue.email || venue.ownerName || 'Venue owner'}
              </p>
              <p className="mt-1 text-xs text-fog truncate">
                {venue.location || venue.city}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Badge variant={venue.status === 'pending' ? 'amber' : 'slate'}>
              {venue.status}
            </Badge>
            <div className="flex gap-2">
              <Button
                onClick={() => approveVenue(venue.id)}
                variant="emerald"
                size="sm"
              >
                Approve
              </Button>
              <Button
                onClick={() => rejectVenue(venue.id)}
                variant="red"
                size="sm"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>

        {images.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-fog mb-2">
              Gallery
            </p>
            <div className="flex gap-2">
              {images.slice(0, 3).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={venue.name}
                  className="h-20 w-24 rounded-xl object-cover border border-line"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-fog">
          Submitted: {formatDate(venue.createdAt)}
        </div>
      </Card>
    );
  };

  const vendorsList = (
    <div className="space-y-4">
      {pendingVendors.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl mb-4">
            ✓
          </div>
          <h3 className="font-bold text-cream">No pending vendors</h3>
          <p className="mt-2 text-sm text-mist">
            All vendor registrations have been reviewed.
          </p>
        </Card>
      ) : (
        pendingVendors.map(renderVendorCard)
      )}
    </div>
  );

  const venuesList = (
    <div className="space-y-4">
      {pendingVenues.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl mb-4">
            ✓
          </div>
          <h3 className="font-bold text-cream">No pending venues</h3>
          <p className="mt-2 text-sm text-mist">
            All venue registrations have been reviewed.
          </p>
        </Card>
      ) : (
        pendingVenues.map(renderVenueCard)
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface text-cream">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber">
            Provider verification
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-cream sm:text-4xl">
            Approvals
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-mist sm:text-base">
            Review and approve vendor and venue registrations before they
            become public on EventFlow.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab('vendors')}
            variant={activeTab === 'vendors' ? 'primary' : 'outline'}
            className="px-6"
          >
            Vendors ({pendingVendors.length})
          </Button>
          <Button
            onClick={() => setActiveTab('venues')}
            variant={activeTab === 'venues' ? 'primary' : 'outline'}
            className="px-6"
          >
            Venues ({pendingVenues.length})
          </Button>
        </div>

        {activeTab === 'vendors' ? vendorsList : venuesList}

        <div className="mt-8 rounded-2xl border border-line bg-raised p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-fog mb-4">
            How approval works
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-lg text-gold">
                1
              </div>
              <div>
                <p className="font-bold text-cream">Vendor applies</p>
                <p className="mt-1 text-sm text-mist leading-5">
                  Vendor submits profile, portfolio images, and business details.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-lg text-gold">
                2
              </div>
              <div>
                <p className="font-bold text-cream">Admin reviews</p>
                <p className="mt-1 text-sm text-mist leading-5">
                  Admin reviews the application and portfolio media on this page.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-lg text-gold">
                3
              </div>
              <div>
                <p className="font-bold text-cream">Profile goes live</p>
                <p className="mt-1 text-sm text-mist leading-5">
                  Approved vendors appear publicly; media is unlocked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

