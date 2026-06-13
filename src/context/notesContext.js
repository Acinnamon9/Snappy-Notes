import {
    createContext,
    useContext,
} from "react";

export const NotesContext = createContext(null);

export const useNotes = () => {
    const context = useContext(NotesContext);

    if (!context) {
        throw new Error("useNotes must be used inside NotesProvider");
    }

    return context;
};
