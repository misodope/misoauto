import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuth";
import { useState } from "react";
import { SideNavigation } from "../SideNavigation/SideNavigation";

interface HamburgerProps {
  onClick: () => void;
}
const Hamburger: React.FC<HamburgerProps> = ({ onClick }) => {
  return (
    <button
      className="mx-4 flex flex-col w-6 h-6 justify-around items-center bg-transparent focus:outline-none"
      onClick={onClick}
    >
      <span className="w-full h-1 bg-gray-800"></span>
      <span className="w-full h-1 bg-gray-800"></span>
      <span className="w-full h-1 bg-gray-800"></span>
    </button>
  );
};

const Navbar: React.FC = () => {
  const { setAuthData, isLoggedIn } = useAuthContext();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sideNavOpen, setSideNavOpen] = useState(false);

  const navigate = useNavigate();

  const onLogout = () => {
    // Destroy cookie
    document.cookie =
      "authData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    // Force Logout
    setAuthData(null);
    setShowLogoutModal(false);
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow py-4">
      {isLoggedIn && (
        <SideNavigation
          open={sideNavOpen}
          onClose={() => setSideNavOpen(false)}
          onLogout={() => setShowLogoutModal(true)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          {isLoggedIn && (
            <Hamburger
              onClick={() => setSideNavOpen((prevOpen) => !prevOpen)}
            />
          )}
          <Link className="text-lg font-bold text-gray-800" to="/">
            MisoAuto
          </Link>
        </div>
        {isLoggedIn ? (
          <>
            <div>
              <Link
                className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
                onClick={() => setShowLogoutModal(true)}
                to="#"
              >
                Logout
              </Link>
            </div>
          </>
        ) : (
          <Link
            className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
            to="/login"
          >
            Login
          </Link>
        )}
        <dialog className="p-0 z-50 top-[10%]" open={showLogoutModal}>
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm w-full mx-auto">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold">Logout</h1>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowLogoutModal(false)}
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.414 10l4.293-4.293a1 1 0 10-1.414-1.414L10 8.586 5.707 4.293a1 1 0 00-1.414 1.414L8.586 10l-4.293 4.293a1 1 0 101.414 1.414L10 11.414l4.293 4.293a1 1 0 101.414-1.414L11.414 10z"
                    fill="#4A5568"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to logout?
              </p>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                className="bg-gray-100 text-gray-600 rounded px-4 py-2 mr-2 text-sm hover:bg-gray-200"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-indigo-500 text-white rounded px-4 py-2 text-sm hover:bg-indigo-600"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </nav>
  );
};

export default Navbar;
