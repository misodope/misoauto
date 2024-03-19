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
import { UploadVideos } from "../pages/UploadVideos";

interface RouteProps {
  path: string;
  element: React.ReactElement;
  label?: string;
}

export const publicRoutes: RouteProps[] = [
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

export const authedRoutes: RouteProps[] = [
  {
    path: "/dashboard",
    element: <Dashboard />,
    label: "Dashboard",
  },
  {
    path: "/videos",
    element: <Videos />,
    label: "Videos",
  },
  {
    path: "/videos/upload",
    element: <UploadVideos />,
    label: "Upload Videos",
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
