import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-amber-600 text-lg font-black text-white shadow-lg">
                EF
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Event<span className="text-amber-400">Flow</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-6 text-slate-400">
              The premier event marketplace in Ghana. Discover, connect, and
              celebrate with confidence.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-amber-600 hover:border-amber-600 transition"
              >
                𝕏
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-amber-600 hover:border-amber-600 transition"
              >
                ᚠ
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:bg-amber-600 hover:border-amber-600 transition"
              >
                𝗶
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
              Platform
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <Link
                  to="/discover"
                  className="transition hover:text-white hover:pl-1"
                >
                  Discover
                </Link>
              </li>
              <li>
                <Link to="/register" className="transition hover:text-white hover:pl-1">
                  Create an Event
                </Link>
              </li>
              <li>
                <Link to="/login" className="transition hover:text-white hover:pl-1">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/venues" className="transition hover:text-white hover:pl-1">
                  Venues
                </Link>
              </li>
            </ul>
          </div>

          {/* Businesses */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
              For Businesses
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <Link
                  to="/register/vendor"
                  className="transition hover:text-white hover:pl-1"
                >
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  to="/register/venue"
                  className="transition hover:text-white hover:pl-1"
                >
                  List Your Venue
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="transition hover:text-white hover:pl-1"
                >
                  Business Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
              Support
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <a href="#" className="transition hover:text-white hover:pl-1">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white hover:pl-1">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white hover:pl-1">
                  Terms & Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} EventFlow. All rights reserved.
          </p>
          <p className="text-amber-500 font-medium">Built for Ghana 🇬🇭</p>
        </div>
      </div>
    </footer>
  );
}
