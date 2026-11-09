import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { FadeIn } from "../components/ui/FadeIn";

const eventTypes = [
  {
    name: "Weddings",
    description: "Venues, vendors & planning",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=75",
  },
  {
    name: "Birthdays",
    description: "Make the celebration special",
    image:
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=75",
  },
  {
    name: "Graduations",
    description: "Celebrate the achievement",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=75",
  },
  {
    name: "Corporate Events",
    description: "Professional spaces & services",
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=75",
  },
  {
    name: "Funerals",
    description: "Find services with care",
    image:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=75",
  },
  {
    name: "Conferences",
    description: "Spaces for meaningful events",
    image:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=75",
  },
];

const services = [
  {
    title: "Photography",
    description: "Capture the moments you will want to remember.",
    icon: "◉",
  },
  {
    title: "Videography",
    description: "Professional video coverage for your event.",
    icon: "▶",
  },
  {
    title: "Decoration",
    description: "Transform your event space into something special.",
    icon: "✦",
  },
  {
    title: "DJ & Music",
    description: "Sound, music and entertainment for your guests.",
    icon: "♪",
  },
  {
    title: "Event Planning",
    description: "Get help bringing the details together.",
    icon: "✓",
  },
  {
    title: "Venues",
    description: "Discover places that fit your event and guest count.",
    icon: "⌂",
  },
];

