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

export default NotesProvider;