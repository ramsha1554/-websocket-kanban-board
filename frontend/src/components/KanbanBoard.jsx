import React, { useEffect, useState, useRef } from "react";
import { DndContext, useDraggable, useDroppable, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { io } from "socket.io-client";
import { Plus, ArrowLeft, ArrowRight, Trash2, Paperclip, Clock, CheckCircle, Circle, Pencil, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const socket = io("http://localhost:5000");

const COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "inprogress", label: "In Progress" },
  { key: "done", label: "Done" },
];

const ORDER = ["todo", "inprogress", "done"];

const PILL = {
  todo: { bg: "#F4F5F7", color: "#5F5E5A" },
  inprogress: { bg: "#E6F1FB", color: "#185FA5" },
  done: { bg: "#EAF3DE", color: "#3B6D11" },
};

const PRIORITY_BORDER = { High: "#E24B4A", Medium: "#EF9F27", Low: "#B4B2A9" };
const PRIORITY_BADGE = {
  High: { bg: "#FCEBEB", color: "#A32D2D" },
  Medium: { bg: "#FAEEDA", color: "#854F0B" },
  Low: { bg: "#F1EFE8", color: "#5F5E5A" },
};

function DraggableTask({ task, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : "auto",
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
      style={{
        flex: 1,
        background: isOver ? "#EBF0FF" : "#fff",
        border: "0.5px solid #DFE1E6",
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minHeight: 420,
        transition: "background 0.15s",
      }}
    >
      {children}
    </div>
  );
}

