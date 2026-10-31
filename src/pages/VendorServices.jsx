import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const SERVICES_PREFIX = "eventflowServices_";

const emptyForm = {
  name: "",
  category: "Photography",
  description: "",
  price: "",
  pricingType: "Starting from",
  icon: "📸",
};

const categories = [
  "Photography",
  "Videography",
  "Photography & Videography",
  "DJ & Music",
  "Decoration",
  "Catering",
  "Transportation",
  "Event Planning",
  "Makeup & Beauty",
  "Other",
];

const categoryIcons = {
  Photography: "📸",
  Videography: "🎥",
  "Photography & Videography": "🎬",
  "DJ & Music": "🎧",
  Decoration: "🌸",
  Catering: "🍽️",
  Transportation: "🚐",
  "Event Planning": "🎉",
  "Makeup & Beauty": "💄",
  Other: "📦",
};

const iconOptions = [
  { value: "📸", label: "Photography" },
  { value: "🎥", label: "Videography" },
  { value: "🎬", label: "Photography & Videography" },
  { value: "🎧", label: "DJ & Music" },
  { value: "🎤", label: "Entertainment" },
  { value: "🌸", label: "Decoration" },
  { value: "🍽️", label: "Catering" },
  { value: "🚐", label: "Transportation" },
  { value: "💄", label: "Makeup & Beauty" },
  { value: "🎉", label: "Event Planning" },
  { value: "📦", label: "Other" },
];

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("eventflowUser") || "null");
  } catch {
    return null;
  }
}

function getServiceKey(user) {
  if (!user?.email) return null;

  return `${SERVICES_PREFIX}${user.email.toLowerCase()}`;
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `GH₵${amount.toLocaleString("en-GH")}`;
}

