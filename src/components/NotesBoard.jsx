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
                <NoteCard key={note.$id} note={note} />
            ))}

            <Controls />
        </main>
    );
};

export default NotesBoard;