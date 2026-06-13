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
    const { setSelectedNoteId, updateNote } = useNotes();

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
                    backgroundColor: colors.colorHeader,
                }}
            >
                <DeleteButton noteId={note.$id} />

                {saving && (
                    <div className="card-saving">
                        <Spinner color={colors.colorText} />
                        <span style={{ color: colors.colorText }}>
                            Saving...
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