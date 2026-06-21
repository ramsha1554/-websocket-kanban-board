import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSocket, mockSocketHandlers } = vi.hoisted(() => {
  const mockSocketHandlers = {};
  const mockSocket = {
    on: vi.fn((event, cb) => { mockSocketHandlers[event] = cb; }),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
    removeAllListeners: vi.fn(() => {
      Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    }),
  };
  return { mockSocket, mockSocketHandlers };
});

vi.mock("socket.io-client", () => ({
  io: () => mockSocket,
}));

// Mock react-select to make tests deterministic and easy to query via native DOM APIs
vi.mock("react-select", () => ({
  default: ({ value, onChange, options }) => (
    <select
      value={value}
      onChange={(e) => onChange({ value: e.target.value, label: e.target.value })}
      data-testid="mock-select"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

import KanbanBoard from "../../components/KanbanBoard";

describe("KanbanBoard - Unit Tests", () => {
  beforeEach(() => {
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    vi.clearAllMocks();
  });

  async function renderSynced(initialTasks = []) {
    render(<KanbanBoard />);
    await act(async () => {
      mockSocketHandlers["sync:tasks"](initialTasks);
    });
  }

  it("renders the board header", async () => {
    await renderSynced();
    expect(screen.getByText("Kanban Board")).toBeInTheDocument();
  });

  it("renders all three columns", async () => {
    await renderSynced();
    expect(screen.getAllByText(/To Do/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/In Progress/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Done/).length).toBeGreaterThan(0);
  });

  it("renders the task input field", async () => {
    await renderSynced();
    expect(screen.getByPlaceholderText("What needs to be done?")).toBeInTheDocument();
  });

  it("renders priority dropdown with correct options", async () => {
    await renderSynced();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders category dropdown with correct options", async () => {
    await renderSynced();
    expect(screen.getByText("Feature")).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Enhancement")).toBeInTheDocument();
  });

  it("does not emit task:create when title is empty", async () => {
    await renderSynced();
    fireEvent.click(screen.getByText("Add Task"));
    expect(mockSocket.emit).not.toHaveBeenCalledWith("task:create", expect.anything());
  });

  it("shows file input for attachments", async () => {
    await renderSynced();
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it("file input accepts only images", async () => {
    await renderSynced();
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput.accept).toBe("image/*");
  });

  it("shows syncing indicator before sync:tasks is received", () => {
    render(<KanbanBoard />);
    expect(screen.getByText("Syncing tasks...")).toBeInTheDocument();
  });

  // Checklist item: Unit test - file validation logic
  it("shows an error when uploading an invalid file format", async () => {
    await renderSynced();
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(["fake pdf"], "test.pdf", { type: "application/pdf" });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    
    expect(screen.getByText(/Invalid file type/)).toBeInTheDocument();
  });

  // Checklist item: Unit test - progress % calculation
  it("displays correct completion percentage based on tasks in columns", async () => {
    render(<KanbanBoard />);
    await act(async () => {
      mockSocketHandlers["sync:tasks"]([
        { id: "1", title: "Task 1", column: "todo", priority: "Medium", category: "Feature" },
        { id: "2", title: "Task 2", column: "done", priority: "High", category: "Bug" },
      ]);
    });
    expect(screen.getByText(/50% complete/)).toBeInTheDocument();
  });
});