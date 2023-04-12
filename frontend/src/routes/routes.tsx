import { Dashboard } from "../pages/Dashboard";
import { Login } from "../pages/Login";
import { Privacy } from "../pages/Privacy";
import { Terms } from "../pages/Terms";

export const routes = [
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/terms",
    element: <Terms />,
  },
  {
    path: "/privacy",
    element: <Privacy />,
  },
];
