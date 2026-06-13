import PropTypes from "prop-types";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { authService } from "../services/authService";
import { AuthContext } from "./authContext";

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState(null);

    const refreshUser = useCallback(async () => {
        setLoading(true);
        setSessionError(null);

        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            return currentUser;
        } catch (error) {
            console.error("Failed to restore the session:", error);
            setUser(null);
            setSessionError(error);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshUser();
    }, [refreshUser]);

    const register = useCallback(async (credentials) => {
        const currentUser = await authService.register(credentials);
        setUser(currentUser);
        setSessionError(null);
        return currentUser;
    }, []);

    const login = useCallback(async (credentials) => {
        const currentUser = await authService.login(credentials);
        setUser(currentUser);
        setSessionError(null);
        return currentUser;
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
        setSessionError(null);
    }, []);

    const contextValue = useMemo(
        () => ({
            user,
            loading,
            sessionError,
            isAuthenticated: Boolean(user),
            refreshUser,
            register,
            login,
            logout,
        }),
        [
            user,
            loading,
            sessionError,
            refreshUser,
            register,
            login,
            logout,
        ]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default AuthProvider;
