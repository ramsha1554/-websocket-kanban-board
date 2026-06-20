const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:3000" } });

let tasks = [];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.emit("sync:tasks", tasks);

  socket.on("task:create", (data) => {
    const task = {
      id: generateId(),
      column: "todo",
      description: "",
      fileName: null,
      fileData: null,
      createdAt: new Date().toISOString(),
      ...data,
    };
    tasks.push(task);
    io.emit("task:created", task);
  });

  socket.on("task:update", (data) => {
    const index = tasks.findIndex((t) => t.id === data.id);
    if (index === -1) return;
    tasks[index] = { ...tasks[index], ...data };
    io.emit("task:updated", tasks[index]);
  });

  socket.on("task:move", ({ id, column }) => {
    const task = tasks.find((t) => t.id === id);
    if (task) task.column = column;
    io.emit("task:moved", { id, column });
  });

  socket.on("task:delete", (id) => {
    tasks = tasks.filter((t) => t.id !== id);
    io.emit("task:deleted", id);
  });

  socket.on("disconnect", () => console.log("Disconnected:", socket.id));
});

server.listen(5000, () => console.log("Server running on port 5000"));