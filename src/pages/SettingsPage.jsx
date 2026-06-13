import { useState } from "react";
import {
    Link,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/authContext";

const SettingsPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [loggingOut, setLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState(null);

    const handleLogout = async () => {
        setLoggingOut(true);
        setLogoutError(null);

        try {
            await logout();
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
            setLogoutError(
                error.message ||
                    "Could not log out. Please try again."
            );
            setLoggingOut(false);
        }
    };

    return (
        <main className="standard-page">
            <section className="page-card">
                <p className="page-eyebrow">Snappy Notes</p>
                <h1>Account</h1>

                <p>
                    Your current Appwrite account and session details.
                </p>

                <dl className="account-details">
                    <div>
                        <dt>Name</dt>
                        <dd>{user.name || "Unnamed account"}</dd>
                    </div>

                    <div>
                        <dt>Email</dt>
                        <dd>{user.email}</dd>
                    </div>

                    <div>
                        <dt>User ID</dt>
                        <dd className="account-id">{user.$id}</dd>
                    </div>
                </dl>

                {logoutError && (
                    <div className="auth-error" role="alert">
                        {logoutError}
                    </div>
                )}

                <div className="page-actions">
                    <Link className="secondary-link" to="/notes">
                        Return to notes
                    </Link>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                    >
                        {loggingOut ? "Logging out..." : "Log out"}
                    </button>
                </div>
            </section>
        </main>
    );
};

export default SettingsPage;
