import { Link } from "react-router-dom";

const LoginPage = () => {
    return (
        <main className="standard-page">
            <section className="page-card">
                <p className="page-eyebrow">Snappy Notes</p>
                <h1>Login</h1>

                <p>
                    Authentication will live on this page.
                    It is now separate from the notes board.
                </p>

                <div className="page-actions">
                    <Link className="primary-link" to="/notes">
                        Open notes
                    </Link>
                </div>
            </section>
        </main>
    );
};

export default LoginPage;