const benefits = [
  {
    number: "01",
    title: "Discover in one place",
    text: "Stop searching across different pages and social platforms. Explore venues and event professionals from one marketplace.",
  },
  {
    number: "02",
    title: "Compare before you book",
    text: "View services, locations and starting prices so you can understand your options before sending a request.",
  },
  {
    number: "03",
    title: "Work directly with providers",
    text: "Send your requirements, receive quotations and discuss the details of your event before agreeing on a price.",
  },
];

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-paper text-cream"
    >
      <Navbar />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-paper">
          <div className="absolute inset-0">
            <div className="absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-gold/10 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 pb-32 pt-20 sm:px-8 sm:pb-36 sm:pt-24 lg:px-12 lg:pb-40 lg:pt-28">
            <div className="grid items-start gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
              {/* Hero copy */}
              <div>
                <FadeIn delay={0.1} className="mb-6">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-gold bg-gold/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-xl bg-gold text-[10px] text-cream">
                      EF
                    </span>
                    Ghana's event marketplace
                  </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                  <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mt-8 max-w-3xl text-5xl font-bold tracking-tight text-cream sm:text-7xl lg:text-8xl leading-[1]"
                  >
                    Your event.{' '}
                    <span className="block text-gold">
                      Everything in one place.
                    </span>
                  </motion.h1>
                </FadeIn>

                <FadeIn delay={0.3}>
                  <motion.p
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9 }}
                    className="mt-8 max-w-xl text-lead sm:text-xl"
                  >
                    Discover venues, photographers, decorators, DJs and other
                    event professionals around Ghana. Find the right people,
                    compare your options and bring your event together with
                    EventFlow.
                  </motion.p>
                </FadeIn>

                <FadeIn delay={0.4}>
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="mt-10 flex flex-col gap-4 sm:flex-row"
                  >
                    <Link
                      to="/discover"
                      className="btn-primary"
                    >
                      Explore EventFlow
                      <span className="ml-2">→</span>
                    </Link>

                    <Link
                      to="/register"
                      className="btn-outline"
                    >
                      Start planning
                    </Link>
                  </motion.div>
                </FadeIn>

                <FadeIn delay={0.5}>
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="mt-12 flex flex-wrap items-start gap-x-8 gap-y-4 text-sm text-slate"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-gold">✓</span>
                      Verified businesses
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-gold">₵</span>
                      Secure payments
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-cream">✓</span>
                      One place to manage bookings
                    </span>
                  </motion.div>
                </FadeIn>
              </div>

              {/* Hero visual */}
              <FadeIn delay={0.3}>
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="relative mx-auto w-full max-w-[560px] lg:mx-0"
                >
                  <div className="overflow-hidden border border-line bg-surface p-2 shadow-lg">
                    <div className="relative h-[500px] overflow-hidden rounded-lg bg-paper sm:h-[600px]">
                      <img
                        src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=75"
                        alt="Beautiful event setup"
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
                        <div className="border border-line bg-paper px-3 py-1 text-xs font-bold text-cream">
                          EventFlow
                        </div>
                        <div className="border border-line bg-paper px-3 py-1 text-xs font-bold text-cream">
                          Ghana
                        </div>
                      </div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <div className="border border-gold bg-paper p-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                            Plan with confidence
                          </p>
                          <h2 className="mt-2 text-2xl font-bold text-cream sm:text-3xl">
                            Find the right people for your event.
                          </h2>
                          <div className="mt-5 grid grid-cols-3 gap-2">
                            <div className="p-3 bg-gold/10">
                              <p className="text-lg font-bold text-cream">Venues</p>
                              <p className="mt-0.5 text-[10px] text-gold">
                                Discover
                              </p>
                            </div>
                            <div className="p-3 bg-gold/10">
                              <p className="text-lg font-bold text-cream">Vendors</p>
                              <p className="mt-0.5 text-[10px] text-gold">
                                Compare
                              </p>
                            </div>
                            <div className="p-3 bg-gold/10">
                              <p className="text-lg font-bold text-cream">Bookings</p>
                              <p className="mt-0.5 text-[10px] text-gold">
                                Manage
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute -bottom-8 -left-6 hidden rounded-xl border border-line bg-paper p-5 shadow-lg sm:block sm:-left-10">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold text-lg text-cream">
                          ✓
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate">
                            Marketplace
                          </p>
                          <p className="mt-0.5 text-sm font-bold text-cream">
                            Find. Compare. Book.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="absolute -right-8 top-28 hidden rounded-xl border border-line bg-paper p-5 shadow-lg sm:block sm:-right-12">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate">
                        Starting from
                      </p>
                      <p className="mt-1 text-xl font-bold text-cream">
                        GH₵1,500
                      </p>
                      <p className="text-xs text-slate">
                        Example service price
                      </p>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>

              {/* Search panel */}
              <FadeIn delay={0.5}>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                  className="relative z-10 mt-16 border border-line bg-paper p-6 shadow-lg sm:p-8 lg:mt-24"
                >
                  <div className="mb-4 flex items-center gap-3 px-2 sm:px-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold text-lg text-cream">
                      ⌕
                    </div>
                    <div>
                      <p className="text-sm font-bold text-cream">
                        What are you looking for?
                      </p>
                      <p className="text-xs text-slate">
                        Start exploring venues and event professionals.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 lg:grid-cols-[1.5fr_1.2fr_1fr_auto]">
                    <div className="rounded-lg border border-line bg-gold/10 px-4 py-4 transition hover:border-gold/30">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fog">
                        Service
                      </p>
                      <p className="mt-1 text-sm font-bold text-cream">
                        Photographer, venue, DJ...
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-gold/10 px-4 py-4 transition hover:border-gold/30">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fog">
                        Location
                      </p>
                      <p className="mt-1 text-sm font-bold text-cream">
                        Accra, Kumasi...
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-gold/10 px-4 py-4 transition hover:border-gold/30">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fog">
                        Event
                      </p>
                      <p className="mt-1 text-sm font-bold text-cream">
                        Wedding, birthday...
                      </p>
                    </div>
                    <Link
                      to="/discover"
                      className="flex min-h-[56px] items-center justify-center rounded-xl bg-paper px-10 text-xs font-bold uppercase tracking-[0.15em] text-cream transition-colors duration-200 hover:bg-gold hover:text-cream"
                    >
                      Search
                      <span className="ml-2">→</span>
                    </Link>
                  </div>
                </motion.div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* EVENT TYPES */}
        <section className="bg-paper py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <FadeIn>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
              >
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                    Start with your event
                  </p>
                  <h2 className="mt-4 text-4xl font-bold tracking-tight text-cream sm:text-5xl lg:text-6xl leading-[1]">
                    What are you planning?
                  </h2>
                  <p className="mt-6 max-w-xl text-lead sm:text-xl">
                    Whatever the occasion, discover the venues and professionals
                    that can help you make it happen.
                  </p>
                </div>
                <Link
                  to="/discover"
                  className="text-sm font-bold text-cream transition-colors hover:text-gold"
                >
                  Explore all events →
                </Link>
              </motion.div>
            </FadeIn>

            <FadeIn>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6"
              >
                {eventTypes.map((event) => (
                  <Link
                    key={event.name}
                    to="/discover"
                    className="group overflow-hidden border border-line bg-paper shadow-sm transition-colors duration-300 hover:border-line hover:shadow-lg"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-sm font-bold text-cream">
                          {event.name}
                        </h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-xs leading-6 text-slate">
                        {event.description}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] text-gold">
                        Explore
                        <span className="transition group-hover:translate-x-1">→</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </motion.div>
            </FadeIn>
          </div>
        </section>

        {/* MARKETPLACE INTRO */}
        <section className="border-y border-line bg-gold/10 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid items-start gap-16 lg:grid-cols-2">
              <div className="relative">
                <div className="overflow-hidden border border-line bg-paper shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1478146896981-b80fe463b330?auto=format&fit=crop&w=800&q=75"
                    alt="Event venue setup"
                    className="h-[430px] w-full object-cover sm:h-[500px]"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                </div>
                <div className="absolute -bottom-8 right-6 rounded-xl border border-line-bright bg-paper p-5 shadow-lg sm:right-10">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-fog">
                    Your event
                  </p>
                  <p className="mt-1 text-sm font-bold text-cream">
                    One place. Less stress.
                  </p>
                  <div className="mt-4 h-1.5 w-36 overflow-hidden rounded-xl bg-elevated">
                    <div className="h-full w-3/4 rounded-xl bg-gold" />
                  </div>
                </div>
              </div>

              <FadeIn>
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7 }}
                  className="space-y-8"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                      More than a directory
                    </p>
                    <h2 className="mt-4 text-4xl font-bold tracking-tight text-cream sm:text-5xl lg:text-6xl leading-[1]">
                      Planning an event shouldn't mean searching everywhere.
                    </h2>
                    <p className="mt-6 text-lead sm:text-xl">
                      EventFlow brings the event marketplace together in one
                      place. Instead of moving between social media pages,
                      messages and different websites, you can discover options,
                      review services and start a booking conversation from one
                      platform.
                    </p>
                  </div>

                  <div className="mt-6 space-y-6">
                    {[
                      ["01", "Discover", "Find venues and event professionals based on what you need."],
                      ["02", "Connect", "Send your event details and receive a quotation from the provider."],
                      ["03", "Agree", "Discuss the requirements and agree on the final service price."],
                    ].map(([number, title, text]) => (
                      <motion.div
                        key={number}
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex gap-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper text-xs font-bold text-cream shadow-lg">
                          {number}
                        </div>
                        <div>
                          <h3 className="font-bold text-cream">{title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate">
                            {text}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <Link
                    to="/discover"
                    className="inline-flex items-center rounded-xl bg-paper px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] text-cream transition-colors duration-200 hover:bg-gold hover:text-cream"
                  >
                    Explore the marketplace
                    <span className="ml-2">→</span>
                  </Link>
                </motion.div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="bg-paper py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                  Explore services
                </p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight text-cream sm:text-5xl lg:text-6xl leading-[1]">
                  Find the people behind the event.
                </h2>
                <p className="mt-6 text-lead sm:text-xl">
                  From the first photo to the final song, discover
                  professionals who can help bring your plans together.
                </p>
              </div>
              <Link
                to="/discover"
                className="text-sm font-bold text-cream transition-colors hover:text-gold"
              >
                View all services →
              </Link>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Link
                  key={service.title}
                  to="/discover"
                  className="group overflow-hidden border border-line bg-paper p-8 shadow-sm transition-colors duration-300 hover:border-line hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-lg font-bold text-gold group-hover:bg-gold group-hover:text-cream">
                      {service.icon}
                    </div>
                    <span className="text-fog transition group-hover:text-gold">
                      ↗
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-bold text-cream">
                    {service.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-slate">
                    {service.description}
                  </p>
                  <div className="mt-8 flex items-center text-sm font-bold text-cream">
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
        <section className="bg-paper py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid items-start gap-16 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="text-cream">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                  Find your space
                </p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight text-cream sm:text-5xl lg:text-6xl leading-[1]">
                  The right venue can change the whole event.
                </h2>
                <p className="mt-6 max-w-xl text-sm leading-8 text-fog sm:text-base">
                  Discover event centres, gardens, hotels, conference spaces
                  and other locations that fit the type of event you're
                  planning.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {[
                    "Event centres",
                    "Outdoor spaces",
                    "Hotels",
                    "Conference spaces",
                  ].map((item) => (
                    <Link
                      key={item}
                      to="/venues"
                      className="rounded-xl border border-line-bright bg-paper px-4 py-4 text-sm font-bold text-fog transition hover:border-gold/40 hover:bg-gold/10"
                    >
                      {item}
                      <span className="ml-2 text-gold">→</span>
                    </Link>
                  ))}
                </div>
                <Link
                  to="/venues"
                  className="mt-8 inline-flex rounded-xl bg-paper px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] text-cream transition-colors hover:bg-gold hover:text-cream"
                >
                  Explore venues
                  <span className="ml-2">→</span>
                </Link>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-3">
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=75"
                      alt="Event venue"
                      className="h-64 w-full object-cover sm:h-80"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="mt-10 overflow-hidden rounded-lg">
                    <img
                      src="https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=600&q=75"
                      alt="Outdoor event venue"
                      className="h-64 w-full object-cover sm:h-80"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
                <div className="absolute bottom-6 left-6 rounded-xl border border-line-bright bg-paper p-4 shadow-lg">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fog">
                    EventFlow
                  </p>
                  <p className="mt-1 text-sm font-bold text-cream">
                    Your event starts with the right space.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY EVENTFLOW */}
        <section className="bg-paper py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                Why EventFlow
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight text-cream sm:text-5xl lg:text-6xl leading-[1]">
                A simpler way to organise the important details.
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {benefits.map((benefit) => (
                <motion.div
                  key={benefit.number}
                  whileHover={{ y: -8 }}
                  className="overflow-hidden border border-line bg-paper p-8 shadow-sm transition-colors duration-300 hover:border-line hover:shadow-lg"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                    {benefit.number}
                  </span>
                  <h3 className="mt-6 text-lg font-bold text-cream">
                    {benefit.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-slate">
                    {benefit.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="bg-gold/10 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                How it works
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight text-cream sm:text-5xl lg:text-6xl leading-[1]">
                From idea to agreement.
              </h2>
              <p className="mt-6 text-lead sm:text-xl">
                EventFlow keeps the process simple, so you can focus on
                planning your event instead of chasing providers.
              </p>
            </div>
            <div className="relative mt-16 grid gap-6 md:grid-cols-3">
              {[
                {
                  number: "1",
                  title: "Tell us what you need",
                  text: "Create your event and share the important details, including date, location, guests and requirements.",
                },
                {
                  number: "2",
                  title: "Discover & request",
                  text: "Explore providers, review their services and send a booking request to the ones that fit your event.",
                },
                {
                  number: "3",
                  title: "Agree & book",
                  text: "Review the quotation, discuss the details and agree on the final price before your booking is confirmed.",
                },
              ].map((step) => (
                <motion.div
                  key={step.number}
                  whileHover={{ y: -8 }}
                  className="relative overflow-hidden border border-line bg-paper p-8 shadow-sm transition-colors duration-300 hover:border-line hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold text-sm font-bold text-cream shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-cream">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-slate">
                    {step.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* BUSINESS SECTION */}
        <section id="businesses" className="bg-paper py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="overflow-hidden border border-line bg-paper">
              <div className="grid lg:grid-cols-[1fr_0.85fr]">
                <div className="px-8 py-16 sm:px-10 sm:py-20 lg:px-14 lg:py-24">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
                    For event businesses
                  </p>
                  <h2 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-cream sm:text-5xl lg:text-6xl leading-[1]">
                    Put your business in front of people planning their next
                    event.
                  </h2>
                  <p className="mt-6 max-w-xl text-sm leading-8 text-gold sm:text-base">
                    EventFlow gives venues and event professionals a place to
                    showcase their services, receive booking requests and
                    manage conversations with organizers.
                  </p>
                  <div className="mt-10 grid gap-3 sm:grid-cols-2">
                    {[
                      "Showcase your services",
                      "Reach event organizers",
                      "Receive booking requests",
                      "Manage your bookings",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 text-sm font-bold text-cream"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-paper text-xs text-gold">
                          ✓
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-paper p-6 sm:p-8 lg:p-10">
                  <div className="grid gap-4">
                    <div className="rounded-xl bg-paper p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-paper text-xl text-cream">
                          ⌂
                        </div>
                        <div>
                          <h3 className="font-bold text-cream">
                            Own a venue?
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-gold">
                            Showcase your event space and connect with
                            organizers.
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/register/venue"
                        className="mt-6 inline-flex items-center justify-center rounded-xl bg-gold px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-cream transition-colors hover:bg-paper hover:text-cream"
                      >
                        Register your venue
                        <span className="ml-2">→</span>
                      </Link>
                    </div>
                    <div className="rounded-xl border border-line-bright bg-paper p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-paper text-xl text-cream">
                          ✦
                        </div>
                        <div>
                          <h3 className="font-bold text-cream">
                            Provide event services?
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-gold">
                            Build your profile and let organizers discover
                            what you offer.
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/register/vendor"
                        className="mt-6 inline-flex items-center justify-center rounded-xl border border-line-bright bg-transparent px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-cream transition-colors hover:bg-paper hover:text-cream"
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
        <section className="bg-gold/10 px-6 py-24 sm:px-8 sm:py-32 lg:px-12 lg:py-40">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-gold text-xs font-bold uppercase tracking-[0.15em] text-cream shadow-lg">
              EF
            </div>
            <h2 className="mt-6 text-4xl font-bold tracking-tight text-cream sm:text-5xl lg:text-6xl leading-[1]">
              Your event starts here.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lead sm:text-xl">
              Find the places, people and services that can bring your plans
              together. Explore EventFlow and start building your event.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/discover"
                className="btn-primary"
              >
                Explore EventFlow →
              </Link>
              <Link
                to="/register"
                className="btn-outline"
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

