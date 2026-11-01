import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Price on request';
  return `GH₵${amount.toLocaleString('en-GH')}`;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('eventflowUser') || 'null');
  } catch {
    return null;
  }
}

function getBookings() {
  try {
    const data = JSON.parse(localStorage.getItem('eventflowBookings') || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default function Payment() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = id || searchParams.get('bookingId') || '';
  const [booking, setBooking] = useState(null);
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('details'); // details | processing | success | failure
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const bookings = getBookings();
    const found = bookings.find((b) => String(b.id) === String(bookingId));
    if (found) {
      setBooking(found);
      setAmount(String(found.agreedPrice || found.finalPrice || found.price || 0));
      const user = getStoredUser();
      if (user?.email) setEmail(user.email);
    }
  }, [bookingId]);

  const customer = getStoredUser();
  const isOrganizer = customer?.accountType === 'organizer';

  const handlePay = () => {
    setError('');
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setProcessing(true);
    setStep('processing');

    // Simulate Paystack processing delay
    const timer = setTimeout(() => {
      // 85% success rate for demo
      const success = Math.random() > 0.15;
      if (success) {
        const bookings = getBookings();
        const updated = bookings.map((b) => {
          if (String(b.id) === String(bookingId)) {
            return {
              ...b,
              paymentStatus: 'paid',
              paymentOption: 'paystack',
              amountPaid: Number(amount),
              transactionId: `PAY-${Date.now().toString().slice(-8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              paymentCompletedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          return b;
        });
        localStorage.setItem('eventflowBookings', JSON.stringify(updated));
        window.dispatchEvent(new Event('eventflow-payment-updated'));
        window.dispatchEvent(new Event('eventflow-bookings-updated'));
        setStep('success');
      } else {
        setStep('failure');
      }
      setProcessing(false);
    }, 2200);

    return () => clearTimeout(timer);
  };

  const finalAmount = booking
    ? booking.agreedPrice || booking.finalPrice || booking.price || 0
    : Number(amount || 0);

  if (step === 'details') {
    return (
      <div className="min-h-screen bg-ink text-cream">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link to="/dashboard/organizer" className="inline-flex items-center gap-2 text-sm font-semibold text-gold transition hover:text-amber">
              <span>←</span> Back to dashboard
            </Link>
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber">
                Secure payment
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-cream sm:text-4xl">
                Complete your payment
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-mist sm:text-base">
                Pay securely for your booking. EventFlow uses Paystack to
                process payments safely.
              </p>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-6 rounded-2xl border border-rose/20 bg-rose/10 p-4 text-sm text-rose">
              {error}
            </div>
          )}

          <Card className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-cream">Booking details</h2>
              <p className="mt-1 text-sm text-mist">
                {booking?.vendorName || 'Event provider'} —{' '}
                {booking?.serviceName || booking?.eventType || 'Event service'}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-mist mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-line bg-raised px-4 py-3.5 text-sm outline-none transition placeholder:text-fog focus:border-gold focus:ring-4 focus:ring-gold/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-mist mb-1">
                  Amount (GH₵)
                </label>
                <div className="mt-2 flex overflow-hidden rounded-xl border border-line bg-raised focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-50">
                  <span className="flex items-center border-r border-line bg-surface px-4 text-sm font-semibold text-mist">
                    GH₵
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="min-w-0 flex-1 px-4 py-3.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-amber/20 bg-amber/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-amber">ℹ️</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Secure checkout powered by Paystack
                    </p>
                    <p className="mt-1 text-xs text-amber">
                      Your payment is encrypted and processed securely. No card
                      details are stored on EventFlow.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-line">
                <p className="text-xs text-mist mb-2">
                  Booking reference:{' '}
                  <span className="font-mono text-sm font-bold text-cream">
                    {bookingId || 'EF-' + Date.now().toString().slice(-8)}
                  </span>
                </p>
                <Button
                  onClick={handlePay}
                  disabled={processing || !email || !amount}
                  variant="gold"
                  className="w-full py-4"
                >
                  {processing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white mr-2"></span>
                      Processing payment...
                    </>
                  ) : (
                    'Pay now'
                  )}
                </Button>
                <p className="mt-3 text-xs text-center text-fog">
                  By paying, you agree to EventFlow's Terms of Service.
                </p>
              </div>
            </div>
          </Card>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card padding="p-5" className="border-transparent bg-raised shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-lg text-gold mb-3">
                🔒
              </div>
              <h3 className="font-bold text-cream">Secure encryption</h3>
              <p className="mt-1 text-xs text-mist leading-5">
                All payments are encrypted with industry-standard security.
              </p>
            </Card>
            <Card padding="p-5" className="border-transparent bg-raised shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600 mb-3">
                ✓
              </div>
              <h3 className="font-bold text-cream">Instant confirmation</h3>
              <p className="mt-1 text-xs text-mist leading-5">
                Get immediate confirmation once your payment is successful.
              </p>
            </Card>
            <Card padding="p-5" className="border-transparent bg-raised shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/10 text-lg text-amber mb-3">
                🤝
              </div>
              <h3 className="font-bold text-cream">Paystack trusted</h3>
              <p className="mt-1 text-xs text-mist leading-5">
                Processed by Paystack, a leading payment gateway in Ghana.
              </p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-ink text-cream">
        <Navbar />
        <main className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4 py-16 sm:px-6">
          <Card className="p-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="mx-auto h-16 w-16 rounded-full border-4 border-gold/20 border-t-indigo-600"
            />
            <h2 className="mt-6 text-xl font-bold text-cream">
              Processing your payment
            </h2>
            <p className="mt-2 text-sm text-mist">
              Please wait while we securely process your payment through
              Paystack.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <div className="w-full bg-elevated rounded-full h-2">
                <div className="h-2 w-[70%] rounded-full bg-gradient-to-r from-gold to-amber animate-pulse" />
              </div>
              <p className="text-xs text-fog">Connecting to Paystack...</p>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-ink text-cream">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <Card className="p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-xl font-bold text-cream shadow-sm">
                ✓
              </div>
            </div>
            <h2 className="text-2xl font-bold text-cream">Payment successful!</h2>
            <p className="mt-3 text-sm text-mist">
              Your payment of <span className="font-bold text-emerald-600">{formatMoney(finalAmount)}</span> has been confirmed.
            </p>
            <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-left">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">Transaction details</p>
              <p className="text-sm text-mist">
                <span className="font-bold">Amount:</span> {formatMoney(finalAmount)}<br />
                <span className="font-bold">Method:</span> Paystack<br />
                <span className="font-bold">Status:</span>
                <Badge variant="emerald">Paid</Badge>
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to={`/booking-success/${bookingId}`}
                className="inline-flex items-center justify-center rounded-xl bg-gold px-7 py-3.5 text-sm font-bold text-cream transition hover:bg-gold-dim"
              >
                View booking
              </Link>
              <Link
                to="/dashboard/organizer"
                className="inline-flex items-center justify-center rounded-xl border border-line bg-raised px-7 py-3.5 text-sm font-bold text-mist transition hover:bg-surface"
              >
                Back to dashboard
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // failure
  return (
    <div className="min-h-screen bg-ink text-cream">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose/10 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose/100 text-xl font-bold text-cream shadow-sm">
              !
            </div>
          </div>
          <h2 className="text-2xl font-bold text-cream">Payment failed</h2>
          <p className="mt-3 text-sm text-mist">
            We were unable to process your payment. Please try again or
            contact support if the issue persists.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={handlePay} variant="gold" className="w-full sm:w-auto py-3.5">
              Try again
            </Button>
            <Link
              to="/dashboard/organizer"
              className="inline-flex items-center justify-center rounded-xl border border-line bg-raised px-7 py-3.5 text-sm font-bold text-mist transition hover:bg-surface"
            >
              Back to dashboard
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}

