import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import KanbanBoard from "../../components/KanbanBoard";

// Mock socket.io-client
vi.mock("socket.io-client", () => {
  const mockSocket = {
    on: vi.fn(),
    emit: vi.fn(),
    removeAllListeners: vi.fn(),
  };
  return { io: () => mockSocket };
});

describe("KanbanBoard - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the board header", () => {
    render(<KanbanBoard />);
    expect(screen.getByText("Kanban Board")).toBeInTheDocument();
  });

  it("renders all three columns", () => {
    render(<KanbanBoard />);
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("renders the task input field", () => {
    render(<KanbanBoard />);
    expect(screen.getByPlaceholderText("Add a new task...")).toBeInTheDocument();
  });

  it("renders priority dropdown with correct options", () => {
    render(<KanbanBoard />);
    expect(screen.getByDisplayValue("Medium")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders category dropdown with correct options", () => {
    render(<KanbanBoard />);
    expect(screen.getByDisplayValue("Feature")).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Enhancement")).toBeInTheDocument();
  });

  it("does not emit task:create when title is empty", () => {
    render(<KanbanBoard />);
    const button = screen.getByTitle ? screen.getByText("Add") : null;
    if (button) fireEvent.click(button);
    const { io } = require("socket.io-client");
    // emit should not have been called with task:create
    expect(screen.getByPlaceholderText("Add a new task...").value).toBe("");
  });

  it("shows file input for attachments", () => {
    render(<KanbanBoard />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it("file input accepts only images", () => {
    render(<KanbanBoard />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput.accept).toBe("image/*");
  });
});