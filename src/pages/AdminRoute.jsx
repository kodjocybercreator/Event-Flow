import { Navigate, useLocation } from "react-router-dom";

function getAdmin() {
  try {
    return JSON.parse(
      localStorage.getItem("eventflowAdmin") || "null"
    );
  } catch {
    return null;
  }
}

function AdminRoute({ children }) {
  const location = useLocation();
  const admin = getAdmin();

  if (!admin || admin.role !== "admin") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (
    admin.sessionExpiresAt &&
    new Date(admin.sessionExpiresAt).getTime() <= Date.now()
  ) {
    localStorage.removeItem("eventflowAdmin");

    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
          reason: "session-expired",
        }}
      />
    );
  }

  return children;
}

export default AdminRoute;
