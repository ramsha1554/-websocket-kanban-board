import React, { useState } from "react";
import Select from "react-select";
import { useDraggable } from "@dnd-kit/core";
import { ArrowLeft, ArrowRight, Trash2, Pencil } from "lucide-react";
import { PRIORITY_BORDER, PRIORITY_BADGE, INPUT_STYLE } from "../constants";

const priorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

const categoryOptions = [
  { value: "Feature", label: "Feature" },
  { value: "Bug", label: "Bug" },
  { value: "Enhancement", label: "Enhancement" },
];

const customCardSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: 28,
    height: 28,
    border: "0.5px solid #DFE1E6",
    borderRadius: 3,
    fontSize: 12,
    background: "#fff",
    color: "#172B4D",
    boxShadow: state.isFocused ? "0 0 0 1px #0052CC" : "none",
    borderColor: state.isFocused ? "#0052CC" : "#DFE1E6",
    "&:hover": {
      borderColor: state.isFocused ? "#0052CC" : "#DFE1E6",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: 28,
    padding: "0 8px",
    display: "flex",
    alignItems: "center",
  }),
  input: (provided) => ({
    ...provided,
    margin: "0px",
    padding: "0px",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#172B4D",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: 28,
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    padding: "2px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: 12,
    background: state.isSelected ? "#0052CC" : state.isFocused ? "#F4F5F7" : "#fff",
    color: state.isSelected ? "#fff" : "#172B4D",
    cursor: "pointer",
  }),
  menu: (provided) => ({
    ...provided,
    marginTop: 1,
    zIndex: 999,
  }),
};

export default function TaskCard({ task, column, isFirstColumn, isLastColumn, onMove, onDelete, onUpdate }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editCategory, setEditCategory] = useState(task.category);
  const [editDescription, setEditDescription] = useState(task.description || "");

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : "auto",
      }
    : undefined;

  function startEdit() {
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditCategory(task.category);
    setEditDescription(task.description || "");
    setEditing(true);
  }

  function saveEdit() {
    if (!editTitle.trim()) return;
    onUpdate({ id: task.id, title: editTitle, priority: editPriority, category: editCategory, description: editDescription });
    setEditing(false);
  }

  const insertMarkdown = (tag) => {
    const textarea = document.getElementById(`edit-desc-${task.id}`);
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    let replacement = "";
    if (tag === "bold") {
      replacement = `**${selected || "bold text"}**`;
    } else if (tag === "italic") {
      replacement = `*${selected || "italic text"}*`;
    } else if (tag === "list") {
      replacement = `\n- ${selected || "list item"}`;
    }
    
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setEditDescription(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  function renderMarkdown(text) {
    if (!text) return { __html: "" };
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/^\s*-\s+(.*)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
    html = html.replace(/\n/g, "<br />");
    
    return { __html: html };
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} data-testid={`task-card-${task.id}`}>
      <div
        style={{
          border: "0.5px solid #DFE1E6",
          borderLeft: `3px solid ${PRIORITY_BORDER[task.priority]}`,
          padding: "10px 12px",
          background: "#fff",
        }}
      >
        {editing ? (
          <div onPointerDown={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ ...INPUT_STYLE, height: 28, fontSize: 12 }} />
            <Select
              classNamePrefix="react-select-edit"
              inputId={`edit-priority-select-${task.id}`}
              value={priorityOptions.find((o) => o.value === editPriority)}
              onChange={(opt) => setEditPriority(opt.value)}
              options={priorityOptions}
              styles={customCardSelectStyles}
              isSearchable={false}
            />
            <Select
              classNamePrefix="react-select-edit"
              inputId={`edit-category-select-${task.id}`}
              value={categoryOptions.find((o) => o.value === editCategory)}
              onChange={(opt) => setEditCategory(opt.value)}
              options={categoryOptions}
              styles={customCardSelectStyles}
              isSearchable={false}
            />
            
            {/* Markdown rich text helper toolbar */}
            <div style={{ display: "flex", gap: 4, background: "#F4F5F7", padding: "2px 4px", borderRadius: 3, width: "fit-content" }}>
              <button type="button" onClick={() => insertMarkdown("bold")} style={{ border: "none", background: "none", fontSize: 10, fontWeight: "bold", cursor: "pointer", padding: "1px 4px" }}>B</button>
              <button type="button" onClick={() => insertMarkdown("italic")} style={{ border: "none", background: "none", fontSize: 10, fontStyle: "italic", cursor: "pointer", padding: "1px 4px" }}>I</button>
              <button type="button" onClick={() => insertMarkdown("list")} style={{ border: "none", background: "none", fontSize: 10, cursor: "pointer", padding: "1px 4px" }}>• List</button>
            </div>
            
            <textarea
              id={`edit-desc-${task.id}`}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description details..."
              style={{
                width: "100%",
                minHeight: 50,
                border: "0.5px solid #DFE1E6",
                borderRadius: 3,
                padding: "4px 6px",
                fontSize: 11,
                fontFamily: "inherit",
                outline: "none",
                color: "#172B4D",
                resize: "vertical",
              }}
            />

            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={saveEdit} style={{ flex: 1, height: 26, background: "#0052CC", color: "#fff", border: "none", fontSize: 11, cursor: "pointer" }}>
                Save
              </button>
              <button onClick={() => setEditing(false)} style={{ flex: 1, height: 26, background: "#fff", border: "0.5px solid #DFE1E6", fontSize: 11, cursor: "pointer", color: "#7A869A" }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ cursor: "grab" }}>
            {(task.fileData?.startsWith("data:image") || task.fileData?.includes("/uploads/")) && (
              <img src={task.fileData} alt={task.fileName} style={{ width: "100%", height: 80, objectFit: "cover", marginBottom: 8 }} />
            )}
            <div style={{ fontSize: 13, fontWeight: 500, color: "#172B4D", marginBottom: 4 }}>{task.title}</div>
            
            {/* Display formatted description if present */}
            {task.description && (
              <div
                className="markdown-content"
                style={{
                  fontSize: 11,
                  color: "#5E6C84",
                  marginTop: 4,
                  marginBottom: 8,
                  lineHeight: 1.4,
                  borderTop: "0.5px dashed #DFE1E6",
                  paddingTop: 4,
                }}
                dangerouslySetInnerHTML={renderMarkdown(task.description)}
              />
            )}

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
                {!isFirstColumn && (
                  <button onClick={() => onMove(task.id, column, "prev")} title="Move back" style={{ width: 24, height: 24, border: "0.5px solid #DFE1E6", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A869A" }}>
                    <ArrowLeft size={12} />
                  </button>
                )}
                {!isLastColumn && (
                  <button onClick={() => onMove(task.id, column, "next")} title="Move forward" style={{ width: 24, height: 24, border: "0.5px solid #DFE1E6", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A869A" }}>
                    <ArrowRight size={12} />
                  </button>
                )}
                <button onClick={startEdit} title="Edit task" style={{ width: 24, height: 24, border: "0.5px solid #DFE1E6", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A869A" }}>
                  <Pencil size={11} />
                </button>
              </div>
              <button onClick={() => onDelete(task.id)} title="Delete task" style={{ width: 24, height: 24, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#C1C7D0" }}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}