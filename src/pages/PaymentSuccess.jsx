import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `GH₵${amount.toLocaleString('en-GH')}`;
}

export default function PaymentSuccess() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    try {
      const bookings = JSON.parse(localStorage.getItem('eventflowBookings') || '[]');
      const found = Array.isArray(bookings)
        ? bookings.find((item) => String(item?.id) === String(id))
        : null;
      if (found) setBooking(found);
    } catch {}
  }, [id]);

  const paidAmount = booking?.amountPaid || 0;
  const formatted = formatMoney(paidAmount);

  return (
    <div className="min-h-screen bg-ink text-cream">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/dashboard/organizer" className="inline-flex items-center gap-2 text-sm font-semibold text-gold transition hover:text-amber">
            <span>←</span> Back to dashboard
          </Link>
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
              Payment confirmed
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-cream sm:text-4xl">
              Payment successful
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-mist sm:text-base">
              Your booking payment has been confirmed. The provider has been
              notified and your event is secured.
            </p>
          </div>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-cream">Booking summary</h2>
              <p className="mt-1 text-sm text-mist">
                {booking?.vendorName || 'Event provider'} —{' '}
                {booking?.serviceName || booking?.eventType || 'Event service'}
              </p>
            </div>
            <div className="text-right sm:text-left">
              <p className="text-xs text-fog">Amount paid</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatted || 'GH₵0'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-raised p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-fog">Booking reference</p>
              <p className="mt-1 font-mono text-sm font-bold text-cream">
                {booking?.id || '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-raised p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-fog">Payment status</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-bold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Paid
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/dashboard/organizer" className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-3.5 text-sm font-bold text-cream transition hover:bg-gold-dim">
              View my dashboard
            </Link>
            <Link to="/discover" className="inline-flex items-center justify-center rounded-xl border border-line bg-raised px-7 py-3.5 text-sm font-bold text-mist transition hover:bg-surface">
              Continue exploring
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}

