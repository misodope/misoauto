import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuth";

const ProtectedLayout = () => {
  const { isLoggedIn, authLoading, authStarted } = useAuthContext();
  console.log(
    "ProtectedLayout",
    "Auth Started",
    authStarted,
    "Auth Loading",
    authLoading,
    "Is Logged In",
    isLoggedIn,
  );

  if (authStarted && !authLoading && !isLoggedIn) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default ProtectedLayout;
