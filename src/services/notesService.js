import {
    Permission,
    Role,
} from "appwrite";

import { db } from "../appwrite/databases";

const getPrivateNotePermissions = (userId) => [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
];

export const notesService = {
    async list() {
        const response = await db.notes.list();
        return response.documents;
    },

    async create(payload, userId) {
        if (!userId) {
            throw new Error(
                "A signed-in user is required to create a note."
            );
        }

        return db.notes.create(
            payload,
            undefined,
            getPrivateNotePermissions(userId)
        );
    },

    async update(id, payload) {
        return db.notes.update(id, payload);
    },

    async remove(id) {
        return db.notes.delete(id);
    },
};
