// import { useEffect, useState } from "react";
// import { io } from "socket.io-client";


// const socket = io("http://localhost:5000", { autoConnect: false });

// export function useSocket() {
//   const [tasks, setTasks] = useState([]);
//   const [connected, setConnected] = useState(false);
//   const [syncing, setSyncing] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     socket.on("connect", () => setConnected(true));
//     socket.on("disconnect", () => setConnected(false));

//     socket.on("sync:tasks", (data) => {
//       setTasks(data);
//       setSyncing(false);
//     });

//     socket.on("task:created", (task) => setTasks((p) => [...p, task]));

//     socket.on("task:updated", (updated) =>
//       setTasks((p) => p.map((t) => (t.id === updated.id ? updated : t)))
//     );

//     socket.on("task:moved", ({ id, column }) =>
//       setTasks((p) => p.map((t) => (t.id === id ? { ...t, column } : t)))
//     );

//     socket.on("task:deleted", (id) => setTasks((p) => p.filter((t) => t.id !== id)));

//     socket.on("task:error", (err) => setError(err.message));

//     // Reset local state for this mount, then connect now that every
//     // listener above is guaranteed to be in place to catch the events
//     // the server fires immediately on connection.
//     setSyncing(true);
//     socket.connect();

//     return () => {
//       socket.removeAllListeners();
//       socket.disconnect();
//     };
//   }, []);

//   function createTask(data) {
//     socket.emit("task:create", data);
//   }

//   function updateTask(data) {
//     socket.emit("task:update", data);
//   }

//   function moveTask(id, column) {
//     socket.emit("task:move", { id, column });
//   }

//   function deleteTask(id) {
//     socket.emit("task:delete", id);
//   }

//   return { tasks, connected, syncing, error, setError, createTask, updateTask, moveTask, deleteTask };
// }


import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:5000"
  : (import.meta.env.VITE_SOCKET_URL || "https://websocket-kanban-board-pzym.onrender.com");

const socket = io(SOCKET_URL, { autoConnect: false });

export function useSocket() {
  const [tasks, setTasks] = useState([]);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("sync:tasks", (data) => {
      setTasks(data);
      setSyncing(false);
    });

    socket.on("task:created", (task) => setTasks((p) => [...p, task]));

    socket.on("task:updated", (updated) =>
      setTasks((p) => p.map((t) => (t.id === updated.id ? updated : t)))
    );

    socket.on("task:moved", ({ id, column }) =>
      setTasks((p) => p.map((t) => (t.id === id ? { ...t, column } : t)))
    );

    socket.on("task:deleted", (id) => setTasks((p) => p.filter((t) => t.id !== id)));

    socket.on("task:error", (err) => setError(err.message));

    setSyncing(true);
    if (socket.connected) {
      setConnected(true);
      socket.disconnect();
    }
    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  function createTask(data) {
    socket.emit("task:create", data);
  }

  function updateTask(data) {
    socket.emit("task:update", data);
  }

  function moveTask(id, column) {
    socket.emit("task:move", { id, column });
  }

  function deleteTask(id) {
    socket.emit("task:delete", id);
  }

  return { tasks, connected, syncing, error, setError, createTask, updateTask, moveTask, deleteTask };
}