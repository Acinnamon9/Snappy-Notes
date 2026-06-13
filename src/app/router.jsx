import {
    createBrowserRouter,
    Navigate,
} from "react-router-dom";

import NotesProvider from "../context/NotesContext";
import NotesPage from "../pages/NotesPage";
import LoginPage from "../pages/LoginPage";
import SettingsPage from "../pages/SettingsPage";
import NotFoundPage from "../pages/NotFoundPage";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/notes" replace />,
    },
    {
        path: "/notes",
        element: (
            <NotesProvider>
                <NotesPage />
            </NotesProvider>
        ),
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/settings",
        element: <SettingsPage />,
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
]);

export default router;