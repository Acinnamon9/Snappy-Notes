const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const pad = (value) => String(value).padStart(2, "0");

export function toDateTimeLocalValue(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return [
        date.getFullYear(),
        "-",
        pad(date.getMonth() + 1),
        "-",
        pad(date.getDate()),
        "T",
        pad(date.getHours()),
        ":",
        pad(date.getMinutes()),
    ].join("");
}

export function fromDateTimeLocalValue(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
}

export function createFutureDateTimeIso(
    value,
    unit,
    now = Date.now()
) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return null;
    }

    const multipliers = {
        minutes: MINUTE,
        hours: HOUR,
        days: DAY,
    };

    const multiplier = multipliers[unit];

    if (!multiplier) {
        return null;
    }

    return new Date(now + numericValue * multiplier).toISOString();
}

function formatDuration(milliseconds) {
    const absoluteMilliseconds = Math.max(
        0,
        Math.abs(milliseconds)
    );

    const days = Math.floor(absoluteMilliseconds / DAY);
    const hours = Math.floor(
        (absoluteMilliseconds % DAY) / HOUR
    );
    const minutes = Math.floor(
        (absoluteMilliseconds % HOUR) / MINUTE
    );
    const seconds = Math.floor(
        (absoluteMilliseconds % MINUTE) / SECOND
    );

    if (days > 0) {
        return `${days}d ${hours}h`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }

    return `${seconds}s`;
}

export function formatDeadlineTitle(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Invalid deadline";
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export function getDeadlineStatus(
    dueAt,
    completed,
    now = Date.now()
) {
    if (completed) {
        return {
            kind: "completed",
            label: "Completed",
            title: dueAt
                ? `Completed · Due ${formatDeadlineTitle(dueAt)}`
                : "Completed",
        };
    }

    if (!dueAt) {
        return {
            kind: "none",
            label: "No deadline",
            title: "No deadline set",
        };
    }

    const dueTime = new Date(dueAt).getTime();

    if (Number.isNaN(dueTime)) {
        return {
            kind: "none",
            label: "Invalid deadline",
            title: "The stored deadline is invalid",
        };
    }

    const remaining = dueTime - now;
    const title = `Due ${formatDeadlineTitle(dueAt)}`;

    if (remaining < 0) {
        return {
            kind: "overdue",
            label: `${formatDuration(remaining)} overdue`,
            title,
        };
    }

    return {
        kind: remaining <= DAY ? "due-soon" : "upcoming",
        label: `${formatDuration(remaining)} left`,
        title,
    };
}
