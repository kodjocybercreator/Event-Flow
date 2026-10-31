import { BrowserRouter, Routes, Route } from "react-router-dom";

// ============================================================
// PUBLIC PAGES
// ============================================================

import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateEvent from "./pages/CreateEvent";

// ============================================================
// VENDOR PAGES
// ============================================================

import VendorRegistration from "./pages/VendorRegistration";
import VendorDashboard from "./pages/VendorDashboard";
import VendorServices from "./pages/VendorServices";
import VendorProfile from "./pages/VendorProfile";
import VendorBookings from "./pages/VendorBookings";

// ============================================================
// VENUE PAGES
// ============================================================

import VenueDashboard from "./pages/VenueDashboard";
import VenueRegistration from "./pages/VenueRegistration";
import VenueDetails from "./pages/VenueDetails";

// ============================================================
// ORGANIZER PAGES
// ============================================================

import OrganizerDashboard from "./pages/OrganizerDashboard";
import Me from "./pages/Me";

// ============================================================
// MARKETPLACE / BOOKING PAGES
// ============================================================

import Venues from "./pages/Venues";
import ListingDetails from "./pages/ListingDetails";
import BookingRequest from "./pages/BookingRequest";
import BookingSuccess from "./pages/BookingSuccess";

// ============================================================
// PROTECTED ROUTES
// ============================================================

import ProtectedRoute from "./components/ProtectedRoute";

// ============================================================
// ADMIN
// ============================================================

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminApprovals from "./pages/AdminApprovals";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminRoute from "./components/AdminRoute";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ======================================================
            PUBLIC PAGES
        ====================================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/discover"
          element={<Discover />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* ======================================================
            VENDOR REGISTRATION
        ====================================================== */}

        <Route
          path="/vendor-registration"
          element={<VendorRegistration />}
        />

        {/* ======================================================
            CREATE EVENT
        ====================================================== */}

        <Route
          path="/create-event"
          element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          }
        />

        {/* ======================================================
            ORGANIZER DASHBOARD
        ====================================================== */}

        <Route
          path="/dashboard/organizer"
          element={
            <ProtectedRoute>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />

        {/* ======================================================
            ORGANIZER ME / PROFILE
        ====================================================== */}

        <Route
          path="/organizer/me"
          element={
            <ProtectedRoute>
              <Me />
            </ProtectedRoute>
          }
        />

        {/* ======================================================
            VENDOR DASHBOARD
        ====================================================== */}

        <Route
          path="/dashboard/vendor"
          element={
            <ProtectedRoute>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />

        {/* ======================================================
            VENDOR SERVICES
        ====================================================== */}

        <Route
          path="/dashboard/vendor/services"
          element={
            <ProtectedRoute>
              <VendorServices />
            </ProtectedRoute>
          }
        />

        {/* ======================================================
            VENDOR BOOKINGS
        ====================================================== */}

        <Route
          path="/dashboard/vendor/bookings"
          element={
            <ProtectedRoute>
              <VendorBookings />
            </ProtectedRoute>
          }
        />

        {/* ======================================================
            VENDOR PROFILE
        ====================================================== */}

        <Route
          path="/vendor/:id"
          element={<VendorProfile />}
        />

        {/* ======================================================
            VENUE REGISTRATION
        ====================================================== */}

        <Route
          path="/venue-registration"
          element={
            <ProtectedRoute>
              <VenueRegistration />
            </ProtectedRoute>
          }
        />

        {/* ======================================================
            VENUE DASHBOARD
        ====================================================== */}

        <Route
          path="/dashboard/venue"
          element={
            <ProtectedRoute>
              <VenueDashboard />
            </ProtectedRoute>
          }
        />

        {/* ======================================================
            VENUES
        ====================================================== */}

        <Route
          path="/venues"
          element={<Venues />}
        />

        {/* ======================================================
            VENUE DETAILS
        ====================================================== */}

        <Route
          path="/venues/:id"
          element={<VenueDetails />}
        />

        {/* ======================================================
            GENERAL LISTING
        ====================================================== */}

        <Route
          path="/listing/:id"
          element={<ListingDetails />}
        />

        {/* ======================================================
            BOOKING REQUEST
        ====================================================== */}

        <Route
          path="/booking-request"
          element={
            <ProtectedRoute>
              <BookingRequest />
            </ProtectedRoute>
          }
        />

        {/* ======================================================
            BOOKING SUCCESS
        ====================================================== */}

        <Route
          path="/booking-success/:id"
          element={
            <ProtectedRoute>
              <BookingSuccess />
            </ProtectedRoute>
          }
        />

        {/* ======================================================
            ADMIN LOGIN
        ====================================================== */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* ======================================================
            ADMIN DASHBOARD
        ====================================================== */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* ======================================================
            PAYMENT
        ====================================================== */}

        <Route
          path="/payment/:id"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/success/:id"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/failure"
          element={
            <ProtectedRoute>
              <PaymentFailure />
            </ProtectedRoute>
          }
        />

        {/* ======================================================
            ADMIN APPROVALS & ANALYTICS
        ====================================================== */}

        <Route
          path="/admin/approvals"
          element={
            <AdminRoute>
              <AdminApprovals />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AdminAnalytics />
            </AdminRoute>
          }
        />

        {/* ======================================================
            FALLBACK
        ====================================================== */}

        <Route
          path="*"
          element={<Home />}
        />

      </Routes>
    </BrowserRouter>
  );
}
