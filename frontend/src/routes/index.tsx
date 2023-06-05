import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import { Dashboard } from "../pages/Dashboard";
import { Landing } from "../pages/Landing";
import { Login } from "../pages/Login";
import { Privacy } from "../pages/Privacy";
import { Terms } from "../pages/Terms";
import ProtectedLayout from "../layouts/ProtectedLayout";
import HomeLayout from "../layouts/HomeLayout";
import Layout from "../layouts/Layout";

export const publicRoutes = [
  {
    path: "/",
    element: <Landing />,
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

const authedRoutes = [
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
];

const routes = createRoutesFromElements(
  <>
    <Route element={<Layout />}>
      <Route element={<HomeLayout />}>
        {publicRoutes.map((route) => (
          <Route {...route} />
        ))}
      </Route>

      <Route element={<ProtectedLayout />}>
        {authedRoutes.map((route) => (
          <Route {...route} />
        ))}
      </Route>
    </Route>
  </>
);

export const router = createBrowserRouter(routes);
