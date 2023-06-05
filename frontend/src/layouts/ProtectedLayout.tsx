import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuth";
import Loader from "../components/Loader";

const ProtectedLayout = () => {
  const { isLoggedIn, authLoading, authStarted, authData } = useAuthContext();
  console.log("Inside Protected Layout", "Logged In", isLoggedIn);
  console.log("Auth Data", authData);
  console.log("Auth Loading", authLoading);
  console.log("Auth Started", authStarted);
  console.log("--------------------");

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
