import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const admin = JSON.parse(
    localStorage.getItem("eventflowAdmin") || "null"
  );

  if (!admin || admin.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminRoute;