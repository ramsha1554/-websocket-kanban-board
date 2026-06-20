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

describe("KanbanBoard - Unit Tests", () => {
  beforeEach(() => {
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    vi.clearAllMocks();
  });

  async function renderSynced() {
    render(<KanbanBoard />);
    await act(async () => {
      mockSocketHandlers["sync:tasks"]([]);
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
});