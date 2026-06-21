export const COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "inprogress", label: "In Progress" },
  { key: "done", label: "Done" },
];

export const ORDER = ["todo", "inprogress", "done"];

export const PILL = {
  todo: { bg: "#F4F5F7", color: "#5F5E5A" },
  inprogress: { bg: "#E6F1FB", color: "#185FA5" },
  done: { bg: "#EAF3DE", color: "#3B6D11" },
};

export const PRIORITY_BORDER = { High: "#E24B4A", Medium: "#EF9F27", Low: "#B4B2A9" };

export const PRIORITY_BADGE = {
  High: { bg: "#FCEBEB", color: "#A32D2D" },
  Medium: { bg: "#FAEEDA", color: "#854F0B" },
  Low: { bg: "#F1EFE8", color: "#5F5E5A" },
};

export const INPUT_STYLE = {
  height: 34,
  border: "0.5px solid #DFE1E6",
  padding: "0 10px",
  fontSize: 13,
  background: "#fff",
  outline: "none",
  color: "#172B4D",
};