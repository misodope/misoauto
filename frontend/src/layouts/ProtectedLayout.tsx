import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuth";
import Loader from "../components/Loader";

const ProtectedLayout = () => {
  const { isLoggedIn, authLoading, authStarted, authData } = useAuthContext();

  if (authLoading && authStarted && !isLoggedIn) {
    return <Loader />;
  }

  if (authStarted && !authLoading && !isLoggedIn) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      {/* Outlet is similar to children but works for routes only? */}
      <Outlet />
    </div>
  );
};

export default ProtectedLayout;
