import { ID } from "appwrite";

import { account } from "../appwrite/config";

const isMissingSessionError = (error) => error?.code === 401;

export const authService = {
    async getCurrentUser() {
        try {
            return await account.get();
        } catch (error) {
            if (isMissingSessionError(error)) {
                return null;
            }

            throw error;
        }
    },

    async register({ name, email, password }) {
        await account.create(
            ID.unique(),
            email.trim(),
            password,
            name.trim()
        );

        await account.createEmailPasswordSession(
            email.trim(),
            password
        );

        return account.get();
    },

    async login({ email, password }) {
        await account.createEmailPasswordSession(
            email.trim(),
            password
        );

        return account.get();
    },

    async logout() {
        await account.deleteSession("current");
    },
};
