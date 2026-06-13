import {
    createBrowserRouter,
    Navigate,
} from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import PublicOnlyRoute from "../components/PublicOnlyRoute";
import NotesProvider from "../context/NotesProvider";
import LoginPage from "../pages/LoginPage";
import NotesPage from "../pages/NotesPage";
import NotFoundPage from "../pages/NotFoundPage";
import SettingsPage from "../pages/SettingsPage";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/notes" replace />,
    },
    {
        path: "/notes",
        element: (
            <ProtectedRoute>
                <NotesProvider>
                    <NotesPage />
                </NotesProvider>
            </ProtectedRoute>
        ),
    },
    {
        path: "/login",
        element: (
            <PublicOnlyRoute>
                <LoginPage />
            </PublicOnlyRoute>
        ),
    },
    {
        path: "/settings",
        element: (
            <ProtectedRoute>
                <SettingsPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
]);

export default router;
