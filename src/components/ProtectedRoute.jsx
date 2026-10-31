import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({
  children,
  allowedRole,
}) {
  const location = useLocation();

  let user = null;

  try {
    const savedUser = localStorage.getItem("eventflowUser");

    if (savedUser) {
      user = JSON.parse(savedUser);
    }
  } catch (error) {
    console.error("Unable to read EventFlow user:", error);

    localStorage.removeItem("eventflowUser");
    localStorage.removeItem("eventflowLoggedIn");

    user = null;
  }

  /*
   * User is not logged in.
   */
  if (!user || !user.email) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  /*
   * Get the user's account role.
   */
  const userRole = user.accountType || user.role;

  /*
   * User tried to access another role's dashboard.
   */
  if (allowedRole && userRole !== allowedRole) {
    if (userRole === "vendor") {
      return (
        <Navigate
          to="/dashboard/vendor"
          replace
        />
      );
    }

    if (userRole === "organizer") {
      return (
        <Navigate
          to="/dashboard/organizer"
          replace
        />
      );
    }

    if (userRole === "venue") {
      return (
        <Navigate
          to="/dashboard/venue"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/discover"
        replace
      />
    );
  }

  return children;
}