# Appwrite setup for Snappy Notes

## Authentication

In the Appwrite Console:

1. Open the Snappy Notes project.
2. Add a Web platform for the local development hostname.
3. Enable email/password authentication under Auth.

For Vite's default local server, the hostname is usually:

```text
localhost
```

## Notes collection permissions

Open the existing `notes` collection and configure:

1. Enable **Document Security**.
2. At collection level, grant **Create** to the **Users** role.
3. Do not grant collection-level Read, Update, or Delete to Users or Any.
4. Remove any broad `Any` permissions left from development.

Every new note is created with document-level Read, Update, and Delete
permissions for its creator.

## Existing notes

Notes created before authentication may have public permissions or may not
belong to any authenticated account. Review, migrate, or recreate those
documents before treating the collection as private.
