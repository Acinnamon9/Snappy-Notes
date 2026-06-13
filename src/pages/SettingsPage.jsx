import { Link } from "react-router-dom";

const SettingsPage = () => {
    return (
        <main className="standard-page">
            <section className="page-card">
                <p className="page-eyebrow">Snappy Notes</p>
                <h1>Settings</h1>

                <p>
                    Account, appearance, storage, and note
                    preferences can be added here.
                </p>

                <div className="page-actions">
                    <Link className="primary-link" to="/notes">
                        Return to notes
                    </Link>

                    <Link className="secondary-link" to="/login">
                        View login
                    </Link>
                </div>
            </section>
        </main>
    );
};

export default SettingsPage;