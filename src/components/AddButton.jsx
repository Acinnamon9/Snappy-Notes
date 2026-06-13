import { useRef, useState } from "react";

import Plus from "../icons/Plus";
import colors from "../assets/colors.json";
import { useNotes } from "../context/notesContext";

const AddButton = () => {
    const { createNote } = useNotes();
    const startingPosition = useRef(10);
    const [creating, setCreating] = useState(false);

    const addNote = async () => {
        if (creating) {
            return;
        }

        const payload = {
            body: JSON.stringify(""),
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