function createServiceId() {
  return `service_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export default function VendorServices() {
  const [user] = useState(() => getCurrentUser());

  const vendorKey = useMemo(() => getServiceKey(user), [user]);

  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...emptyForm });
  const [saveMessage, setSaveMessage] = useState("");

  /* ============================================================
     LOAD SERVICES
  ============================================================ */

  useEffect(() => {
    if (!vendorKey) {
      setServices([]);
      return;
    }

    try {
      const saved = localStorage.getItem(vendorKey);

      if (!saved) {
        setServices([]);
        return;
      }

      const parsed = JSON.parse(saved);

      setServices(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("Unable to load vendor services:", error);
      setServices([]);
    }
  }, [vendorKey]);

  /* ============================================================
     SAVE SERVICES
  ============================================================ */

  const saveServices = (updatedServices) => {
    if (!vendorKey) return false;

    try {
      localStorage.setItem(
        vendorKey,
        JSON.stringify(updatedServices)
      );

      setServices(updatedServices);

      window.dispatchEvent(
        new Event("eventflow-services-updated")
      );

      return true;
    } catch (error) {
      console.error("Unable to save vendor services:", error);

      if (
        error?.name === "QuotaExceededError" ||
        String(error?.message || "").toLowerCase().includes("quota")
      ) {
        alert(
          "Your browser storage is full. Please remove some saved data and try again."
        );
      } else {
        alert("Unable to save the service. Please try again.");
      }

      return false;
    }
  };

  /* ============================================================
     FORM RESET
  ============================================================ */

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
    setSaveMessage("");
  };

  /* ============================================================
     OPEN ADD FORM
  ============================================================ */

  const handleAddService = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setSaveMessage("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ============================================================
     FORM CHANGE
  ============================================================ */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      if (name === "category" && !editingId) {
        updated.icon = categoryIcons[value] || "📦";
      }

      return updated;
    });

    setSaveMessage("");
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!user) {
      alert("Please log in as a vendor.");
      return;
    }

    if (user.accountType !== "vendor") {
      alert("Only vendor accounts can manage services.");
      return;
    }

    if (!vendorKey) {
      alert("Vendor account information is missing.");
      return;
    }

    const name = form.name.trim();
    const description = form.description.trim();
    const price = Number(form.price);

    if (!name) {
      alert("Please enter a service name.");
      return;
    }

    if (!description) {
      alert("Please enter a service description.");
      return;
    }

    if (!form.price || Number.isNaN(price) || price <= 0) {
      alert("Please enter a valid starting price.");
      return;
    }

    /* ==========================================================
       UPDATE EXISTING SERVICE
    ========================================================== */

    if (editingId !== null) {
      const updatedServices = services.map((service) => {
        if (String(service.id) !== String(editingId)) {
          return service;
        }

        return {
          ...service,

          name,
          serviceName: name,

          category: form.category,
          serviceCategory: form.category,

          description,

          price,

          // Keep compatibility with existing pages.
          pricingType: form.pricingType || "Starting from",

          icon:
            form.icon ||
            categoryIcons[form.category] ||
            "📦",

          updatedAt: new Date().toISOString(),
        };
      });

      const saved = saveServices(updatedServices);

      if (saved) {
        setSaveMessage("Service updated successfully.");
        resetForm();
      }

      return;
    }

    /* ==========================================================
       CREATE NEW SERVICE
    ========================================================== */

    const now = new Date().toISOString();

    const newService = {
      id: createServiceId(),

      vendorId: user.id || "",
      vendorEmail: user.email || "",
      vendorName:
        user.businessName ||
        user.companyName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim(),

      name,
      serviceName: name,

      category: form.category,
      serviceCategory: form.category,

      description,

      price,

      pricingType: form.pricingType || "Starting from",

      icon:
        form.icon ||
        categoryIcons[form.category] ||
        "📦",

      available: true,

      createdAt: now,
      updatedAt: now,
    };

    const saved = saveServices([
      ...services,
      newService,
    ]);

    if (saved) {
      setSaveMessage("Service added successfully.");
      resetForm();
    }
  };

  /* ============================================================
     EDIT SERVICE
  ============================================================ */

  const handleEdit = (service) => {
    const category =
      service.category ||
      service.serviceCategory ||
      "Photography";

    setForm({
      name:
        service.name ||
        service.serviceName ||
        "",

      category,

      description:
        service.description ||
        "",

      price:
        service.price !== undefined &&
        service.price !== null
          ? String(service.price)
          : "",

      pricingType:
        service.pricingType ||
        "Starting from",

      icon:
        service.icon ||
        categoryIcons[category] ||
        "📦",
    });

    setEditingId(service.id);
    setShowForm(true);
    setSaveMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ============================================================
     DELETE SERVICE
  ============================================================ */

  const handleDelete = (id) => {
    const service = services.find(
      (item) => String(item.id) === String(id)
    );

    if (!service) return;

    const serviceName =
      service.name ||
      service.serviceName ||
      "this service";

    const confirmed = window.confirm(
      `Delete "${serviceName}"?\n\nThis service will be removed from your EventFlow catalogue.`
    );

    if (!confirmed) return;

    const updatedServices = services.filter(
      (item) => String(item.id) !== String(id)
    );

    saveServices(updatedServices);
  };

  /* ============================================================
     TOGGLE AVAILABILITY
  ============================================================ */

  const toggleAvailability = (id) => {
    const updatedServices = services.map((service) => {
      if (String(service.id) !== String(id)) {
        return service;
      }

      const currentlyAvailable =
        service.available !== false;

      return {
        ...service,

        available: !currentlyAvailable,

        updatedAt: new Date().toISOString(),
      };
    });

    saveServices(updatedServices);
  };

  /* ============================================================
     SEARCH
  ============================================================ */

  const searchText = search.trim().toLowerCase();

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      if (!searchText) return true;

      const name = String(
        service.name ||
          service.serviceName ||
          ""
      ).toLowerCase();

      const category = String(
        service.category ||
          service.serviceCategory ||
          ""
      ).toLowerCase();

      const description = String(
        service.description ||
          ""
      ).toLowerCase();

      return (
        name.includes(searchText) ||
        category.includes(searchText) ||
        description.includes(searchText)
      );
    });
  }, [services, searchText]);

  const activeServices = services.filter(
    (service) => service.available !== false
  ).length;

  const unavailableServices =
    services.length - activeServices;

  /* ============================================================
     NO USER
  ============================================================ */

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f7f7fb]">
        <Navbar />

        <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center px-5 py-16">
          <div className="w-full rounded-[28px] border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
              🔐
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              Vendor account required
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
              Sign in to your EventFlow vendor account
              to manage the services displayed on your
              business profile.
            </p>

            <Link
              to="/login"
              className="mt-7 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Sign in to EventFlow
            </Link>
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     MAIN PAGE
  ============================================================ */

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-gray-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <section className="overflow-hidden rounded-[30px] bg-gray-950 shadow-sm">
          <div className="relative px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />

            <div className="relative">
              <Link
                to="/dashboard/vendor"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 transition hover:text-white"
              >
                <span>←</span>
                Vendor Dashboard
              </Link>

              <div className="mt-8 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Service Catalogue
                  </div>

                  <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Manage your services
                  </h1>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                    Present your services clearly so event
                    organizers can understand what you offer,
                    view starting prices and send booking
                    requests.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddService}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500 sm:w-auto"
                >
                  <span className="text-xl leading-none">
                    +
                  </span>
                  Add service
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            SAVE MESSAGE
        ====================================================== */}

        {saveMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {saveMessage}
          </div>
        )}

        {/* ======================================================
            SUMMARY
        ====================================================== */}

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Total services
              </p>

              <span className="hidden text-lg sm:block">
                ◇
              </span>
            </div>

            <p className="mt-3 text-2xl font-bold tracking-tight text-gray-950">
              {services.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Available
              </p>

              <span className="hidden h-2 w-2 rounded-full bg-emerald-500 sm:block" />
            </div>

            <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-600">
              {activeServices}
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:col-span-1 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Unavailable
              </p>

              <span className="hidden h-2 w-2 rounded-full bg-gray-400 sm:block" />
            </div>

            <p className="mt-3 text-2xl font-bold tracking-tight text-gray-500">
              {unavailableServices}
            </p>
          </div>
        </section>

        {/* ======================================================
            FORM
        ====================================================== */}

        {showForm && (
          <section className="mt-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-5 sm:px-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                    {editingId !== null
                      ? "Edit service"
                      : "New service"}
                  </p>

                  <h2 className="mt-1.5 text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">
                    {editingId !== null
                      ? "Update your service"
                      : "Add a service"}
                  </h2>

                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500">
                    Give organizers enough information to
                    understand your service before they send
                    a booking request.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  aria-label="Close form"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                >
                  ✕
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-6 p-5 sm:p-8 md:grid-cols-2"
            >
              {/* SERVICE NAME */}

              <div>
                <label
                  htmlFor="service-name"
                  className="text-sm font-bold text-gray-800"
                >
                  Service name
                </label>

                <input
                  id="service-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Wedding Photography"
                  maxLength={80}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

                <p className="mt-1.5 text-xs text-gray-400">
                  Choose a clear, professional name.
                </p>
              </div>

              {/* CATEGORY */}

              <div>
                <label
                  htmlFor="service-category"
                  className="text-sm font-bold text-gray-800"
                >
                  Category
                </label>

                <select
                  id="service-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                >
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* ICON */}

              <div>
                <label
                  htmlFor="service-icon"
                  className="text-sm font-bold text-gray-800"
                >
                  Service icon
                </label>

                <select
                  id="service-icon"
                  name="icon"
                  value={form.icon}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                >
                  {iconOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.value} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* PRICING TYPE */}

              <div>
                <label
                  htmlFor="pricing-type"
                  className="text-sm font-bold text-gray-800"
                >
                  Pricing structure
                </label>

                <select
                  id="pricing-type"
                  name="pricingType"
                  value={form.pricingType}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value="Starting from">
                    Starting from
                  </option>

                  <option value="Per hour">
                    Per hour
                  </option>

                  <option value="Per day">
                    Per day
                  </option>

                  <option value="Custom quote">
                    Custom quote
                  </option>
                </select>

                <p className="mt-1.5 text-xs text-gray-400">
                  Final pricing is agreed through the EventFlow
                  quotation process.
                </p>
              </div>

              {/* PRICE */}

              <div>
                <label
                  htmlFor="service-price"
                  className="text-sm font-bold text-gray-800"
                >
                  Starting price
                </label>

                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-gray-400">
                    GH₵
                  </span>

                  <input
                    id="service-price"
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    placeholder="1,500"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-14 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                <p className="mt-1.5 text-xs text-gray-400">
                  Displayed to organizers as a starting price,
                  not the final booking amount.
                </p>
              </div>

              {/* DESCRIPTION */}

              <div className="md:col-span-2">
                <label
                  htmlFor="service-description"
                  className="text-sm font-bold text-gray-800"
                >
                  Service description
                </label>

                <textarea
                  id="service-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  maxLength={800}
                  placeholder="Explain what is included, coverage, deliverables, turnaround time, equipment, or any important requirements..."
                  className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />

                <div className="mt-1.5 flex justify-between gap-4">
                  <p className="text-xs text-gray-400">
                    Keep your description specific and easy
                    to understand.
                  </p>

                  <span className="shrink-0 text-xs text-gray-400">
                    {form.description.length}/800
                  </span>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row md:col-span-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  {editingId !== null
                    ? "Save changes"
                    : "Add service"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ======================================================
            CATALOGUE HEADER
        ====================================================== */}

        <section className="mt-9">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                Your catalogue
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
                Services
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                These are the services organizers can view
                on your EventFlow profile.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search services..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>
          </div>
        </section>

        {/* ======================================================
            SERVICES
        ====================================================== */}

        <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredServices.map((service) => {
            const serviceName =
              service.name ||
              service.serviceName ||
              "Unnamed service";

            const category =
              service.category ||
              service.serviceCategory ||
              "Other";

            const isAvailable =
              service.available !== false;

            const pricingType =
              service.pricingType ||
              "Starting from";

            return (
              <article
                key={service.id}
                className="group flex flex-col overflow-hidden rounded-[26px] border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-lg hover:shadow-gray-200/50"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl ring-1 ring-indigo-100">
                      {service.icon || "📦"}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                        isAvailable
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isAvailable
                            ? "bg-emerald-500"
                            : "bg-gray-400"
                        }`}
                      />

                      {isAvailable
                        ? "Available"
                        : "Unavailable"}
                    </span>
                  </div>

                  <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-600">
                    {category}
                  </p>

                  <h3 className="mt-1.5 text-xl font-bold tracking-tight text-gray-950">
                    {serviceName}
                  </h3>

                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-gray-500">
                    {service.description ||
                      "No description provided."}
                  </p>

                  <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {pricingType}
                      </p>

                      <span className="text-[10px] font-semibold text-gray-400">
                        Organizer pricing
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-baseline gap-2">
                      <p className="text-xl font-bold tracking-tight text-gray-950">
                        {formatCurrency(service.price)}
                      </p>

                      {pricingType === "Per hour" && (
                        <span className="text-xs text-gray-400">
                          / hour
                        </span>
                      )}

                      {pricingType === "Per day" && (
                        <span className="text-xs text-gray-400">
                          / day
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs leading-5 text-gray-400">
                      Final price is confirmed through a
                      quotation after the event requirements
                      are reviewed.
                    </p>
                  </div>
                </div>

                {/* CARD ACTIONS */}

                <div className="mt-auto border-t border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(service)
                      }
                      className="rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                    >
                      Edit service
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(service.id)
                      }
                      className="rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toggleAvailability(service.id)
                    }
                    className={`mt-2 w-full rounded-xl py-2.5 text-xs font-bold transition ${
                      isAvailable
                        ? "bg-gray-950 text-white hover:bg-gray-800"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {isAvailable
                      ? "Mark as unavailable"
                      : "Make available"}
                  </button>
                </div>
              </article>
            );
          })}

          {/* ====================================================
              EMPTY STATE
          ==================================================== */}

          {filteredServices.length === 0 && (
            <div className="rounded-[26px] border border-dashed border-gray-300 bg-white px-6 py-14 text-center md:col-span-2 xl:col-span-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                {services.length === 0
                  ? "📦"
                  : "⌕"}
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-950">
                {services.length === 0
                  ? "No services added yet"
                  : "No matching services"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                {services.length === 0
                  ? "Start building your EventFlow catalogue by adding the services your business provides."
                  : "Try another search term or clear your search to see your services."}
              </p>

              {services.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddService}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <span className="text-lg leading-none">
                    +
                  </span>

                  Add your first service
                </button>
              )}
            </div>
          )}
        </section>

        {/* ======================================================
            BUSINESS INFORMATION
        ====================================================== */}

        <section className="mt-8 overflow-hidden rounded-[26px] border border-indigo-100 bg-indigo-50">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-7">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
              ✦
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                EventFlow pricing
              </p>

              <h2 className="mt-1 text-base font-bold text-gray-950">
                Keep your starting prices realistic
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                Your listed price gives organizers an idea
                of your pricing. It is not the final booking
                price. After an organizer sends a request,
                you can review the event requirements and
                issue a quotation. The final amount is agreed
                between you and the organizer through the
                EventFlow booking process.
              </p>
            </div>
          </div>
        </section>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="py-8 text-center">
          <Link
            to="/dashboard/vendor"
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition hover:text-indigo-700"
          >
            <span>←</span>
            Return to Vendor Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}