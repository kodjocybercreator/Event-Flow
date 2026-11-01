import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-charcoal text-paper">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-none bg-ink text-paper font-black text-lg shadow-lg">
                EF
              </div>
              <span className="text-xl font-bold tracking-tight text-paper">
                Event<span className="text-gold">Flow</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-400">
              The premier event marketplace in Ghana. Discover, connect, and
              celebrate with confidence.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-none border border-paper/10 bg-paper/5 text-paper hover:bg-gold hover:border-gold hover:text-paper transition"
              >
                𝕏
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-none border border-paper/10 bg-paper/5 text-paper hover:bg-gold hover:border-gold hover:text-paper transition"
              >
                ᚠ
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-none border border-paper/10 bg-paper/5 text-paper hover:bg-gold hover:border-gold hover:text-paper transition"
              >
                𝗶
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-paper mb-6">
              Platform
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <Link
                  to="/discover"
                  className="transition hover:text-gold"
                >
                  Discover
                </Link>
              </li>
              <li>
                <Link to="/register" className="transition hover:text-gold">
                  Create an Event
                </Link>
              </li>
              <li>
                <Link to="/login" className="transition hover:text-gold">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/venues" className="transition hover:text-gold">
                  Venues
                </Link>
              </li>
            </ul>
          </div>

          {/* Businesses */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-paper mb-6">
              For Businesses
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <Link
                  to="/register/vendor"
                  className="transition hover:text-gold"
                >
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  to="/register/venue"
                  className="transition hover:text-gold"
                >
                  List Your Venue
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="transition hover:text-gold"
                >
                  Business Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-paper mb-6">
              Support
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <a href="#" className="transition hover:text-gold">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-gold">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-gold">
                  Terms & Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-6 border-t border-slate-800 pt-8 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} EventFlow. All rights reserved.
          </p>
          <p className="text-gold font-bold">Built for Ghana 🇬🇭</p>
        </div>
      </div>
    </footer>
  );
}
