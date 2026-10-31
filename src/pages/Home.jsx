import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem, pageTransition } from '../components/ui/motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const eventTypes = [
  {
    name: 'Weddings',
    description: 'Venues, vendors & planning',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Birthdays',
    description: 'Make the celebration special',
    image:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Graduations',
    description: 'Celebrate the achievement',
    image:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Corporate Events',
    description: 'Professional spaces & services',
    image:
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Funerals',
    description: 'Find services with care',
    image:
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Conferences',
    description: 'Spaces for meaningful events',
    image:
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=85',
  },
];

const services = [
  {
    title: 'Photography',
    description: 'Capture the moments you will want to remember.',
    icon: '◉',
  },
  {
    title: 'Videography',
    description: 'Professional video coverage for your event.',
    icon: '▶',
  },
  {
    title: 'Decoration',
    description: 'Transform your event space into something special.',
    icon: '✦',
  },
  {
    title: 'DJ & Music',
    description: 'Sound, music and entertainment for your guests.',
    icon: '♪',
  },
  {
    title: 'Event Planning',
    description: 'Get help bringing the details together.',
    icon: '✓',
  },
  {
    title: 'Venues',
    description: 'Discover places that fit your event and guest count.',
    icon: '⌂',
  },
];

const benefits = [
  {
    number: '01',
    title: 'Discover in one place',
    text: 'Stop searching across different pages and social platforms. Explore venues and event professionals from one marketplace.',
  },
  {
    number: '02',
    title: 'Compare before you book',
    text: 'View services, locations and starting prices so you can understand your options before sending a request.',
  },
  {
    number: '03',
    title: 'Work directly with providers',
    text: 'Send your requirements, receive quotations and discuss the details of your event before agreeing on a price.',
  },
];

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-0">
            <div className="absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-indigo-100/60 blur-[120px]" />
            <div className="absolute -bottom-56 -left-48 h-[500px] w-[500px] rounded-full bg-amber-100/40 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:px-8 lg:pb-32 lg:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
              {/* Hero copy */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 shadow-sm"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] text-white">
                    EF
                  </span>
                  Ghana's event marketplace
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="mt-7 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-[-0.02em] text-slate-950 sm:text-6xl lg:text-[4.8rem]"
                >
                  Your event.{' '}
                  <span className="block text-amber-600">
                    Everything in one place.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg"
                >
                  Discover venues, photographers, decorators, DJs and other
                  event professionals around Ghana. Find the right people,
                  compare your options and bring your event together with
                  EventFlow.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9 }}
                  className="mt-9 flex flex-col gap-3 sm:flex-row"
                >
                  <Link
                    to="/discover"
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-indigo-600/40"
                  >
                    Explore EventFlow
                    <span className="ml-2 transition group-hover:translate-x-1">→</span>
                  </Link>

                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-900 transition duration-300 hover:border-amber-300 hover:bg-slate-50 hover:text-indigo-700"
                  >
                    Start planning
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                  className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-500"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span>
                    Verified businesses
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-amber-500">₵</span>
                    Secure payments
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-indigo-500">✓</span>
                    One place to manage bookings
                  </span>
                </motion.div>
              </div>

              {/* Hero visual */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="relative mx-auto w-full max-w-[560px] lg:mx-0"
              >
                <div className="overflow-hidden rounded-[2rem] border border-white bg-white p-2 shadow-[0_25px_80px_-25px_rgba(79,70,229,0.35)]">
                  <div className="relative h-[460px] overflow-hidden rounded-[1.6rem] bg-slate-900 sm:h-[540px]">
                    <img
                      src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=90"
                      alt="Beautiful event setup"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                    <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                      <div className="rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-slate-900 shadow-lg backdrop-blur">
                        EventFlow
                      </div>
                      <div className="rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur">
                        Ghana
                      </div>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-white shadow-xl backdrop-blur-md">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                          Plan with confidence
                        </p>
                        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                          Find the right people for your event.
                        </h2>
                        <div className="mt-5 grid grid-cols-3 gap-2">
                          <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                            <p className="text-lg font-bold">Venues</p>
                            <p className="mt-0.5 text-[11px] text-white/60">
                              Discover
                            </p>
                          </div>
                          <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                            <p className="text-lg font-bold">Vendors</p>
                            <p className="mt-0.5 text-[11px] text-white/60">
                              Compare
                            </p>
                          </div>
                          <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                            <p className="text-lg font-bold">Bookings</p>
                            <p className="mt-0.5 text-[11px] text-white/60">
                              Manage
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating marketplace card */}
                  <div className="absolute -bottom-8 -left-6 hidden rounded-2xl border border-white bg-white p-5 shadow-2xl sm:block sm:-left-10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">
                        ✓
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          Marketplace
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          Find. Compare. Book.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -right-8 top-28 hidden rounded-2xl border border-white bg-white p-5 shadow-2xl sm:block sm:-right-12">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      Starting from
                    </p>
                    <p className="mt-1 text-xl font-extrabold text-slate-950">
                      GH₵1,500
                    </p>
                    <p className="text-xs text-slate-500">
                      Example service price
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Search panel */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="relative z-10 mt-16 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.25)] sm:p-5 lg:mt-24"
              >
                <div className="mb-3 flex items-center gap-3 px-2 sm:px-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 font-bold text-indigo-600">
                    ⌕
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">
                      What are you looking for?
                    </p>
                    <p className="text-xs text-slate-500">
                      Start exploring venues and event professionals.
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 lg:grid-cols-[1.5fr_1.2fr_1fr_auto]">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition hover:border-amber-200 hover:bg-amber-50/40">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Service
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      Photographer, venue, DJ...
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition hover:border-amber-200 hover:bg-amber-50/40">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Location
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      Accra, Kumasi...
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition hover:border-amber-200 hover:bg-amber-50/40">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                      Event
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      Wedding, birthday...
                    </p>
                  </div>
                  <Link
                    to="/discover"
                    className="flex min-h-[58px] items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 px-8 text-sm font-bold text-white transition hover:from-indigo-700 hover:to-amber-700 hover:-translate-y-0.5"
                  >
                    Search
                    <span className="ml-2">→</span>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* EVENT TYPES */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
            >
              <div className="max-w-2xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-600">
                  Start with your event
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  What are you planning?
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                  Whatever the occasion, discover the venues and professionals
                  that can help you make it happen.
                </p>
              </div>
              <Link
                to="/discover"
                className="text-sm font-bold text-indigo-600 transition hover:text-amber-600"
              >
                Explore all events →
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6"
            >
              {eventTypes.map((event) => (
                <Link
                  key={event.name}
                  to="/discover"
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-amber-200 hover:shadow-xl"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-sm font-bold text-white">
                        {event.name}
                      </h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs leading-5 text-slate-500">
                      {event.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                      Explore
                      <span className="transition group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </motion.div>
          </div>
        </section>

        {/* MARKETPLACE INTRO */}
        <section className="border-y border-slate-200 bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="relative">
                <div className="overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=1200&q=90"
                    alt="Event venue setup"
                    className="h-[430px] w-full object-cover sm:h-[500px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                </div>
                <div className="absolute -bottom-8 right-6 rounded-2xl border border-white bg-white p-5 shadow-2xl sm:right-10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Your event
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    One place. Less stress.
                  </p>
                  <div className="mt-3 h-1.5 w-36 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-3/4 rounded-full bg-indigo-600" />
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                className="space-y-8"
              >
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-600">
                    More than a directory
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                    Planning an event shouldn't mean searching everywhere.
                  </h2>
                  <p className="mt-5 text-base leading-7 text-slate-600">
                    EventFlow brings the event marketplace together in one
                    place. Instead of moving between social media pages,
                    messages and different websites, you can discover options,
                    review services and start a booking conversation from one
                    platform.
                  </p>
                </div>

                <div className="mt-4 space-y-5">
                  {[
                    ['01', 'Discover', 'Find venues and event professionals based on what you need.'],
                    ['02', 'Connect', 'Send your event details and receive a quotation from the provider.'],
                    ['03', 'Agree', 'Discuss the requirements and agree on the final service price.'],
                  ].map(([number, title, text]) => (
                    <motion.div
                      key={number}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6 }}
                      className="flex gap-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/30">
                        {number}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-950">{title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {text}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Link
                  to="/discover"
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 px-7 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
                >
                  Explore the marketplace
                  <span className="ml-2">→</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-600">
                  Explore services
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  Find the people behind the event.
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  From the first photo to the final song, discover
                  professionals who can help bring your plans together.
                </p>
              </div>
              <Link
                to="/discover"
                className="text-sm font-bold text-indigo-600 transition hover:text-amber-600"
              >
                View all services →
              </Link>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Link
                  key={service.title}
                  to="/discover"
                  className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-amber-200 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-bold text-indigo-600 transition group-hover:bg-amber-600 group-hover:text-white group-hover:scale-110">
                      {service.icon}
                    </div>
                    <span className="text-slate-300 transition group-hover:text-amber-500">
                      ↗
                    </span>
                  </div>
                  <h3 className="mt-7 text-lg font-bold text-slate-950">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {service.description}
                  </p>
                  <div className="mt-6 flex items-center text-sm font-bold text-indigo-600">
                    Explore
                    <span className="ml-2 transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* VENUE SECTION */}
        <section className="bg-slate-950 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="text-white">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-400">
                  Find your space
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  The right venue can change the whole event.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
                  Discover event centres, gardens, hotels, conference spaces
                  and other locations that fit the type of event you're
                  planning.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {[
                    'Event centres',
                    'Outdoor spaces',
                    'Hotels',
                    'Conference spaces',
                  ].map((item) => (
                    <Link
                      key={item}
                      to="/venues"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 hover:bg-white/10"
                    >
                      {item}
                      <span className="ml-2 text-amber-400">→</span>
                    </Link>
                  ))}
                </div>
                <Link
                  to="/venues"
                  className="mt-8 inline-flex rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-indigo-50"
                >
                  Explore venues
                  <span className="ml-2">→</span>
                </Link>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-3">
                  <div className="overflow-hidden rounded-3xl">
                    <img
                      src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85"
                      alt="Event venue"
                      className="h-64 w-full object-cover sm:h-80"
                    />
                  </div>
                  <div className="mt-10 overflow-hidden rounded-3xl">
                    <img
                      src="https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=85"
                      alt="Outdoor event venue"
                      className="h-64 w-full object-cover sm:h-80"
                    />
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white shadow-xl backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    EventFlow
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    Your event starts with the right space.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY EVENTFLOW */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-600">
                Why EventFlow
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                A simpler way to organise the important details.
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {benefits.map((benefit) => (
                <motion.div
                  key={benefit.number}
                  whileHover={{ y: -5 }}
                  className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-amber-200 hover:shadow-lg"
                >
                  <span className="text-xs font-extrabold tracking-widest text-amber-600">
                    {benefit.number}
                  </span>
                  <h3 className="mt-6 text-xl font-bold text-slate-950">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {benefit.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-600">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                From idea to agreement.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                EventFlow keeps the process simple, so you can focus on
                planning your event instead of chasing providers.
              </p>
            </div>
            <div className="relative mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  number: '1',
                  title: 'Tell us what you need',
                  text: 'Create your event and share the important details, including date, location, guests and requirements.',
                },
                {
                  number: '2',
                  title: 'Discover & request',
                  text: 'Explore providers, review their services and send a booking request to the ones that fit your event.',
                },
                {
                  number: '3',
                  title: 'Agree & book',
                  text: 'Review the quotation, discuss the details and agree on the final price before your booking is confirmed.',
                },
              ].map((step) => (
                <motion.div
                  key={step.number}
                  whileHover={{ y: -5 }}
                  className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-amber-200 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-amber-600 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/25">
                    {step.number}
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {step.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* BUSINESS SECTION */}
        <section id="businesses" className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] bg-indigo-600">
              <div className="grid lg:grid-cols-[1fr_0.85fr]">
                <div className="px-7 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-200">
                    For event businesses
                  </p>
                  <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    Put your business in front of people planning their next
                    event.
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-7 text-indigo-100">
                    EventFlow gives venues and event professionals a place to
                    showcase their services, receive booking requests and
                    manage conversations with organizers.
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {[
                      'Showcase your services',
                      'Reach event organizers',
                      'Receive booking requests',
                      'Manage your bookings',
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 text-sm font-semibold text-white"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs">
                          ✓
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-900 p-6 sm:p-8 lg:p-10">
                  <div className="grid gap-4">
                    <div className="rounded-2xl bg-white p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                          ⌂
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-950">
                            Own a venue?
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            Showcase your event space and connect with
                            organizers.
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/register/venue"
                        className="mt-5 flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                      >
                        Register your venue
                        <span className="ml-2">→</span>
                      </Link>
                    </div>
                    <div className="rounded-2xl bg-slate-100 p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
                          ✦
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-950">
                            Provide event services?
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            Build your profile and let organizers discover
                            what you offer.
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/register/vendor"
                        className="mt-5 flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-200"
                      >
                        Join as a vendor
                        <span className="ml-2">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-slate-50 px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-amber-600 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/30">
              EF
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Your event starts here.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Find the places, people and services that can bring your plans
              together. Explore EventFlow and start building your event.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/discover"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:shadow-indigo-600/40"
              >
                Explore EventFlow →
              </Link>
              <Link
                to="/register"
                className="rounded-xl border border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
              >
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </motion.div>
  );
}
