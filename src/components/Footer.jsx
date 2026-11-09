import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-dim text-cream font-black text-lg shadow-lg shadow-gold/20">
                EF
              </div>
              <span className="text-xl font-bold tracking-tight text-cream">
                Event<span className="text-gold">Flow</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-mist">
              Ghana's premier event marketplace. Discover, connect, and
              celebrate with confidence.
            </p>
            <div className="mt-6 flex gap-3">
              {['𝕏', 'ⓕ', '◉'].map((icon) => (
                <a
                  href="#"
                  key={icon}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-raised text-mist transition-all hover:border-gold/30 hover:bg-gold/10 hover:text-gold"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Platform
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-mist">
              <li>
                <Link to="/discover" className="transition-colors hover:text-cream">
                  Discover
                </Link>
              </li>
              <li>
                <Link to="/register" className="transition-colors hover:text-cream">
                  Create an Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="transition-colors hover:text-cream">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/venues" className="transition-colors hover:text-cream">
                  Venues
                </Link>
              </li>
            </ul>
          </div>

          {/* Businesses */}
          <div>
            <h3 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              For Businesses
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-mist">
              <li>
                <Link to="/register/vendor" className="transition-colors hover:text-cream">
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link to="/register/venue" className="transition-colors hover:text-cream">
                  List Your Venue
                </Link>
              </li>
              <li>
                <Link to="/register" className="transition-colors hover:text-cream">
                  Business Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-gold">
              Support
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-mist">
              <li>
                <a href="#" className="transition-colors hover:text-cream">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-cream">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-cream">
                  Terms & Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-6 border-t border-line pt-8 text-xs text-fog sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} EventFlow. All rights reserved.
          </p>
          <p className="font-semibold text-gold">Built for Ghana 🇬🇭</p>
        </div>
      </div>
    </footer>
  );
}
