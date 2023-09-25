import React from "react";
import { Link } from "react-router-dom";
import { authedRoutes } from "../../routes";

interface SideNavigationProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const SideNavigation: React.FC<SideNavigationProps> = ({
  open,
  onClose,
}) => {
  return (
    <div
      className={`flex flex-col fixed top-0 left-0 w-64 h-full bg-indigo-500 transition-all duration-300 ease-in-out transform ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <button onClick={onClose} className="p-4 mr-2 self-end text-white">
        x
      </button>
      <div className="flex flex-col text-lg">
        {authedRoutes.map((route) => (
          <Link
            className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white transition-colors duration-200"
            to={route.path}
            onClick={onClose}
            key={route.path}
          >
            {route.label}
          </Link>
        ))}
        <Link
          to="#"
          className="absolute bottom-0 w-full p-2 bg-indigo-500 hover:bg-indigo-600 text-white transition-colors duration-200"
        >
          Logout
        </Link>
      </div>
    </div>
  );
};
