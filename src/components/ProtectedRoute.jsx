import PropTypes from "prop-types";
import {
    Navigate,
    useLocation,
} from "react-router-dom";

import Spinner from "../icons/Spinner";
import { useAuth } from "../context/authContext";

const ProtectedRoute = ({ children }) => {
    const {
        user,
        loading,
        sessionError,
        refreshUser,
    } = useAuth();

    const location = useLocation();

    if (loading) {
        return (
            <main className="page-state">
                <Spinner size="64" />
                <p>Checking your session...</p>
            </main>
        );
    }

    if (sessionError) {
        return (
            <main className="page-state">
                <h1>Could not check your session</h1>
                <p>
                    {sessionError.message ||
                        "The authentication request failed."}
                </p>

                <button
                    type="button"
                    className="primary-button"
                    onClick={refreshUser}
                >
                    Try again
                </button>
            </main>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
