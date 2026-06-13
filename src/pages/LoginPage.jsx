import { useState } from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/authContext";

const getRedirectPath = (location) => {
    const previousLocation = location.state?.from;

    if (!previousLocation?.pathname) {
        return "/notes";
    }

    return [
        previousLocation.pathname,
        previousLocation.search || "",
        previousLocation.hash || "",
    ].join("");
};

const LoginPage = () => {
    const { login, register } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    const isRegistering = mode === "register";

    const updateField = (event) => {
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    };

    const switchMode = () => {
        setMode((currentMode) =>
            currentMode === "login" ? "register" : "login"
        );
        setFormError(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            if (isRegistering) {
                await register(form);
            } else {
                await login(form);
            }

            navigate(getRedirectPath(location), {
                replace: true,
            });
        } catch (error) {
            console.error("Authentication failed:", error);
            setFormError(
                error.message ||
                    "Authentication failed. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="standard-page">
            <section className="page-card auth-card">
                <p className="page-eyebrow">Snappy Notes</p>
                <h1>
                    {isRegistering
                        ? "Create your account"
                        : "Welcome back"}
                </h1>

                <p>
                    {isRegistering
                        ? "Create an account to keep your notes private and available across sessions."
                        : "Log in to open your private notes workspace."}
                </p>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    {isRegistering && (
                        <label className="form-field">
                            <span>Name</span>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={updateField}
                                autoComplete="name"
                                maxLength="128"
                                required
                            />
                        </label>
                    )}

                    <label className="form-field">
                        <span>Email</span>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={updateField}
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label className="form-field">
                        <span>Password</span>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={updateField}
                            autoComplete={
                                isRegistering
                                    ? "new-password"
                                    : "current-password"
                            }
                            minLength="8"
                            required
                        />
                        <small>Use at least 8 characters.</small>
                    </label>

                    {formError && (
                        <div
                            className="auth-error"
                            role="alert"
                        >
                            {formError}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="primary-button auth-submit"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Working..."
                            : isRegistering
                              ? "Create account"
                              : "Log in"}
                    </button>
                </form>

                <p className="auth-switch">
                    {isRegistering
                        ? "Already have an account?"
                        : "New to Snappy Notes?"}

                    <button
                        type="button"
                        onClick={switchMode}
                        disabled={submitting}
                    >
                        {isRegistering
                            ? "Log in"
                            : "Create an account"}
                    </button>
                </p>
            </section>
        </main>
    );
};

export default LoginPage;
