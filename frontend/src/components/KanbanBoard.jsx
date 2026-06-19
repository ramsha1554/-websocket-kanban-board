import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    socket.on("sync:tasks", (data) => setTasks(data));
    socket.on("task:created", (task) => setTasks((prev) => [...prev, task]));
    socket.on("task:moved", ({ id, column }) =>
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column } : t)))
    );
    socket.on("task:deleted", (id) =>
      setTasks((prev) => prev.filter((t) => t.id !== id))
    );

    return () => socket.removeAllListeners();
  }, []);

  function addTask() {
    if (!title.trim()) return;
    socket.emit("task:create", { title, priority: "Medium", category: "Feature" });
    setTitle("");
  }

  function moveTask(id, column) {
    socket.emit("task:move", { id, column });
  }

  function deleteTask(id) {
    socket.emit("task:delete", id);
  }

  return (
    <div style={{ display: "flex", gap: "1rem", padding: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
        <button onClick={addTask}>Add Task</button>
      </div>

      {["todo", "inprogress", "done"].map((col) => (
        <div key={col} style={{ flex: 1, border: "1px solid #ccc", padding: "1rem" }}>
          <h3>{{ todo: "To Do", inprogress: "In Progress", done: "Done" }[col]}</h3>
          {tasks.filter((t) => t.column === col).map((task) => (
            <div key={task.id} style={{ border: "1px solid #eee", padding: "0.5rem", marginBottom: "0.5rem" }}>
              <p>{task.title}</p>
              {col !== "todo" && <button onClick={() => moveTask(task.id, col === "inprogress" ? "todo" : "inprogress")}>Back</button>}
              {col !== "done" && <button onClick={() => moveTask(task.id, col === "todo" ? "inprogress" : "done")}>Next</button>}
              <button onClick={() => deleteTask(task.id)}>Delete</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default KanbanBoard;