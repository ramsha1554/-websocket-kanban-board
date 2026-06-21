import React, { useRef, useState } from "react";
import Select from "react-select";
import { Plus, Paperclip } from "lucide-react";
import { INPUT_STYLE } from "../constants";

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

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: 34,
    height: 34,
    minWidth: 110,
    border: "0.5px solid #DFE1E6",
    borderRadius: 3,
    fontSize: 13,
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
    height: 34,
    padding: "0 10px",
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
    height: 34,
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    padding: "4px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: 13,
    background: state.isSelected ? "#0052CC" : state.isFocused ? "#F4F5F7" : "#fff",
    color: state.isSelected ? "#fff" : "#172B4D",
    cursor: "pointer",
  }),
  menu: (provided) => ({
    ...provided,
    marginTop: 2,
    zIndex: 999,
  }),
};

export default function Toolbar({ onCreate, error, setError }) {
  const fileInputRef = useRef(null);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Feature");
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [showDesc, setShowDesc] = useState(false);

  function addTask() {
    if (!title.trim()) return;
    const taskPayload = { title, priority, category, description };
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onCreate({
          ...taskPayload,
          fileName: file.name,
          fileData: reader.result,
        });
        setTitle("");
        setDescription("");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    } else {
      onCreate(taskPayload);
      setTitle("");
      setDescription("");
    }
  }

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected) return;
    const allowed = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!allowed.includes(selected.type)) {
      setError("Invalid file type. Only PNG, JPEG, GIF, or WEBP images are allowed.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setError("");
    setFile(selected);
  }

  return (
    <div
      style={{
        background: "#fff",
        borderBottom: "0.5px solid #DFE1E6",
        padding: "10px 24px",
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addTask()}
        placeholder="What needs to be done?"
        style={{ ...INPUT_STYLE, width: 260 }}
      />
      <Select
        classNamePrefix="react-select"
        inputId="priority-select"
        value={priorityOptions.find((o) => o.value === priority)}
        onChange={(opt) => setPriority(opt.value)}
        options={priorityOptions}
        styles={customSelectStyles}
        isSearchable={false}
      />
      <Select
        classNamePrefix="react-select"
        inputId="category-select"
        value={categoryOptions.find((o) => o.value === category)}
        onChange={(opt) => setCategory(opt.value)}
        options={categoryOptions}
        styles={customSelectStyles}
        isSearchable={false}
      />
      <label style={{ ...INPUT_STYLE, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "#7A869A" }}>
        <Paperclip size={13} /> {file ? file.name : "Attach image"}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
      </label>
      <button
        onClick={() => setShowDesc(!showDesc)}
        style={{
          height: 34,
          background: showDesc ? "#E6F1FB" : "#fff",
          border: "0.5px solid #DFE1E6",
          padding: "0 12px",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          color: showDesc ? "#185FA5" : "#7A869A",
          display: "flex",
          alignItems: "center",
          gap: 4,
          borderRadius: 3,
        }}
      >
        Description
      </button>
      <button
        onClick={addTask}
        style={{
          height: 34,
          background: "#0052CC",
          color: "#fff",
          border: "none",
          padding: "0 16px",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Plus size={14} /> Add Task
      </button>
      {error && <span style={{ fontSize: 11, color: "#E24B4A", width: "100%" }}>{error}</span>}

      {showDesc && (
        <div style={{ width: "100%", marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#7A869A" }}>Task Description (Markdown supported)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details, markdown, bold (**text**), italic (*text*), list (- item)..."
            style={{
              width: "100%",
              minHeight: 60,
              border: "0.5px solid #DFE1E6",
              borderRadius: 3,
              padding: 8,
              fontSize: 12,
              fontFamily: "inherit",
              outline: "none",
              color: "#172B4D",
              resize: "vertical",
            }}
          />
        </div>
      )}
    </div>
  );
}
}