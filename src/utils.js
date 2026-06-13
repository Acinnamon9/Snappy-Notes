export const setNewOffset = (
    card,
    mouseMovement = { x: 0, y: 0 }
) => {
    if (!card) {
        return {
            x: 0,
            y: 0,
        };
    }

    const offsetLeft =
        card.offsetLeft - mouseMovement.x;

    const offsetTop =
        card.offsetTop - mouseMovement.y;

    return {
        x: Math.max(0, offsetLeft),
        y: Math.max(0, offsetTop),
    };
};

export function autoGrow(textAreaRef) {
    const textArea = textAreaRef.current;

    if (!textArea) {
        return;
    }

    textArea.style.height = "auto";
    textArea.style.height = `${textArea.scrollHeight}px`;
}

export const setZIndex = (selectedCard) => {
    if (!selectedCard) {
        return;
    }

    selectedCard.style.zIndex = "999";

    Array.from(
        document.getElementsByClassName("card")
    ).forEach((card) => {
        if (card !== selectedCard) {
            card.style.zIndex = "998";
        }
    });
};

export function parseStoredJson(value, fallback) {
    if (value === null || value === undefined) {
        return fallback;
    }

    if (typeof value !== "string") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

export function bodyParser(value) {
    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value !== "string") {
        return String(value);
    }

    try {
        const parsedValue = JSON.parse(value);

        return typeof parsedValue === "string"
            ? parsedValue
            : String(parsedValue ?? "");
    } catch {
        return value;
    }
}