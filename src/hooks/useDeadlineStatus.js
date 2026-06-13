import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { getDeadlineStatus } from "../utils/dateTime";

export function useDeadlineStatus(dueAt, completed) {
    const [now, setNow] = useState(Date.now);

    useEffect(() => {
        setNow(Date.now());

        if (!dueAt || completed) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [completed, dueAt]);

    return useMemo(
        () => getDeadlineStatus(dueAt, completed, now),
        [completed, dueAt, now]
    );
}
