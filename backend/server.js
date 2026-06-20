const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:3000" },
  maxHttpBufferSize: 5e6,
});

let tasks = [];

const VALID_COLUMNS = ["todo", "inprogress", "done"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];
const VALID_CATEGORIES = ["Feature", "Bug", "Enhancement"];

app.post("/test/reset", express.json(), (req, res) => {
  tasks = [];
  io.emit("sync:tasks", tasks);
  res.sendStatus(200);
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.emit("sync:tasks", tasks);

  socket.on("task:create", (data) => {
    try {
      if (!data || typeof data.title !== "string" || !data.title.trim()) {
        return socket.emit("task:error", { action: "create", message: "Task title is required." });
      }
      const task = {
        id: generateId(),
        column: "todo",
        description: "",
        fileName: null,
        fileData: null,
        createdAt: new Date().toISOString(),
        priority: VALID_PRIORITIES.includes(data.priority) ? data.priority : "Medium",
        category: VALID_CATEGORIES.includes(data.category) ? data.category : "Feature",
        ...data,
        title: data.title.trim(),
      };
      tasks.push(task);
      io.emit("task:created", task);
    } catch (err) {
      console.error("task:create error:", err.message);
      socket.emit("task:error", { action: "create", message: "Failed to create task." });
    }
  });

  socket.on("task:update", (data) => {
    try {
      if (!data || !data.id) {
        return socket.emit("task:error", { action: "update", message: "Task id is required." });
      }
      const index = tasks.findIndex((t) => t.id === data.id);
      if (index === -1) {
        return socket.emit("task:error", { action: "update", message: "Task not found." });
      }
      tasks[index] = { ...tasks[index], ...data };
      io.emit("task:updated", tasks[index]);
    } catch (err) {
      console.error("task:update error:", err.message);
      socket.emit("task:error", { action: "update", message: "Failed to update task." });
    }
  });

  socket.on("task:move", ({ id, column } = {}) => {
    try {
      if (!id || !VALID_COLUMNS.includes(column)) {
        return socket.emit("task:error", { action: "move", message: "Invalid task id or column." });
      }
      const task = tasks.find((t) => t.id === id);
      if (!task) {
        return socket.emit("task:error", { action: "move", message: "Task not found." });
      }
      task.column = column;
      io.emit("task:moved", { id, column });
    } catch (err) {
      console.error("task:move error:", err.message);
      socket.emit("task:error", { action: "move", message: "Failed to move task." });
    }
  });

  socket.on("task:delete", (id) => {
    try {
      if (!id) {
        return socket.emit("task:error", { action: "delete", message: "Task id is required." });
      }
      const exists = tasks.some((t) => t.id === id);
      if (!exists) {
        return socket.emit("task:error", { action: "delete", message: "Task not found." });
      }
      tasks = tasks.filter((t) => t.id !== id);
      io.emit("task:deleted", id);
    } catch (err) {
      console.error("task:delete error:", err.message);
      socket.emit("task:error", { action: "delete", message: "Failed to delete task." });
    }
  });

  socket.on("disconnect", () => console.log("Disconnected:", socket.id));

  socket.on("error", (err) => {
    console.error("Socket error:", err.message);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));