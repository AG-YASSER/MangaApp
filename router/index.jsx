import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/mainLayout";
import Home from "../pages/Home";
import Manga from "../pages/Manga";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "manga", element: <Manga /> },
      { path: "profile", element: <Profile /> },
      { path: "*", element: <NotFound /> }
    ]
  }
]);