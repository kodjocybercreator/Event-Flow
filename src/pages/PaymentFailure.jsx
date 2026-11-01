import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function PaymentFailure() {
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
          <h2 className="text-2xl font-bold text-cream">Payment unsuccessful</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-mist sm:text-base mx-auto">
            We could not complete your payment. No money has been deducted
            from your account. Please try again or use a different payment
            method.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="gold" className="w-full sm:w-auto py-3.5">
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

