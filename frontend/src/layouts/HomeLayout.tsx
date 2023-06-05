import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuth";

const HomeLayout = () => {
  const { isLoggedIn, authData, authLoading, authStarted } = useAuthContext();
  console.log("Inside Home Layout", "Logged In", isLoggedIn);
  console.log("Auth Data", authData);
  console.log("Auth Loading", authLoading);
  console.log("Auth Started", authStarted);
  console.log("--------------------");
  if (isLoggedIn) {
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
