import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

import Spinner from "../icons/Spinner";
import { useAuth } from "../context/authContext";

const PublicOnlyRoute = ({ children }) => {
    const {
        user,
        loading,
        sessionError,
        refreshUser,
    } = useAuth();

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

    if (user) {
        return <Navigate to="/notes" replace />;
    }

    return children;
};

PublicOnlyRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

export default PublicOnlyRoute;
