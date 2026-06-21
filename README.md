# WebSocket-Powered Kanban Board

A real-time Kanban board built with React, Node.js, and Socket.IO. Tasks sync instantly across all connected clients — create, edit, move, and delete tasks with live updates, file attachments, priority/category tagging, and a live progress chart.

**Live Demo:** [websocket-kanban-board-lake.vercel.app](https://websocket-kanban-board-lake.vercel.app)  
**Backend API:** [websocket-kanban-board-pzym.onrender.com](https://websocket-kanban-board-pzym.onrender.com)

---

## Features

- **Real-time sync** — all changes broadcast instantly to every connected client via Socket.IO
- **Drag and drop** — move tasks between columns using `@dnd-kit`
- **Arrow navigation** — move tasks forward/back between columns with buttons
- **Create / edit / delete tasks** — inline editing with save/cancel
- **Priority & category** — Low / Medium / High priority and Bug / Feature / Enhancement category per task
- **File attachments** — upload images (PNG, JPEG, GIF, WEBP) with inline preview on the task card
- **File validation** — invalid file types show an error message
- **Progress sidebar** — live Recharts bar chart showing task count per column + overall completion %
- **Loading state** — "Syncing tasks..." shown until the server responds
- **Persistent storage** — tasks saved to `tasks.json` on the server, survive restarts
- **Multi-client sync** — open two tabs and changes appear instantly in both

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Drag & Drop | @dnd-kit/core |
| Charts | Recharts |
| Icons | lucide-react |
| WebSockets | Socket.IO client |
| Backend | Node.js, Express, Socket.IO |
| Persistence | JSON file (tasks.json) |
| Unit & Integration Tests | Vitest + React Testing Library |
| E2E Tests | Playwright |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## Project Structure

```
├── backend/
│   ├── server.js                   # Express + Socket.IO server
│   ├── tasks.json                  # Persistent task storage (auto-created)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KanbanBoard.jsx     # Root board component
│   │   │   ├── Column.jsx          # Individual column with drop zone
│   │   │   ├── TaskCard.jsx        # Draggable task card with inline edit
│   │   │   ├── Toolbar.jsx         # Task creation bar + file upload
│   │   │   └── ProgressSidebar.jsx # Recharts progress chart
│   │   ├── hooks/
│   │   │   └── useSocket.js        # Socket.IO connection + all WS events
│   │   ├── tests/
│   │   │   ├── unit/               # Vitest unit tests
│   │   │   ├── integration/        # Vitest integration tests
│   │   │   └── e2e/                # Playwright E2E tests
│   │   └── constants.js            # Columns, styles, shared config
│   ├── playwright.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### 1. Clone the repo

```bash
git clone https://github.com/ramsha1554/-websocket-kanban-board.git
cd -websocket-kanban-board
```

### 2. Start the backend

```bash
cd backend
npm install
npm start
# Server running on http://localhost:5000
```

### 3. Start the frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` folder:

```
VITE_SOCKET_URL=http://localhost:5000
```

Then run:

```bash
npm run dev
# App running on http://localhost:3000
```

---

## Running Tests

### Unit & Integration Tests (Vitest)

```bash
cd frontend
npm run test
```

Covers:

- Board rendering, column display, dropdown options
- File validation (valid/invalid MIME types)
- Progress % calculation (0%, 50%, 100%, rounding)
- All WebSocket events: `sync:tasks`, `task:created`, `task:updated`, `task:moved`, `task:deleted`, `task:error`
- User interactions: create, edit, delete, move via arrow buttons
- Progress sidebar live updates

### E2E Tests (Playwright)

```bash
cd frontend
npm run test:e2e
```

Playwright automatically starts the backend and frontend before running tests. Covers:

- Board loads with all three columns
- Create, edit, and delete tasks
- Priority and category selection
- Valid image upload with inline preview
- Invalid file type error message
- Drag and drop between columns
- Arrow button column navigation
- Progress % updates to 100% when task moves to Done
- Graph bar count updates as tasks are added
- Multi-client real-time sync — task created, deleted, or edited in one tab appears instantly in another

---

## WebSocket Events

| Event | Direction | Description |
|---|---|---|
| `sync:tasks` | Server → Client | Sends all tasks on connect |
| `task:create` | Client → Server | Creates a new task |
| `task:created` | Server → All clients | Broadcasts the new task |
| `task:update` | Client → Server | Updates task fields |
| `task:updated` | Server → All clients | Broadcasts updated task |
| `task:move` | Client → Server | Moves task to a new column |
| `task:moved` | Server → All clients | Broadcasts the column change |
| `task:delete` | Client → Server | Deletes a task |
| `task:deleted` | Server → All clients | Broadcasts the deleted task ID |
| `task:error` | Server → Client | Sends validation/error message |

---

## Deployment

### Frontend — Vercel

Add this environment variable in your Vercel project settings:

```
VITE_SOCKET_URL=https://websocket-kanban-board-pzym.onrender.com
```

### Backend — Render

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Render injects `PORT` automatically. CORS is configured to allow all `.vercel.app` preview URLs and `localhost:3000`.

---

## Test Coverage Summary

| Area | Count | What is covered |
|---|---|---|
| Unit | 18 tests | Rendering, file validation, progress % calculation, emit guards |
| Integration | 14 tests | All WS events, user interactions, progress sidebar, DnD functional |
| E2E | 14 tests | Full user flows, multi-client sync, file upload, graph, drag and drop |
