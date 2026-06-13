import { ID } from "appwrite";

import { databases } from "./config";

const collections = [
    {
        name: "notes",
        id: import.meta.env.VITE_COLLECTION_NOTES_ID,
    },
];

const db = {};

collections.forEach((collection) => {
    db[collection.name] = {
        create: async (
            payload,
            id = ID.unique(),
            permissions
        ) => {
            return databases.createDocument(
                import.meta.env.VITE_DATABASE_ID,
                collection.id,
                id,
                payload,
                permissions
            );
        },

        update: async (id, payload) => {
            return databases.updateDocument(
                import.meta.env.VITE_DATABASE_ID,
                collection.id,
                id,
                payload
            );
        },

        delete: async (id) => {
            return databases.deleteDocument(
                import.meta.env.VITE_DATABASE_ID,
                collection.id,
                id
            );
        },

        get: async (id) => {
            return databases.getDocument(
                import.meta.env.VITE_DATABASE_ID,
                collection.id,
                id
            );
        },

        list: async (queries = []) => {
            return databases.listDocuments(
                import.meta.env.VITE_DATABASE_ID,
                collection.id,
                queries
            );
        },
    };
});

export { db };
