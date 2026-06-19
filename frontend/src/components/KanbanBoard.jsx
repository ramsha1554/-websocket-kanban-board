import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Plus, ArrowLeft, ArrowRight, Trash2, Circle } from "lucide-react";

const socket = io("http://localhost:5000");

const COLUMNS = [
  { key: "todo", label: "To Do", dot: "bg-gray-400" },
  { key: "inprogress", label: "In Progress", dot: "bg-yellow-500" },
  { key: "done", label: "Done", dot: "bg-green-600" },
];

const ORDER = ["todo", "inprogress", "done"];

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

  function moveTask(id, currentColumn, direction) {
    const i = ORDER.indexOf(currentColumn);
    const next = direction === "next" ? i + 1 : i - 1;
    if (next < 0 || next >= ORDER.length) return;
    socket.emit("task:move", { id, column: ORDER[next] });
  }

  function deleteTask(id) {
    socket.emit("task:delete", id);
  }

  return (
    <div className="min-h-screen bg-white p-10">
      <div className="flex items-center justify-between mb-8 border-b border-gray-900 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Kanban Board
        </h1>
        <span className="text-xs text-gray-400 uppercase tracking-widest">
          {tasks.length} tasks
        </span>
      </div>

      <div className="flex gap-2 mb-10">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a new task..."
          className="border-b-2 border-gray-300 px-1 py-2 text-sm w-72 outline-none focus:border-gray-900 transition-colors"
        />
        <button
          onClick={addTask}
          className="flex items-center gap-1 bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.column === col.key);
          return (
            <div key={col.key}>
              <div className="flex items-center gap-2 mb-4">
                <Circle size={8} className={`${col.dot} rounded-full`} fill="currentColor" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700">
                  {col.label}
                </h3>
                <span className="text-xs text-gray-400">{colTasks.length}</span>
              </div>

              <div className="space-y-3 min-h-[300px] border-t border-gray-200 pt-4">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border border-gray-200 p-3 hover:border-gray-900 transition-colors group"
                  >
                    <p className="text-sm text-gray-900 mb-3">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {col.key !== "todo" && (
                          <button
                            onClick={() => moveTask(task.id, col.key, "prev")}
                            className="p-1 border border-gray-300 hover:border-gray-900 hover:bg-gray-50"
                            title="Move back"
                          >
                            <ArrowLeft size={14} />
                          </button>
                        )}
                        {col.key !== "done" && (
                          <button
                            onClick={() => moveTask(task.id, col.key, "next")}
                            className="p-1 border border-gray-300 hover:border-gray-900 hover:bg-gray-50"
                            title="Move forward"
                          >
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <p className="text-xs text-gray-300 italic">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KanbanBoard;