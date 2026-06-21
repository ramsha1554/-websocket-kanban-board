import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSocket, mockSocketHandlers } = vi.hoisted(() => {
  const mockSocketHandlers = {};
  const mockSocket = {
    on: vi.fn((event, cb) => { mockSocketHandlers[event] = cb; }),
    emit: vi.fn(),
    removeAllListeners: vi.fn(() => {
      Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    }),
  };
  return { mockSocket, mockSocketHandlers };
});

vi.mock("socket.io-client", () => ({
  io: () => mockSocket,
}));

// Mock react-select to avoid testing external DOM structures
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

describe("KanbanBoard - Drag and Drop Integration Test", () => {
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

  it("triggers task:move socket event when dragging a task using mouse events", async () => {
    await renderSynced([
      { id: "task-1", title: "Drag Task", column: "todo", priority: "Medium", category: "Feature" },
    ]);

    const taskCard = screen.getByTestId("task-card-task-1");
    expect(taskCard).toBeInTheDocument();

    // Mock getBoundingClientRect to simulate screen layouts in JSDOM
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    
    Element.prototype.getBoundingClientRect = function () {
      // Return coordinates for the task card
      if (this.getAttribute && this.getAttribute("data-testid") === "task-card-task-1") {
        return { top: 100, left: 100, width: 200, height: 80, bottom: 180, right: 300, x: 100, y: 100 };
      }
      
      // Return coordinates for the "In Progress" column (drop zone sibling of the header)
      if (
        this.previousElementSibling &&
        this.previousElementSibling.textContent &&
        this.previousElementSibling.textContent.includes("In Progress")
      ) {
        return { top: 100, left: 400, width: 250, height: 600, bottom: 700, right: 650, x: 400, y: 100 };
      }
      
      // Return coordinates for the "To Do" column
      if (
        this.previousElementSibling &&
        this.previousElementSibling.textContent &&
        this.previousElementSibling.textContent.includes("To Do")
      ) {
        return { top: 100, left: 100, width: 250, height: 600, bottom: 700, right: 350, x: 100, y: 100 };
      }
      
      return { top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0, x: 0, y: 0 };
    };

    // 1. Initiate drag on the card
    fireEvent.mouseDown(taskCard, {
      clientX: 150,
      clientY: 140,
      button: 0,
      buttons: 1,
    });

    // 2. Drag past activation constraint (8px threshold) on document
    fireEvent.mouseMove(document, {
      clientX: 170,
      clientY: 140,
      button: 0,
      buttons: 1,
    });

    // 3. Move target over "In Progress" column coordinates on document
    fireEvent.mouseMove(document, {
      clientX: 500,
      clientY: 300,
      button: 0,
      buttons: 1,
    });

    // 4. Drop the task on document
    fireEvent.mouseUp(document, {
      clientX: 500,
      clientY: 300,
      button: 0,
      buttons: 0,
    });

    // Restore original DOM method
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;

    // Verify task:move was emitted
    expect(mockSocket.emit).toHaveBeenCalledWith("task:move", {
      id: "task-1",
      column: "inprogress",
    });
  });
});
