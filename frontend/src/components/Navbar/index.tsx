import { Link, Navigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuth";

const Navbar = () => {
  const { setAuthData, isLoggedIn } = useAuthContext();

  const onLogout = () => {
    console.log("Inside Logout");
    // Destroy cookie
    document.cookie = "authData=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    // Force Logout
    setAuthData(null);
    <Navigate to="/" />;
  };

  return (
    <nav className="bg-white shadow py-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link className="text-lg font-bold text-gray-800" to="/">
          MisoAuto
        </Link>
        {isLoggedIn ? (
          <>
            <Link
              className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
              onClick={onLogout}
              to="/"
            >
              Logout
            </Link>
          </>
        ) : (
          <Link
            className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
            to="/login"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
