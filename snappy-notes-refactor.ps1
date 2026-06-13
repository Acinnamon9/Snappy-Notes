set -euo pipefail

# ---------------------------------------------------------
# Verify that this is the project root
# ---------------------------------------------------------

if [ ! -f "package.json" ] || [ ! -d "src" ]; then
  echo "ERROR: Run this command from the project root."
  exit 1
fi

# ---------------------------------------------------------
# Create a backup outside the project directory
# ---------------------------------------------------------

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_dir="../snappy-notes-backup-$timestamp"

mkdir -p "$backup_dir"
cp -R src "$backup_dir/src"
cp package.json index.html "$backup_dir/"

if [ -f "package-lock.json" ]; then
  cp package-lock.json "$backup_dir/"
fi

if [ -f "ARCHITECTURE.md" ]; then
  cp ARCHITECTURE.md "$backup_dir/"
fi

echo "Backup created at: $backup_dir"

# ---------------------------------------------------------
# Correct the package name
# ---------------------------------------------------------

node <<'NODE'
const fs = require("fs");

const packageJson = JSON.parse(
  fs.readFileSync("package.json", "utf8")
);

packageJson.name = "snappy-notes";

fs.writeFileSync(
  "package.json",
  JSON.stringify(packageJson, null, 2) + "\n"
);
NODE

# ---------------------------------------------------------
# Install routing
# ---------------------------------------------------------

npm install react-router-dom@6.30.4

# ---------------------------------------------------------
# Create new folders
# ---------------------------------------------------------

mkdir -p \
  src/app \
  src/services \
  src/pages \
  src/components

# ---------------------------------------------------------
# Application root
# ---------------------------------------------------------

cat > src/App.jsx <<'EOF'
import { RouterProvider } from "react-router-dom";
import router from "./app/router";

function App() {
    return <RouterProvider router={router} />;
}

export default App;
EOF

# ---------------------------------------------------------
# Router
# ---------------------------------------------------------

cat > src/app/router.jsx <<'EOF'
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
EOF

# ---------------------------------------------------------
# Appwrite notes service
# ---------------------------------------------------------

cat > src/services/notesService.js <<'EOF'
import { db } from "../appwrite/databases";

export const notesService = {
    async list() {
        const response = await db.notes.list();
        return response.documents;
    },

    async create(payload) {
        return db.notes.create(payload);
    },

    async update(id, payload) {
        return db.notes.update(id, payload);
    },

    async remove(id) {
        return db.notes.delete(id);
    },
};
EOF

# ---------------------------------------------------------
# Notes context
# ---------------------------------------------------------

cat > src/context/NotesContext.jsx <<'EOF'
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import Spinner from "../icons/Spinner";
import { notesService } from "../services/notesService";

export const NotesContext = createContext(null);

export const useNotes = () => {
    const context = useContext(NotesContext);

    if (!context) {
        throw new Error("useNotes must be used inside NotesProvider");
    }

    return context;
};

