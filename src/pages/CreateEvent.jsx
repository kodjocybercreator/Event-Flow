import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function CreateEvent() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("eventflowUser") || "null"
      );
    } catch {
      return null;
    }
  });

  const [form, setForm] = useState({
    name: "",
    type: "Wedding",
    date: "",
    time: "",
    location: "",
    guestCount: "",
    description: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user || user.accountType !== "organizer") {
      navigate("/login");
      return;
    }

    if (
      !form.name.trim() ||
      !form.date ||
      !form.location.trim()
    ) {
      setError(
        "Please provide the event name, date and location."
      );
      return;
    }

    let events = [];

    try {
      events = JSON.parse(
        localStorage.getItem("eventflowEvents") || "[]"
      );

      if (!Array.isArray(events)) {
        events = [];
      }
    } catch {
      events = [];
    }

    const organizerName =
      `${user.firstName || ""} ${
        user.lastName || ""
      }`.trim() || user.name || "Organizer";

    const newEvent = {
      id: `event_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,

      organizerId: user.id,
      organizerEmail: user.email,
      organizerName,

      name: form.name.trim(),
      type: form.type,
      date: form.date,
      time: form.time,
      location: form.location.trim(),
      guestCount: Number(form.guestCount) || 0,
      description: form.description.trim(),

      status: "planning",

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "eventflowEvents",
      JSON.stringify([newEvent, ...events])
    );

    window.dispatchEvent(
      new Event("eventflow-events-updated")
    );

    navigate("/dashboard/organizer");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wider text-indigo-600">
            EventFlow
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-gray-950">
            Create an event
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Add the event you are planning and manage its vendors
            and venue from your dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <label className="text-sm font-bold text-gray-700">
              Event name
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Saviour & Ama Wedding"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-gray-700">
                Event type
              </label>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-indigo-500"
              >
                <option>Wedding</option>
                <option>Engagement</option>
                <option>Birthday</option>
                <option>Funeral</option>
                <option>Graduation</option>
                <option>Corporate Event</option>
                <option>Conference</option>
                <option>Party</option>
                <option>Baby Shower</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700">
                Number of guests
              </label>

              <input
                type="number"
                name="guestCount"
                min="1"
                value={form.guestCount}
                onChange={handleChange}
                placeholder="e.g. 250"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-bold text-gray-700">
                Event date
              </label>

              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700">
                Event time
              </label>

              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700">
              Location
            </label>

            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Kumasi, Ashanti Region"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700">
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="5"
              placeholder="Tell us about your event..."
              className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/dashboard/organizer")}
              className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Create Event
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}