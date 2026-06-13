import { db } from "../appwrite/databases";

export const notesService = {
    async list() {
        const response = await db.notes.list();
        return response.documents;
    },

    async create(payload) {
        return db.notes.create(payload);
    },

    async update(id, payload) {
        return db.notes.update(id, payload);
    },

    async remove(id) {
        return db.notes.delete(id);
    },
};