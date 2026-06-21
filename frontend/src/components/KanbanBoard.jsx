import React from "react";
import { DndContext, useSensor, useSensors, PointerSensor, MouseSensor } from "@dnd-kit/core";
import { useSocket } from "../hooks/useSocket";
import { COLUMNS } from "../constants";
import Toolbar from "./Toolbar";
import Column from "./Column";
import ProgressSidebar from "./ProgressSidebar";

export default function KanbanBoard() {
  const { tasks, connected, syncing, error, setError, createTask, updateTask, moveTask, deleteTask } = useSocket();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
  );

  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const prevConnected = React.useRef(connected);
  React.useEffect(() => {
    if (connected && !prevConnected.current) {
      addToast("Successfully connected to WebSocket server!", "success");
    } else if (!connected && prevConnected.current) {
      addToast("Disconnected from WebSocket server. Retrying...", "error");
    }
    prevConnected.current = connected;
  }, [connected, addToast]);

  React.useEffect(() => {
    if (error) {
      addToast(error, "error");
      setError("");
    }
  }, [error, setError, addToast]);

  function handleMove(id, currentColumn, direction) {
    const order = ["todo", "inprogress", "done"];
    const i = order.indexOf(currentColumn);
    const next = direction === "next" ? i + 1 : i - 1;
    if (next < 0 || next >= order.length) return;
    moveTask(id, order[next]);
  }

  function handleDragEnd({ active, over }) {
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    if (task && task.column !== over.id) moveTask(active.id, over.id);
  }

  const total = tasks.length;
  const done = tasks.filter((t) => t.column === "done").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#F4F5F7", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ background: "#0052CC", padding: "0 24px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>Kanban Board</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{connected ? "Connected" : "Disconnected"}</span>
      </div>

      <Toolbar onCreate={createTask} error={error} setError={setError} />

      <div className="flex flex-col lg:flex-row gap-0">
        <div className="flex-1 p-5 md:p-6">
          <div style={{ fontSize: 11, color: "#7A869A", marginBottom: 14 }}>
            {total} tasks &nbsp;·&nbsp; {percent}% complete
          </div>

          {syncing ? (
            <div style={{ textAlign: "center", padding: 60, color: "#7A869A", fontSize: 13 }}>Syncing tasks...</div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
                {COLUMNS.map((col) => (
                  <Column
                    key={col.key}
                    col={col}
                    tasks={tasks.filter((t) => t.column === col.key)}
                    onMove={handleMove}
                    onDelete={deleteTask}
                    onUpdate={updateTask}
                  />
                ))}
              </div>
            </DndContext>
          )}
        </div>

        <ProgressSidebar tasks={tasks} />
      </div>

      {/* Floating Toast Notification Area */}
      <div style={{ position: "fixed", bottom: 20, right: 20, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-slide-in"
            style={{
              padding: "10px 14px",
              borderRadius: "3px",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 500,
              boxShadow: "0 4px 10px rgba(9, 30, 66, 0.15)",
              background: t.type === "success" ? "#1D9E75" : t.type === "error" ? "#E24B4A" : "#0052CC",
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 240,
              maxWidth: 320,
            }}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}