import PropTypes from "prop-types";
import {
    useEffect,
    useRef,
    useState,
} from "react";

import { useNotes } from "../context/notesContext";
import {
    createFutureDateTimeIso,
    fromDateTimeLocalValue,
    toDateTimeLocalValue,
} from "../utils/dateTime";

const QUICK_TIMERS = [
    { label: "10m", value: 10, unit: "minutes" },
    { label: "30m", value: 30, unit: "minutes" },
    { label: "1h", value: 1, unit: "hours" },
    { label: "3h", value: 3, unit: "hours" },
];

const stopPropagation = (event) => {
    event.stopPropagation();
};

const ClockIcon = () => (
    <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
    >
        <circle cx="12" cy="12" r="8.5" />
        <path
            d="M12 7.5v5l3.25 2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CheckIcon = () => (
    <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
    >
        <path
            d="m7 12.5 3.1 3.1L17.5 8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const DeadlineControl = ({
    noteId,
    dueAt,
    completed,
    status,
    onActivate,
}) => {
    const { updateNote } = useNotes();
    const controlRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const [localDueAt, setLocalDueAt] = useState(
        toDateTimeLocalValue(dueAt)
    );
    const [durationValue, setDurationValue] = useState("30");
    const [durationUnit, setDurationUnit] = useState("minutes");
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        setLocalDueAt(toDateTimeLocalValue(dueAt));
    }, [dueAt]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const closeOnOutsideClick = (event) => {
            if (
                controlRef.current &&
                !controlRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const closeOnEscape = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("pointerdown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);

        return () => {
            document.removeEventListener(
                "pointerdown",
                closeOnOutsideClick
            );
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [isOpen]);

    const saveChanges = async (
        payload,
        { closeAfterSave = true } = {}
    ) => {
        setSaving(true);
        setErrorMessage("");

        try {
            await updateNote(noteId, payload);

            if (closeAfterSave) {
                setIsOpen(false);
            }

            return true;
        } catch (error) {
            console.error("Failed to update reminder:", error);
            setErrorMessage("Could not save the reminder.");
            return false;
        } finally {
            setSaving(false);
        }
    };

    const openEditor = () => {
        onActivate();
        setErrorMessage("");
        setIsOpen((currentValue) => !currentValue);
    };

    const setTimer = async (value, unit) => {
        const nextDueAt = createFutureDateTimeIso(value, unit);

        if (!nextDueAt) {
            setErrorMessage("Enter a valid duration.");
            return;
        }

        await saveChanges({
            dueAt: nextDueAt,
            completed: false,
        });
    };

    const saveExactDeadline = async (event) => {
        event.preventDefault();

        const nextDueAt = fromDateTimeLocalValue(localDueAt);

        if (!nextDueAt) {
            setErrorMessage("Choose a valid date and time.");
            return;
        }

        await saveChanges({
            dueAt: nextDueAt,
            completed: false,
        });
    };

    const saveCustomTimer = async (event) => {
        event.preventDefault();
        await setTimer(durationValue, durationUnit);
    };

    const clearDeadline = async () => {
        const saved = await saveChanges({ dueAt: null });

        if (saved) {
            setLocalDueAt("");
        }
    };

    const toggleCompleted = async () => {
        onActivate();

        const saved = await saveChanges(
            { completed: !completed },
            { closeAfterSave: false }
        );

        if (!saved) {
            setIsOpen(true);
        }
    };

    const hasStatus = Boolean(dueAt) || completed;

    return (
        <div
            ref={controlRef}
            className="note-actions"
            onMouseDown={stopPropagation}
        >
            {hasStatus && (
                <button
                    type="button"
                    className={[
                        "deadline-status",
                        `deadline-status--${status.kind}`,
                    ].join(" ")}
                    title={status.title}
                    disabled={saving}
                    onClick={openEditor}
                >
                    {status.label}
                </button>
            )}

            <button
                type="button"
                className={[
                    "note-action-icon",
                    completed ? "note-action-icon--completed" : "",
                ].join(" ")}
                aria-label={
                    completed
                        ? "Reopen note"
                        : "Mark note complete"
                }
                aria-pressed={completed}
                title={completed ? "Reopen note" : "Complete note"}
                disabled={saving}
                onClick={() => {
                    void toggleCompleted();
                }}
            >
                <CheckIcon />
            </button>

            <button
                type="button"
                className={[
                    "note-action-icon",
                    dueAt ? "note-action-icon--active" : "",
                ].join(" ")}
                aria-label={
                    dueAt ? "Edit reminder" : "Add reminder"
                }
                aria-expanded={isOpen}
                title={dueAt ? "Edit reminder" : "Add reminder"}
                disabled={saving}
                onClick={openEditor}
            >
                <ClockIcon />
            </button>

            {isOpen && (
                <section
                    className="deadline-popover"
                    role="dialog"
                    aria-label="Set note reminder"
                    onClick={stopPropagation}
                >
                    <header className="deadline-popover-header">
                        <div>
                            <strong>Reminder</strong>
                            {dueAt && (
                                <span title={status.title}>
                                    {status.title}
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            className="deadline-close"
                            aria-label="Close reminder editor"
                            onClick={() => setIsOpen(false)}
                        >
                            ×
                        </button>
                    </header>

                    <div className="deadline-section">
                        <span className="deadline-section-label">
                            Start a countdown
                        </span>

                        <div className="deadline-quick-grid">
                            {QUICK_TIMERS.map((timer) => (
                                <button
                                    key={timer.label}
                                    type="button"
                                    disabled={saving}
                                    onClick={() => {
                                        void setTimer(
                                            timer.value,
                                            timer.unit
                                        );
                                    }}
                                >
                                    {timer.label}
                                </button>
                            ))}
                        </div>

                        <form
                            className="deadline-custom-timer"
                            onSubmit={saveCustomTimer}
                        >
                            <input
                                type="number"
                                min="1"
                                max="10000"
                                inputMode="numeric"
                                aria-label="Custom timer duration"
                                value={durationValue}
                                disabled={saving}
                                onChange={(event) => {
                                    setDurationValue(event.target.value);
                                }}
                            />

                            <select
                                aria-label="Custom timer unit"
                                value={durationUnit}
                                disabled={saving}
                                onChange={(event) => {
                                    setDurationUnit(event.target.value);
                                }}
                            >
                                <option value="minutes">minutes</option>
                                <option value="hours">hours</option>
                                <option value="days">days</option>
                            </select>

                            <button type="submit" disabled={saving}>
                                Set
                            </button>
                        </form>
                    </div>

                    <form
                        className="deadline-section"
                        onSubmit={saveExactDeadline}
                    >
                        <label className="deadline-picker">
                            <span>At a date and time</span>
                            <input
                                type="datetime-local"
                                value={localDueAt}
                                disabled={saving}
                                onChange={(event) => {
                                    setLocalDueAt(event.target.value);
                                }}
                            />
                        </label>

                        <button
                            type="submit"
                            className="deadline-save"
                            disabled={saving || !localDueAt}
                        >
                            Save date
                        </button>
                    </form>

                    {dueAt && (
                        <footer className="deadline-popover-footer">
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => {
                                    void setTimer(5, "minutes");
                                }}
                            >
                                Snooze 5m
                            </button>

                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => {
                                    void setTimer(15, "minutes");
                                }}
                            >
                                Snooze 15m
                            </button>

                            <button
                                type="button"
                                className="deadline-clear"
                                disabled={saving}
                                onClick={() => {
                                    void clearDeadline();
                                }}
                            >
                                Clear
                            </button>
                        </footer>
                    )}

                    {errorMessage && (
                        <p className="note-meta-error" role="alert">
                            {errorMessage}
                        </p>
                    )}
                </section>
            )}
        </div>
    );
};

DeadlineControl.propTypes = {
    noteId: PropTypes.string.isRequired,
    dueAt: PropTypes.string,
    completed: PropTypes.bool.isRequired,
    status: PropTypes.shape({
        kind: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
    }).isRequired,
    onActivate: PropTypes.func.isRequired,
};

DeadlineControl.defaultProps = {
    dueAt: null,
};

export default DeadlineControl;