const NotesProvider = ({ children }) => {
    const [notes, setNotes] = useState([]);
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const loadNotes = useCallback(async () => {
        setLoading(true);
        setLoadError(null);

        try {
            const loadedNotes = await notesService.list();
            setNotes(loadedNotes);
        } catch (error) {
            console.error("Failed to load notes:", error);
            setLoadError(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadNotes();
    }, [loadNotes]);

    const createNote = useCallback(async (payload) => {
        const createdNote = await notesService.create(payload);

        setNotes((currentNotes) => [
            createdNote,
            ...currentNotes,
        ]);

        return createdNote;
    }, []);

    const updateNote = useCallback(async (id, payload) => {
        const updatedNote = await notesService.update(id, payload);

        setNotes((currentNotes) =>
            currentNotes.map((note) =>
                note.$id === id
                    ? { ...note, ...updatedNote }
                    : note
            )
        );

        return updatedNote;
    }, []);

    const deleteNote = useCallback(async (id) => {
        await notesService.remove(id);

        setNotes((currentNotes) =>
            currentNotes.filter((note) => note.$id !== id)
        );

        setSelectedNoteId((currentId) =>
            currentId === id ? null : currentId
        );
    }, []);

    const contextValue = useMemo(
        () => ({
            notes,
            selectedNoteId,
            setSelectedNoteId,
            createNote,
            updateNote,
            deleteNote,
            reloadNotes: loadNotes,
        }),
        [
            notes,
            selectedNoteId,
            createNote,
            updateNote,
            deleteNote,
            loadNotes,
        ]
    );

    if (loading) {
        return (
            <div className="page-state">
                <Spinner size="64" />
                <p>Loading notes…</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="page-state">
                <h1>Could not load notes</h1>

                <p>
                    {loadError.message ||
                        "The notes request failed."}
                </p>

                <button
                    type="button"
                    className="primary-button"
                    onClick={loadNotes}
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <NotesContext.Provider value={contextValue}>
            {children}
        </NotesContext.Provider>
    );
};

export default NotesProvider;
EOF

# ---------------------------------------------------------
# Notes board
# ---------------------------------------------------------

cat > src/components/NotesBoard.jsx <<'EOF'
import { Link } from "react-router-dom";

import Controls from "./Controls";
import NoteCard from "./NoteCard";
import { useNotes } from "../context/NotesContext";

const NotesBoard = () => {
    const { notes } = useNotes();

    return (
        <main className="notes-board">
            <nav className="board-navigation">
                <Link to="/notes">Notes</Link>
                <Link to="/settings">Settings</Link>
            </nav>

            {notes.length === 0 && (
                <div className="empty-board-message">
                    <strong>No notes yet</strong>
                    <span>Use the plus button to create one.</span>
                </div>
            )}

            {notes.map((note) => (
                <NoteCard
                    key={note.$id}
                    note={note}
                />
            ))}

            <Controls />
        </main>
    );
};

export default NotesBoard;
EOF

# ---------------------------------------------------------
# Notes page
# ---------------------------------------------------------

cat > src/pages/NotesPage.jsx <<'EOF'
import NotesBoard from "../components/NotesBoard";

const NotesPage = () => {
    return <NotesBoard />;
};

export default NotesPage;
EOF

# ---------------------------------------------------------
# Login placeholder page
# ---------------------------------------------------------

cat > src/pages/LoginPage.jsx <<'EOF'
import { Link } from "react-router-dom";

const LoginPage = () => {
    return (
        <main className="standard-page">
            <section className="page-card">
                <p className="page-eyebrow">Snappy Notes</p>

                <h1>Login</h1>

                <p>
                    Authentication will live on this page.
                    The route is now separated from the notes board.
                </p>

                <div className="page-actions">
                    <Link
                        className="primary-link"
                        to="/notes"
                    >
                        Open notes
                    </Link>
                </div>
            </section>
        </main>
    );
};

export default LoginPage;
EOF

# ---------------------------------------------------------
# Settings placeholder page
# ---------------------------------------------------------

cat > src/pages/SettingsPage.jsx <<'EOF'
import { Link } from "react-router-dom";

const SettingsPage = () => {
    return (
        <main className="standard-page">
            <section className="page-card">
                <p className="page-eyebrow">Snappy Notes</p>

                <h1>Settings</h1>

                <p>
                    Account, appearance, storage, and note
                    preferences can be introduced here.
                </p>

                <div className="page-actions">
                    <Link
                        className="primary-link"
                        to="/notes"
                    >
                        Return to notes
                    </Link>

                    <Link
                        className="secondary-link"
                        to="/login"
                    >
                        View login page
                    </Link>
                </div>
            </section>
        </main>
    );
};

export default SettingsPage;
EOF

# ---------------------------------------------------------
# Not-found page
# ---------------------------------------------------------

cat > src/pages/NotFoundPage.jsx <<'EOF'
import { Link } from "react-router-dom";

const NotFoundPage = () => {
    return (
        <main className="standard-page">
            <section className="page-card">
                <p className="page-eyebrow">404</p>

                <h1>Page not found</h1>

                <p>
                    This route does not exist. The internet
                    remains largely unsupervised.
                </p>

                <div className="page-actions">
                    <Link
                        className="primary-link"
                        to="/notes"
                    >
                        Return to notes
                    </Link>
                </div>
            </section>
        </main>
    );
};

export default NotFoundPage;
EOF

# ---------------------------------------------------------
# Add-note component
# ---------------------------------------------------------

cat > src/components/AddButton.jsx <<'EOF'
import { useRef, useState } from "react";

import Plus from "../icons/Plus";
import colors from "../assets/colors.json";
import { useNotes } from "../context/NotesContext";

const AddButton = () => {
    const { createNote } = useNotes();
    const startingPosition = useRef(10);
    const [creating, setCreating] = useState(false);

    const addNote = async () => {
        if (creating) {
            return;
        }

        const payload = {
            position: JSON.stringify({
                x: startingPosition.current,
                y: startingPosition.current,
            }),
            colors: JSON.stringify(colors[0]),
        };

        setCreating(true);

        try {
            await createNote(payload);
            startingPosition.current += 10;
        } catch (error) {
            console.error("Failed to create note:", error);
            alert("The note could not be created.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <button
            id="add-btn"
            type="button"
            aria-label="Add note"
            disabled={creating}
            onClick={addNote}
        >
            <Plus />
        </button>
    );
};

export default AddButton;
EOF

# ---------------------------------------------------------
# Colour component
# ---------------------------------------------------------

cat > src/components/Color.jsx <<'EOF'
import { useState } from "react";

import { useNotes } from "../context/NotesContext";

const Color = ({ color }) => {
    const {
        selectedNoteId,
        updateNote,
    } = useNotes();

    const [updating, setUpdating] = useState(false);

    const changeColor = async () => {
        if (!selectedNoteId || updating) {
            if (!selectedNoteId) {
                alert("Select a note before changing its colour.");
            }

            return;
        }

        setUpdating(true);

        try {
            await updateNote(selectedNoteId, {
                colors: JSON.stringify(color),
            });
        } catch (error) {
            console.error("Failed to update note colour:", error);
            alert("The note colour could not be changed.");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <button
            type="button"
            className="color"
            aria-label={`Use ${color.id}`}
            title={color.id}
            disabled={updating}
            onClick={changeColor}
            style={{
                backgroundColor: color.colorHeader,
            }}
        />
    );
};

export default Color;
EOF

# ---------------------------------------------------------
# Controls component
# ---------------------------------------------------------

cat > src/components/Controls.jsx <<'EOF'
import AddButton from "./AddButton";
import Color from "./Color";
import colors from "../assets/colors.json";

const Controls = () => {
    return (
        <aside
            id="controls"
            aria-label="Note controls"
        >
            <AddButton />

            {colors.map((color) => (
                <Color
                    key={color.id}
                    color={color}
                />
            ))}
        </aside>
    );
};

export default Controls;
EOF

# ---------------------------------------------------------
# Delete button
# ---------------------------------------------------------

cat > src/components/DeleteButton.jsx <<'EOF'
import { useState } from "react";

import Trash from "../icons/Trash";
import { useNotes } from "../context/NotesContext";

const DeleteButton = ({ noteId }) => {
    const { deleteNote } = useNotes();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (event) => {
        event.stopPropagation();

        if (deleting) {
            return;
        }

        setDeleting(true);

        try {
            await deleteNote(noteId);
        } catch (error) {
            console.error("Failed to delete note:", error);
            alert("The note could not be deleted.");
            setDeleting(false);
        }
    };

    return (
        <button
            type="button"
            className="icon-button"
            aria-label="Delete note"
            disabled={deleting}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={handleDelete}
        >
            <Trash />
        </button>
    );
};

export default DeleteButton;
EOF

# ---------------------------------------------------------
# Note card
# ---------------------------------------------------------

cat > src/components/NoteCard.jsx <<'EOF'
import {
    useEffect,
    useRef,
    useState,
} from "react";

import DeleteButton from "./DeleteButton";
import Spinner from "../icons/Spinner";
import {
    autoGrow,
    bodyParser,
    parseStoredJson,
    setNewOffset,
    setZIndex,
} from "../utils";
import { useNotes } from "../context/NotesContext";

const DEFAULT_POSITION = {
    x: 10,
    y: 10,
};

const DEFAULT_COLORS = {
    colorHeader: "#FFEFBE",
    colorBody: "#FFF5DF",
    colorText: "#18181A",
};

const NoteCard = ({ note }) => {
    const {
        setSelectedNoteId,
        updateNote,
    } = useNotes();

    const cardRef = useRef(null);
    const textAreaRef = useRef(null);
    const saveTimerRef = useRef(null);
    const mouseStartPosition = useRef({
        x: 0,
        y: 0,
    });

    const [saving, setSaving] = useState(false);

    const [position, setPosition] = useState(() =>
        parseStoredJson(note.position, DEFAULT_POSITION)
    );

    const colors = parseStoredJson(
        note.colors,
        DEFAULT_COLORS
    );

    const body = bodyParser(note.body);

    useEffect(() => {
        autoGrow(textAreaRef);
        setZIndex(cardRef.current);

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, []);

    const saveData = async (key, value) => {
        await updateNote(note.$id, {
            [key]: JSON.stringify(value),
        });
    };

    const handleMouseDown = (event) => {
        if (event.button !== 0) {
            return;
        }

        mouseStartPosition.current = {
            x: event.clientX,
            y: event.clientY,
        };

        setSelectedNoteId(note.$id);
        setZIndex(cardRef.current);

        document.addEventListener(
            "mousemove",
            handleMouseMove
        );

        document.addEventListener(
            "mouseup",
            handleMouseUp
        );
    };

    const handleMouseMove = (event) => {
        event.preventDefault();

        const mouseMovement = {
            x:
                mouseStartPosition.current.x -
                event.clientX,
            y:
                mouseStartPosition.current.y -
                event.clientY,
        };

        mouseStartPosition.current = {
            x: event.clientX,
            y: event.clientY,
        };

        const nextPosition = setNewOffset(
            cardRef.current,
            mouseMovement
        );

        setPosition(nextPosition);
    };

    const handleMouseUp = () => {
        document.removeEventListener(
            "mousemove",
            handleMouseMove
        );

        document.removeEventListener(
            "mouseup",
            handleMouseUp
        );

        const nextPosition = setNewOffset(
            cardRef.current
        );

        void saveData(
            "position",
            nextPosition
        ).catch((error) => {
            console.error(
                "Failed to save note position:",
                error
            );
        });
    };

    const handleInput = () => {
        autoGrow(textAreaRef);
        setSaving(true);

        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = setTimeout(
            async () => {
                try {
                    await saveData(
                        "body",
                        textAreaRef.current.value
                    );
                } catch (error) {
                    console.error(
                        "Failed to save note body:",
                        error
                    );
                } finally {
                    setSaving(false);
                }
            },
            1200
        );
    };

    return (
        <article
            ref={cardRef}
            className="card"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                backgroundColor: colors.colorBody,
            }}
        >
            <header
                className="card-header"
                onMouseDown={handleMouseDown}
                style={{
                    backgroundColor:
                        colors.colorHeader,
                }}
            >
                <DeleteButton noteId={note.$id} />

                {saving && (
                    <div className="card-saving">
                        <Spinner
                            color={colors.colorText}
                        />

                        <span
                            style={{
                                color: colors.colorText,
                            }}
                        >
                            Saving…
                        </span>
                    </div>
                )}
            </header>

            <div className="card-body">
                <textarea
                    ref={textAreaRef}
                    defaultValue={body}
                    aria-label="Note body"
                    onFocus={() => {
                        setZIndex(cardRef.current);
                        setSelectedNoteId(note.$id);
                    }}
                    onInput={handleInput}
                    style={{
                        color: colors.colorText,
                    }}
                />
            </div>
        </article>
    );
};

export default NoteCard;
EOF

# ---------------------------------------------------------
# Utilities
# ---------------------------------------------------------

cat > src/utils.js <<'EOF'
export const setNewOffset = (
    card,
    mouseMovement = { x: 0, y: 0 }
) => {
    if (!card) {
        return {
            x: 0,
            y: 0,
        };
    }

    const offsetLeft =
        card.offsetLeft - mouseMovement.x;

    const offsetTop =
        card.offsetTop - mouseMovement.y;

    return {
        x: Math.max(0, offsetLeft),
        y: Math.max(0, offsetTop),
    };
};

export function autoGrow(textAreaRef) {
    const textArea = textAreaRef.current;

    if (!textArea) {
        return;
    }

    textArea.style.height = "auto";
    textArea.style.height =
        `${textArea.scrollHeight}px`;
}

export const setZIndex = (selectedCard) => {
    if (!selectedCard) {
        return;
    }

    selectedCard.style.zIndex = "999";

    Array.from(
        document.getElementsByClassName("card")
    ).forEach((card) => {
        if (card !== selectedCard) {
            card.style.zIndex = "998";
        }
    });
};

export function parseStoredJson(value, fallback) {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (typeof value !== "string") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

export function bodyParser(value) {
    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value !== "string") {
        return String(value);
    }

    try {
        const parsedValue = JSON.parse(value);

        return typeof parsedValue === "string"
            ? parsedValue
            : String(parsedValue ?? "");
    } catch {
        return value;
    }
}
EOF

# ---------------------------------------------------------
# Global and page styling
# ---------------------------------------------------------

cat > src/index.css <<'EOF'
:root {
    font-family:
        Inter,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

    color: #18181a;
    background: #f3f4f6;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    --spinner-animation-speed: 2s;
}

* {
    box-sizing: border-box;
}

html,
body,
#root {
    min-width: 100%;
    min-height: 100%;
    margin: 0;
}

button,
textarea,
input {
    font: inherit;
}

button {
    border: 0;
}

a {
    color: inherit;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.spinner {
    animation:
        spin
        var(--spinner-animation-speed)
        linear
        infinite;
}

/* ------------------------------------------------------
   Notes board
------------------------------------------------------ */

.notes-board {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: auto;

    background-color: #212228;
    background-image:
        linear-gradient(
            #292a30 0.1em,
            transparent 0.1em
        ),
        linear-gradient(
            90deg,
            #292a30 0.1em,
            transparent 0.1em
        );

    background-size: 4em 4em;
}

.board-navigation {
    position: fixed;
    top: 16px;
    right: 20px;
    z-index: 10000;

    display: flex;
    gap: 8px;
    padding: 6px;

    background: rgba(53, 54, 62, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;

    box-shadow:
        0 8px 24px
        rgba(0, 0, 0, 0.18);
}

.board-navigation a {
    padding: 8px 12px;
    color: #f7f7f8;
    text-decoration: none;
    border-radius: 8px;
}

.board-navigation a:hover {
    background: rgba(255, 255, 255, 0.1);
}

.empty-board-message {
    position: absolute;
    top: 50%;
    left: 50%;

    display: flex;
    flex-direction: column;
    gap: 5px;

    padding: 18px 22px;
    color: #b8bac3;
    text-align: center;

    transform: translate(-50%, -50%);
}

.empty-board-message strong {
    color: #ffffff;
    font-size: 18px;
}

/* ------------------------------------------------------
   Note cards
------------------------------------------------------ */

.card {
    position: absolute;
    width: 400px;
    max-width: calc(100vw - 32px);

    overflow: hidden;
    cursor: default;
    border-radius: 6px;

    box-shadow:
        0 1px 1px hsl(0deg 0% 0% / 0.075),
        0 2px 2px hsl(0deg 0% 0% / 0.075),
        0 4px 4px hsl(0deg 0% 0% / 0.075),
        0 8px 8px hsl(0deg 0% 0% / 0.075),
        0 16px 16px hsl(0deg 0% 0% / 0.075);
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    min-height: 34px;
    padding: 5px 7px;
    cursor: grab;
    user-select: none;
}

.card-header:active {
    cursor: grabbing;
}

.card-saving {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
}

.card-body {
    padding: 1em;
}

.card-body textarea {
    display: block;
    width: 100%;
    min-height: 44px;

    padding: 0;
    overflow: hidden;
    resize: none;

    background-color: inherit;
    border: none;
    outline: none;
    font-size: 16px;
    line-height: 1.5;
}

.icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 28px;
    height: 28px;
    padding: 2px;

    cursor: pointer;
    background: transparent;
    border-radius: 6px;
}

.icon-button:hover {
    background: rgba(0, 0, 0, 0.08);
}

.icon-button:disabled {
    cursor: wait;
    opacity: 0.5;
}

/* ------------------------------------------------------
   Notes controls
------------------------------------------------------ */

#controls {
    position: fixed;
    top: 50%;
    left: 1em;
    z-index: 10000;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1em;

    padding: 1em;
    transform: translateY(-50%);

    background-color: #35363e;
    border-radius: 40px;

    box-shadow:
        0 1px 1px hsl(0deg 0% 0% / 0.075),
        0 2px 2px hsl(0deg 0% 0% / 0.075),
        0 4px 4px hsl(0deg 0% 0% / 0.075),
        0 8px 8px hsl(0deg 0% 0% / 0.075),
        0 16px 16px hsl(0deg 0% 0% / 0.075);
}

#add-btn,
.color {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    padding: 0;

    cursor: pointer;
    border-radius: 50%;
    transition:
        transform 160ms ease,
        opacity 160ms ease;
}

#add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgb(107, 107, 107);
}

#add-btn:hover,
.color:hover {
    transform: scale(1.12);
}

#add-btn:disabled,
.color:disabled {
    cursor: wait;
    opacity: 0.55;
    transform: none;
}

/* ------------------------------------------------------
   Ordinary pages
------------------------------------------------------ */

.standard-page,
.page-state {
    display: grid;
    min-height: 100vh;
    place-items: center;
    padding: 24px;

    background:
        linear-gradient(
            135deg,
            #f8fafc,
            #eef1f5
        );
}

.page-state {
    align-content: center;
    gap: 12px;
    text-align: center;
}

.page-card {
    width: min(100%, 560px);
    padding: 42px;

    background: #ffffff;
    border: 1px solid #e1e4e8;
    border-radius: 18px;

    box-shadow:
        0 24px 60px
        rgba(31, 41, 55, 0.1);
}

.page-eyebrow {
    margin: 0 0 8px;
    color: #646a73;

    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.page-card h1,
.page-state h1 {
    margin: 0 0 14px;
    font-size: clamp(32px, 6vw, 50px);
    line-height: 1;
}

.page-card p,
.page-state p {
    color: #5c626c;
    line-height: 1.65;
}

.page-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 28px;
}

.primary-link,
.secondary-link,
.primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    min-height: 42px;
    padding: 0 16px;

    cursor: pointer;
    border-radius: 9px;
    font-weight: 650;
    text-decoration: none;
}

.primary-link,
.primary-button {
    color: #ffffff;
    background: #202228;
}

.secondary-link {
    color: #202228;
    background: #eceef1;
}

.primary-link:hover,
.primary-button:hover {
    background: #343740;
}

.secondary-link:hover {
    background: #dfe2e7;
}

@media (max-width: 600px) {
    .card {
        width: 320px;
    }

    .page-card {
        padding: 28px;
    }

    .board-navigation {
        top: 10px;
        right: 10px;
    }
}
EOF

# ---------------------------------------------------------
# Browser title
# ---------------------------------------------------------

cat > index.html <<'EOF'
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />

        <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
        />

        <meta
            name="theme-color"
            content="#212228"
        />

        <title>Snappy Notes</title>
    </head>

    <body>
        <div id="root"></div>

        <script
            type="module"
            src="/src/main.jsx"
        ></script>
    </body>
</html>
EOF

# ---------------------------------------------------------
# Update architecture documentation
# ---------------------------------------------------------

cat > ARCHITECTURE.md <<'EOF'
# Snappy Notes Architecture

## Stack

- React 18
- Vite
- React Router
- Appwrite
- Plain CSS

## Application structure

```text
src/
├── app/
│   └── router.jsx
├── appwrite/
│   ├── config.js
│   └── databases.js
├── components/
│   ├── AddButton.jsx
│   ├── Color.jsx
│   ├── Controls.jsx
│   ├── DeleteButton.jsx
│   ├── NoteCard.jsx
│   └── NotesBoard.jsx
├── context/
│   └── NotesContext.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── NotesPage.jsx
│   ├── NotFoundPage.jsx
│   └── SettingsPage.jsx
├── services/
│   └── notesService.js
├── App.jsx
├── index.css
├── main.jsx
└── utils.js