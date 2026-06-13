# Snappy Notes Architecture

## Stack

- React 18
- Vite
- React Router
- Appwrite
- Plain CSS

## Routes

- `/` redirects to `/notes`
- `/notes` renders the notes workspace
- `/login` is reserved for authentication
- `/settings` is reserved for settings
- Unknown URLs render the not-found page

## Responsibility boundaries

### Router

`src/app/router.jsx` defines application routes.

### Pages

Page components represent complete screens. Only the notes
route mounts `NotesProvider`, so ordinary pages do not fetch notes.

### Notes context

`NotesContext.jsx` owns:

- Loaded notes
- Selected note ID
- Initial loading state
- Initial load errors
- Create, update, and delete actions

### Notes service

`notesService.js` is the boundary between React and Appwrite.
UI components do not import the Appwrite database directly.

### Notes board

`NotesBoard.jsx` owns the board layout. The dark grid and scrolling
belong to `.notes-board`, not to the root application element.
## Authentication

`AuthContext.jsx` restores the Appwrite browser session and owns
registration, login, logout, and the current user.

`authService.js` is the boundary between React and Appwrite Account.
Pages and route guards do not call the Account SDK directly.

`ProtectedRoute.jsx` protects `/notes` and `/settings`.
`PublicOnlyRoute.jsx` redirects signed-in users away from `/login`.

## Note privacy

The notes collection uses document security. Authenticated users receive
collection-level create permission, while each note receives read, update,
and delete permissions for its creator only.

Appwrite permissions, rather than a client-side owner filter, enforce
privacy. Document lists therefore return only notes the current user is
allowed to read.
