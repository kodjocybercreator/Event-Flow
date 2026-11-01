import { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Skeleton } from '../components/ui/Skeleton';

const BOOKINGS_KEY = 'eventflowBookings';

function getJson(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function formatMoney(value) {
  const amount = Number(value || 0);
  return `GH₵${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GH', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
function getProviderName(booking) {
  return booking?.vendorName || booking?.venueName || booking?.providerName || 'Provider';
}

function getBookingAmount(booking) {
  return Number(
    booking?.agreedPrice ??
      booking?.finalPrice ??
      booking?.quotedPrice ??
      booking?.price ??
      0,
  );
}
function getAmountPaid(booking) {
  if (booking?.amountPaid !== undefined) return Number(booking.amountPaid || 0);
  const status = String(booking?.paymentStatus || '').toLowerCase();
  if (status === 'paid') return getBookingAmount(booking);
  if (status === 'deposit_paid') return Number(booking?.depositAmount || getBookingAmount(booking) * 0.5);
  return 0;
}

export default function AdminAnalytics() {
  const [admin, setAdmin] = useState(null);
  const [bookings, setBookings] = useState([]);

  const loadData = useCallback(() => {
    try {
      const storedAdmin = JSON.parse(localStorage.getItem('eventflowAdmin') || 'null');
      if (!storedAdmin || storedAdmin.role !== 'admin') return;
      setAdmin(storedAdmin);
      setBookings(getJson(BOOKINGS_KEY, []));
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('eventflow-bookings-updated', loadData);
    window.addEventListener('eventflow-payment-updated', loadData);
    window.addEventListener('storage', loadData);
    return () => {
      window.removeEventListener('eventflow-bookings-updated', loadData);
      window.removeEventListener('eventflow-payment-updated', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, [loadData]);

  const platformValue = useMemo(() =>
    bookings.reduce((t, b) => t + getBookingAmount(b), 0),
  [bookings]);
  const collectedAmount = useMemo(() =>
    bookings.reduce((t, b) => t + getAmountPaid(b), 0),
  [bookings]);
  const outstandingAmount = useMemo(() =>
    bookings.reduce((t, b) => t + Math.max(getBookingAmount(b) - getAmountPaid(b), 0), 0),
  [bookings]);
  const completedPayments = useMemo(() =>
    bookings.filter((b) => String(b.paymentStatus || '').toLowerCase() === 'paid').length,
  [bookings]);
  const pendingPayments = useMemo(() =>
    bookings.filter((b) => String(b.paymentStatus || '').toLowerCase() === 'unpaid').length,
  [bookings]);

  const recentTransactions = useMemo(() =>
    [...bookings]
      .filter((b) => getBookingAmount(b) > 0 || Number(b.amountPaid || 0) > 0 || b.paymentStatus)
      .sort((a, b) =>
        new Date(b.paymentCompletedAt || b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.paymentCompletedAt || a.updatedAt || a.createdAt || 0).getTime()
      )
      .slice(0, 10),
  [bookings]);

  return (
    <div className="min-h-screen bg-surface text-cream">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber">
            Platform analytics
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-cream sm:text-4xl">
            Analytics
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-mist sm:text-base">
            Overview of platform activity, bookings and payments.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard value={formatMoney(platformValue)} label="Booking value" icon="₵" detail="Total value of all bookings" />
          <StatCard value={formatMoney(collectedAmount)} label="Collected" icon="✓" detail="Amount paid by customers" />
          <StatCard value={formatMoney(outstandingAmount)} label="Outstanding" icon="○" detail="Remaining balance to collect" />
          <StatCard value={bookings.length} label="Total bookings" icon="▣" detail={`${completedPayments} paid · ${pendingPayments} pending`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <Card className="lg:col-span-2 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-cream">Recent transactions</h2>
                <p className="text-sm text-mist">Latest payment activity on the platform.</p>
              </div>
              <Button to="/admin" variant="outline" size="sm" asChild className="px-4">
                View all
              </Button>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-surface">
                <Skeleton.circle className="mb-3" />
                <p className="text-sm text-mist">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <div key={tx.id || tx.bookingId || Math.random()} className="flex items-center justify-between gap-4 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                        ▣
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-cream truncate">
                          {getProviderName(tx)}
                        </p>
                        <p className="mt-0.5 text-xs text-mist truncate">
                          {tx.eventName || tx.serviceName || 'Event booking'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-cream">
                        {formatMoney(getAmountPaid(tx))}
                      </p>
                      <p className="mt-0.5 text-xs text-fog">
                        {formatDate(tx.paymentCompletedAt || tx.updatedAt || tx.createdAt)}
                      </p>
                      <Badge
                        variant={String(tx.paymentStatus || '').toLowerCase() === 'paid' ? 'emerald' : 'amber'}
                        size="sm"
                      >
                        {tx.paymentStatus || 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card p="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-cream mb-6">Platform status</h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-mist">Paid bookings</span>
                  <span className="text-sm font-bold text-cream">{completedPayments}</span>
                </div>
                <div className="w-full bg-elevated rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: bookings.length ? Math.round((completedPayments / bookings.length) * 100) : 0 }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-mist">Pending payments</span>
                  <span className="text-sm font-bold text-cream">{pendingPayments}</span>
                </div>
                <div className="w-full bg-elevated rounded-full h-2">
                  <div className="bg-amber/100 h-2 rounded-full" style={{ width: bookings.length ? Math.round((pendingPayments / bookings.length) * 100) : 0 }} />
                </div>
              </div>
              <div className="pt-4 border-t border-line">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-cream">Collection rate</span>
                  <span className="text-sm font-bold text-cream">
                    {bookings.length ? Math.round((completedPayments / bookings.length) * 100) : 0}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-fog">
                  Share of bookings fully paid.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="rounded-2xl border border-line bg-raised p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-fog mb-4">
            About this data
          </h3>
          <p className="text-sm text-mist leading-6">
            This is a demo mockup. All data is stored in your browser's
            localStorage and resets when cleared. Payment processing is
            simulated — no real money is transferred. Connect a real backend
            and Paystack integration for production use.
          </p>
        </div>
      </main>
    </div>
  );
}

