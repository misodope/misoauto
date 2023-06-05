import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuth";

const HomeLayout = () => {
  const { isLoggedIn } = useAuthContext();
  const location = useLocation();

  // Check current path is /login then redirect
  if (isLoggedIn && location.pathname === "/login") {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div>
      {/* Outlet is similar to children but works for routes only? */}
      <Outlet />
    </div>
  );
};

export default HomeLayout;
