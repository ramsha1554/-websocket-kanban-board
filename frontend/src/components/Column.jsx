import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Clock, CheckCircle, Circle } from "lucide-react";
import TaskCard from "./TaskCard";
import { PILL, ORDER } from "../constants";

const ICONS = { todo: Circle, inprogress: Clock, done: CheckCircle };

export default function Column({ col, tasks, onMove, onDelete, onUpdate }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  const Icon = ICONS[col.key];
  const isFirstColumn = col.key === ORDER[0];
  const isLastColumn = col.key === ORDER[ORDER.length - 1];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fff",
          border: "0.5px solid #DFE1E6",
          borderBottom: "none",
          padding: "8px 12px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            background: PILL[col.key].bg,
            color: PILL[col.key].color,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Icon size={10} />
          {col.label}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#7A869A" }}>{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        data-testid={`column-${col.key}`}
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
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            column={col.key}
            isFirstColumn={isFirstColumn}
            isLastColumn={isLastColumn}
            onMove={onMove}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))}
        {tasks.length === 0 && (
          <div style={{ fontSize: 12, color: "#C1C7D0", textAlign: "center", paddingTop: 40 }}>No tasks</div>
        )}
      </div>
    </div>
  );
}