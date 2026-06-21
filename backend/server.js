const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: ["http://localhost:3000", "https://websocket-kanban-board-lake.vercel.app"] },
  maxHttpBufferSize: 5e6,
});

const PORT = process.env.PORT || 5000;
const TASKS_FILE = path.join(__dirname, "tasks.json");
const UPLOADS_DIR = path.join(__dirname, "public", "uploads");

// Ensure public/uploads exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve static uploads
app.use("/uploads", express.static(UPLOADS_DIR));

// Load initial tasks
let tasks = [];
if (fs.existsSync(TASKS_FILE)) {
  try {
    tasks = JSON.parse(fs.readFileSync(TASKS_FILE, "utf8"));
  } catch (err) {
    console.error("Failed to read tasks file:", err.message);
    tasks = [];
  }
}

function saveTasks() {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save tasks:", err.message);
  }
}

function getBaseUrl() {
  return process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
}

const VALID_COLUMNS = ["todo", "inprogress", "done"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];
const VALID_CATEGORIES = ["Feature", "Bug", "Enhancement"];

// Root health check route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "WebSocket Kanban Backend is running." });
});

// Reset endpoint for testing
app.post("/test/reset", express.json(), (req, res) => {
  tasks = [];
  saveTasks();

  // Clear uploads directory
  if (fs.existsSync(UPLOADS_DIR)) {
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(UPLOADS_DIR, file));
      } catch (err) {
        console.error(`Failed to delete file ${file}:`, err.message);
      }
    }
  }

  io.emit("sync:tasks", tasks);
  res.sendStatus(200);
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function handleFileUpload(task) {
  if (task.fileData && task.fileData.startsWith("data:")) {
    const matches = task.fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");
      
      const fileExt = task.fileName ? path.extname(task.fileName) : ".png";
      const baseName = task.fileName ? path.basename(task.fileName, fileExt) : "file";
      const uniqueFileName = `${baseName}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${fileExt}`;
      
      const filePath = path.join(UPLOADS_DIR, uniqueFileName);
      fs.writeFileSync(filePath, buffer);
      
      // Update fileData with the static URL
      task.fileData = `${getBaseUrl()}/uploads/${uniqueFileName}`;
    }
  }
}

function deleteUploadedFile(task) {
  if (task && task.fileData && task.fileData.includes("/uploads/")) {
    try {
      const parts = task.fileData.split("/uploads/");
      const fileName = parts[parts.length - 1];
      const filePath = path.join(UPLOADS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error("Failed to delete file on disk:", err.message);
    }
  }
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
      
      // Process file upload if any
      handleFileUpload(task);
      
      tasks.push(task);
      saveTasks();
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
      
      // Check if file is changing / new file uploaded
      const oldTask = tasks[index];
      const updatedTask = { ...oldTask, ...data };
      
      if (data.fileData && data.fileData !== oldTask.fileData) {
        // Delete the old file first if it exists
        deleteUploadedFile(oldTask);
        handleFileUpload(updatedTask);
      }
      
      tasks[index] = updatedTask;
      saveTasks();
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
      saveTasks();
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
      const taskToDelete = tasks.find((t) => t.id === id);
      if (!taskToDelete) {
        return socket.emit("task:error", { action: "delete", message: "Task not found." });
      }
      
      // Delete uploaded file if any
      deleteUploadedFile(taskToDelete);
      
      tasks = tasks.filter((t) => t.id !== id);
      saveTasks();
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

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));