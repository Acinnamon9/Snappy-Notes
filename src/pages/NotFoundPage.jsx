import { Link } from "react-router-dom";

const NotFoundPage = () => {
    return (
        <main className="standard-page">
            <section className="page-card">
                <p className="page-eyebrow">404</p>
                <h1>Page not found</h1>

                <p>This route does not exist.</p>

                <div className="page-actions">
                    <Link className="primary-link" to="/notes">
                        Return to notes
                    </Link>
                </div>
            </section>
        </main>
    );
};

export default NotFoundPage;