import PropTypes from "prop-types";
import { useState } from "react";

import Trash from "../icons/Trash";
import { useNotes } from "../context/notesContext";

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

DeleteButton.propTypes = {
    noteId: PropTypes.string.isRequired,
};

export default DeleteButton;