export default function KanbanBoard() {
  const fileInputRef = useRef(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Feature");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editCategory, setEditCategory] = useState("Feature");

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

  function startEdit(task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditCategory(task.category);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(id) {
    if (!editTitle.trim()) return;
    socket.emit("task:update", {
      id,
      title: editTitle,
      priority: editPriority,
      category: editCategory,
    });
    setEditingId(null);
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd({ active, over }) {
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    if (task && task.column !== over.id) socket.emit("task:move", { id: active.id, column: over.id });
  }

  const total = tasks.length;
  const done = tasks.filter((t) => t.column === "done").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const chartData = COLUMNS.map((c) => ({
    name: c.label,
    count: tasks.filter((t) => t.column === c.key).length,
  }));

  const sel = {
    height: 34,
    border: "0.5px solid #DFE1E6",
    padding: "0 10px",
    fontSize: 13,
    background: "#fff",
    outline: "none",
    color: "#172B4D",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F4F5F7", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
     
      <div style={{ background: "#0052CC", padding: "0 24px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>Kanban Board</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{connected ? "Connected" : "Disconnected"}</span>
      </div>


      <div style={{ background: "#fff", borderBottom: "0.5px solid #DFE1E6", padding: "10px 24px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="What needs to be done?"
          style={{ ...sel, width: 260 }}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={sel}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={sel}>
          <option>Feature</option>
          <option>Bug</option>
          <option>Enhancement</option>
        </select>
        <label style={{ ...sel, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "#7A869A" }}>
          <Paperclip size={13} /> {file ? file.name : "Attach image"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const s = e.target.files[0];
              if (!s) return;
              const allowed = ["image/png", "image/jpeg", "image/gif", "image/webp"];
              if (!allowed.includes(s.type)) {
                setFileError("Invalid file type. Only PNG, JPEG, GIF, or WEBP images are allowed.");
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
              }
              setFileError("");
              setFile(s);
            }}
          />
        </label>
        <button
          onClick={addTask}
          style={{ height: 34, background: "#0052CC", color: "#fff", border: "none", padding: "0 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
        >
          <Plus size={14} /> Add Task
        </button>
        {fileError && <span style={{ fontSize: 11, color: "#E24B4A", width: "100%" }}>{fileError}</span>}
      </div>

      {/* Body */}
      <div style={{ display: "flex", gap: 0 }}>
        {/* Board */}
        <div style={{ flex: 1, padding: "20px 24px" }}>
          <div style={{ fontSize: 11, color: "#7A869A", marginBottom: 14 }}>
            {total} tasks &nbsp;·&nbsp; {percent}% complete
          </div>

          {syncing ? (
            <div style={{ textAlign: "center", padding: 60, color: "#7A869A", fontSize: 13 }}>
              Syncing tasks...
            </div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {COLUMNS.map((col) => {
                  const colTasks = tasks.filter((t) => t.column === col.key);
                  return (
                    <div key={col.key}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "0.5px solid #DFE1E6", borderBottom: "none", padding: "8px 12px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", background: PILL[col.key].bg, color: PILL[col.key].color, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 5 }}>
                          {col.key === "todo" && <Circle size={10} />}
                          {col.key === "inprogress" && <Clock size={10} />}
                          {col.key === "done" && <CheckCircle size={10} />}
                          {col.label}
                        </span>
                        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#7A869A" }}>{colTasks.length}</span>
                      </div>
                      <DroppableColumn id={col.key}>
                        {colTasks.map((task) => (
                          <DraggableTask key={task.id} task={task}>
                            <div style={{ border: "0.5px solid #DFE1E6", borderLeft: `3px solid ${PRIORITY_BORDER[task.priority]}`, padding: "10px 12px", background: "#fff" }}>
                              {editingId === task.id ? (
                                <div onPointerDown={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  <input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    style={{ ...sel, height: 28, fontSize: 12 }}
                                  />
                                  <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} style={{ ...sel, height: 28, fontSize: 12 }}>
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                  </select>
                                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ ...sel, height: 28, fontSize: 12 }}>
                                    <option>Feature</option>
                                    <option>Bug</option>
                                    <option>Enhancement</option>
                                  </select>
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <button onClick={() => saveEdit(task.id)} style={{ flex: 1, height: 26, background: "#0052CC", color: "#fff", border: "none", fontSize: 11, cursor: "pointer" }}>
                                      Save
                                    </button>
                                    <button onClick={cancelEdit} style={{ flex: 1, height: 26, background: "#fff", border: "0.5px solid #DFE1E6", fontSize: 11, cursor: "pointer", color: "#7A869A" }}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ cursor: "grab" }}>
                                  {task.fileData?.startsWith("data:image") && (
                                    <img src={task.fileData} alt={task.fileName} style={{ width: "100%", height: 80, objectFit: "cover", marginBottom: 8 }} />
                                  )}
                                  <div style={{ fontSize: 13, fontWeight: 500, color: "#172B4D", marginBottom: 8 }}>{task.title}</div>
                                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                                    <span style={{ fontSize: 10, padding: "2px 6px", fontWeight: 600, background: PRIORITY_BADGE[task.priority].bg, color: PRIORITY_BADGE[task.priority].color }}>
                                      {task.priority}
                                    </span>
                                    <span style={{ fontSize: 10, padding: "2px 6px", fontWeight: 600, background: "#F4F5F7", color: "#7A869A" }}>
                                      {task.category}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", gap: 3 }}>
                                      {col.key !== "todo" && (
                                        <button onClick={() => moveTask(task.id, col.key, "prev")} title="Move back" style={{ width: 24, height: 24, border: "0.5px solid #DFE1E6", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A869A" }}>
                                          <ArrowLeft size={12} />
                                        </button>
                                      )}
                                      {col.key !== "done" && (
                                        <button onClick={() => moveTask(task.id, col.key, "next")} title="Move forward" style={{ width: 24, height: 24, border: "0.5px solid #DFE1E6", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A869A" }}>
                                          <ArrowRight size={12} />
                                        </button>
                                      )}
                                      <button onClick={() => startEdit(task)} title="Edit task" style={{ width: 24, height: 24, border: "0.5px solid #DFE1E6", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A869A" }}>
                                        <Pencil size={11} />
                                      </button>
                                    </div>
                                    <button onClick={() => deleteTask(task.id)} title="Delete task" style={{ width: 24, height: 24, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#C1C7D0" }}>
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DraggableTask>
                        ))}
                        {colTasks.length === 0 && (
                          <div style={{ fontSize: 12, color: "#C1C7D0", textAlign: "center", paddingTop: 40 }}>No tasks</div>
                        )}
                      </DroppableColumn>
                    </div>
                  );
                })}
              </div>
            </DndContext>
          )}
        </div>


        <div style={{ width: 220, background: "#fff", borderLeft: "0.5px solid #DFE1E6", padding: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "#7A869A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Progress</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#172B4D", marginBottom: 16 }}>{percent}%</div>

          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} barSize={24}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 9 }} width={20} />
              <Tooltip />
              <Bar dataKey="count" fill="#0052CC" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {COLUMNS.map((col) => {
            const count = tasks.filter((t) => t.column === col.key).length;
            const pct = total === 0 ? 0 : Math.round((count / total) * 100);
            const barColor = col.key === "todo" ? "#888780" : col.key === "inprogress" ? "#0052CC" : "#1D9E75";
            return (
              <div key={col.key} style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7A869A", marginBottom: 4 }}>
                  <span>{col.label}</span>
                  <span>{count}</span>
                </div>
                <div style={{ height: 5, background: "#F4F5F7" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: barColor, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}