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

import KanbanBoard from "../../components/KanbanBoard";

describe("KanbanBoard - Integration Tests", () => {
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

  it("syncs tasks from server on connect", async () => {
    await renderSynced([
      { id: "1", title: "Server Task", column: "todo", priority: "High", category: "Bug" },
    ]);
    expect(screen.getByText("Server Task")).toBeInTheDocument();
  });

  it("adds a new task when task:created event is received", async () => {
    await renderSynced();
    await act(async () => {
      mockSocketHandlers["task:created"]({
        id: "2", title: "New Task", column: "todo", priority: "Medium", category: "Feature",
      });
    });
    expect(screen.getByText("New Task")).toBeInTheDocument();
  });

  it("moves a task when task:moved event is received", async () => {
    await renderSynced([
      { id: "3", title: "Move Me", column: "todo", priority: "Low", category: "Enhancement" },
    ]);
    await act(async () => {
      mockSocketHandlers["task:moved"]({ id: "3", column: "inprogress" });
    });
    expect(screen.getByText("Move Me")).toBeInTheDocument();
  });

  it("removes a task when task:deleted event is received", async () => {
    await renderSynced([
      { id: "4", title: "Delete Me", column: "todo", priority: "Low", category: "Bug" },
    ]);
    await act(async () => {
      mockSocketHandlers["task:deleted"]("4");
    });
    expect(screen.queryByText("Delete Me")).not.toBeInTheDocument();
  });

  it("updates a task when task:updated event is received", async () => {
    await renderSynced([
      { id: "5", title: "Old Title", column: "todo", priority: "Low", category: "Bug" },
    ]);
    await act(async () => {
      mockSocketHandlers["task:updated"]({
        id: "5", title: "Updated Title", column: "todo", priority: "High", category: "Feature",
      });
    });
    expect(screen.getByText("Updated Title")).toBeInTheDocument();
    expect(screen.queryByText("Old Title")).not.toBeInTheDocument();
  });

  it("emits task:create when Add Task button is clicked with a title", async () => {
    await renderSynced();
    const input = screen.getByPlaceholderText("What needs to be done?");
    fireEvent.change(input, { target: { value: "My New Task" } });
    fireEvent.click(screen.getByText("Add Task"));
    expect(mockSocket.emit).toHaveBeenCalledWith("task:create", expect.objectContaining({
      title: "My New Task",
    }));
  });

  it("emits task:delete when delete button is clicked", async () => {
    await renderSynced([
      { id: "6", title: "Task To Delete", column: "todo", priority: "Low", category: "Bug" },
    ]);
    const deleteBtn = screen.getByTitle("Delete task");
    fireEvent.click(deleteBtn);
    expect(mockSocket.emit).toHaveBeenCalledWith("task:delete", "6");
  });
});