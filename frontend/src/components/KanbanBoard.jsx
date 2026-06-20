import React, { useEffect, useState, useRef } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { io } from "socket.io-client";
import { Plus, ArrowLeft, ArrowRight, Trash2, Circle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
const socket = io("http://localhost:5000");

const COLUMNS = [
  { key: "todo", label: "To Do", dot: "bg-gray-400" },
  { key: "inprogress", label: "In Progress", dot: "bg-yellow-500" },
  { key: "done", label: "Done", dot: "bg-green-600" },
];

const ORDER = ["todo", "inprogress", "done"];

function DraggableTask({ task, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : "auto",
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}

function DroppableColumn({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 min-h-[300px] border-t pt-4 transition-colors ${
        isOver ? "border-gray-900 bg-gray-50" : "border-gray-200"
      }`}
    >
      {children}
    </div>
  );
}

function KanbanBoard() {
  const fileInputRef = useRef(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Feature");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");

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

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        socket.emit("task:create", {
          title,
          priority,
          category,
          fileName: file.name,
          fileData: reader.result,
        });
        setTitle("");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    } else {
      socket.emit("task:create", { title, priority, category });
      setTitle("");
    }
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    if (task && task.column !== over.id) {
      socket.emit("task:move", { id: active.id, column: over.id });
    }
  }
const chartData = [
  { name: "To Do", count: tasks.filter((t) => t.column === "todo").length },
  { name: "In Progress", count: tasks.filter((t) => t.column === "inprogress").length },
  { name: "Done", count: tasks.filter((t) => t.column === "done").length },
];

const total = tasks.length;
const done = tasks.filter((t) => t.column === "done").length;
const percent = total === 0 ? 0 : Math.round((done / total) * 100);



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
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="border border-gray-300 px-2 py-2 text-sm outline-none focus:border-gray-900 bg-white"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 px-2 py-2 text-sm outline-none focus:border-gray-900 bg-white"
        >
          <option value="Feature">Feature</option>
          <option value="Bug">Bug</option>
          <option value="Enhancement">Enhancement</option>
        </select>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const selected = e.target.files[0];
            if (!selected) return;

            const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
            if (!allowedTypes.includes(selected.type)) {
              setFileError("Invalid file type. Only PNG, JPEG, GIF, or WEBP images are allowed.");
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
              return;
            }

            setFileError("");
            setFile(selected);
          }}
          className="text-sm"
        />

        <button
          onClick={addTask}
          className="flex items-center gap-1 bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {fileError && (
        <p className="text-xs text-red-600 -mt-8 mb-8">{fileError}</p>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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

              <DroppableColumn id={col.key}>
                {colTasks.map((task) => (
                  <DraggableTask key={task.id} task={task}>
                  <div
                    className="border border-gray-200 p-3 hover:border-gray-900 transition-colors group bg-white cursor-grab active:cursor-grabbing"
                  >
                    {task.fileData && task.fileData.startsWith("data:image") && (
                      <img
                        src={task.fileData}
                        alt={task.fileName || "attachment"}
                        className="w-full h-28 object-cover border border-gray-200 mb-2"
                      />
                    )}
                    <p className="text-sm text-gray-900 mb-1">{task.title}</p>
                    <div className="flex gap-1 mb-3">
                      <span
                        className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 border ${
                          task.priority === "High"
                            ? "border-red-600 text-red-600"
                            : task.priority === "Medium"
                            ? "border-yellow-600 text-yellow-600"
                            : "border-gray-400 text-gray-500"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 border border-gray-900 text-gray-900">
                        {task.category}
                      </span>
                    </div>
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
                  </DraggableTask>
                ))}

                {colTasks.length === 0 && (
                  <p className="text-xs text-gray-300 italic">No tasks</p>
                )}
              </DroppableColumn>
            </div>
          );
        })}
      </div>
      </DndContext>
      <div className="mt-10 border-t border-gray-200 pt-8">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-700">
      Progress
    </h2>
    <span className="text-xs text-gray-400">{percent}% complete</span>
  </div>
  <ResponsiveContainer width="100%" height={180}>
    <BarChart data={chartData}>
      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
      <Tooltip />
      <Bar dataKey="count" fill="#111111" radius={[2, 2, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>
    </div>
  );
}

export default KanbanBoard;