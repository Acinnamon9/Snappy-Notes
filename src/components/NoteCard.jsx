import PropTypes from "prop-types";
import {
    useEffect,
    useRef,
    useState,
} from "react";

import DeadlineControl from "./DeadlineControl";
import DeleteButton from "./DeleteButton";
import Spinner from "../icons/Spinner";
import {
    autoGrow,
    bodyParser,
    parseStoredJson,
    setNewOffset,
    setZIndex,
} from "../utils";
import { useNotes } from "../context/notesContext";
import { useDeadlineStatus } from "../hooks/useDeadlineStatus";

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
        focusNoteId,
        setSelectedNoteId,
        clearFocusNote,
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
    const completed = Boolean(note.completed);
    const deadlineStatus = useDeadlineStatus(
        note.dueAt,
        completed
    );

    useEffect(() => {
        autoGrow(textAreaRef);
        setZIndex(cardRef.current);

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (focusNoteId !== note.$id) {
            return;
        }

        const textarea = textAreaRef.current;

        if (!textarea) {
            return;
        }

        textarea.focus();

        const caretPosition = textarea.value.length;
        textarea.setSelectionRange(caretPosition, caretPosition);

        clearFocusNote(note.$id);
    }, [clearFocusNote, focusNoteId, note.$id]);

    const activateCard = () => {
        setSelectedNoteId(note.$id);
        setZIndex(cardRef.current);
    };

    const saveData = async (key, value) => {
        await updateNote(note.$id, {
            [key]: JSON.stringify(value),
        });
    };

    const handleMouseMove = (event) => {
        event.preventDefault();

        const mouseMovement = {
            x: mouseStartPosition.current.x - event.clientX,
            y: mouseStartPosition.current.y - event.clientY,
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

        const nextPosition = setNewOffset(cardRef.current);

        void saveData("position", nextPosition).catch((error) => {
            console.error("Failed to save note position:", error);
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

        activateCard();

        document.addEventListener(
            "mousemove",
            handleMouseMove
        );

        document.addEventListener(
            "mouseup",
            handleMouseUp
        );
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
            className={[
                "card",
                `card--${deadlineStatus.kind}`,
            ].join(" ")}
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
                    backgroundColor: colors.colorHeader,
                }}
            >
                <DeleteButton noteId={note.$id} />

                <div className="card-header-actions">
                    {saving && (
                        <div className="card-saving">
                            <Spinner color={colors.colorText} />
                            <span style={{ color: colors.colorText }}>
                                Saving...
                            </span>
                        </div>
                    )}

                    <DeadlineControl
                        noteId={note.$id}
                        dueAt={note.dueAt}
                        completed={completed}
                        status={deadlineStatus}
                        onActivate={activateCard}
                    />
                </div>
            </header>

            <div className="card-body">
                <textarea
                    ref={textAreaRef}
                    defaultValue={body}
                    aria-label="Note body"
                    readOnly={completed}
                    onFocus={activateCard}
                    onInput={handleInput}
                    style={{
                        color: colors.colorText,
                    }}
                />
            </div>
        </article>
    );
};

NoteCard.propTypes = {
    note: PropTypes.shape({
        $id: PropTypes.string.isRequired,
        position: PropTypes.string,
        colors: PropTypes.string,
        body: PropTypes.string,
        dueAt: PropTypes.string,
        completed: PropTypes.bool,
    }).isRequired,
};

export default NoteCard;
