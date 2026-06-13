import PropTypes from "prop-types";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import Spinner from "../icons/Spinner";
import { notesService } from "../services/notesService";
import { useAuth } from "./authContext";
import { NotesContext } from "./notesContext";

const NotesProvider = ({ children }) => {
    const { user } = useAuth();

    const [notes, setNotes] = useState([]);
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [focusNoteId, setFocusNoteId] = useState(null);
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

    const createNote = useCallback(
        async (payload) => {
            const createdNote = await notesService.create(
                payload,
                user.$id
            );

            setNotes((currentNotes) => [
                createdNote,
                ...currentNotes,
            ]);

            setSelectedNoteId(createdNote.$id);
            setFocusNoteId(createdNote.$id);

            return createdNote;
        },
        [user]
    );

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

        setFocusNoteId((currentId) =>
            currentId === id ? null : currentId
        );
    }, []);

    const clearFocusNote = useCallback((id) => {
        setFocusNoteId((currentId) =>
            currentId === id ? null : currentId
        );
    }, []);

    const contextValue = useMemo(
        () => ({
            notes,
            selectedNoteId,
            focusNoteId,
            setSelectedNoteId,
            clearFocusNote,
            createNote,
            updateNote,
            deleteNote,
            reloadNotes: loadNotes,
        }),
        [
            notes,
            selectedNoteId,
            focusNoteId,
            clearFocusNote,
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
                <p>Loading notes...</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="page-state">
                <h1>Could not load notes</h1>
                <p>{loadError.message || "The notes request failed."}</p>

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

NotesProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default NotesProvider;
