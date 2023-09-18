import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import ProtectedLayout from "../layouts/ProtectedLayout";
import HomeLayout from "../layouts/HomeLayout";
import Layout from "../layouts/Layout";

import { Dashboard } from "../pages/Dashboard";
import { Landing } from "../pages/Landing";
import { Login } from "../pages/Login";
import { Privacy } from "../pages/Privacy";
import { Terms } from "../pages/Terms";
import { Videos } from "../pages/Videos";

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
  {
    path: "/videos",
    element: <Videos />,
  },
];

const routes = createRoutesFromElements(
  <>
    <Route element={<Layout />}>
      <Route element={<HomeLayout />}>
        {publicRoutes.map((route) => (
          <Route key={route.path} {...route} />
        ))}
      </Route>

      <Route element={<ProtectedLayout />}>
        {authedRoutes.map((route) => (
          <Route key={route.path} {...route} />
        ))}
      </Route>
    </Route>
  </>,
);

export const router = createBrowserRouter(routes);
