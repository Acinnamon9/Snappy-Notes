import PropTypes from "prop-types";
import { useState } from "react";

import { useNotes } from "../context/notesContext";

const Color = ({ color }) => {
    const { selectedNoteId, updateNote } = useNotes();
    const [updating, setUpdating] = useState(false);

    const changeColor = async () => {
        if (!selectedNoteId) {
            alert("Select a note before changing its colour.");
            return;
        }

        if (updating) {
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

Color.propTypes = {
    color: PropTypes.shape({
        id: PropTypes.string.isRequired,
        colorHeader: PropTypes.string.isRequired,
    }).isRequired,
};

export default Color;
