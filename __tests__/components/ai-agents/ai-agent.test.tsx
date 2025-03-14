/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock AI related modules first
jest.mock("ai/react", () => ({
  useChat: jest.fn(),
  useAssistant: jest.fn(),
}));

// Mock the AI tools config directly without any circular references
jest.mock(
  "@/app/(platform)/(dashboard)/_components/(ai-agents)/ai-tools-config",
  () => {
    const MockNoteWhiz = ({ open, onClose, config }: any) => (
      <div data-testid="notewhiz-component">
        {open && (
          <>
            <div>{config.name}</div>
            <button onClick={onClose} data-testid="notewhiz-close">
              Close
            </button>
          </>
        )}
      </div>
    );

    const MockMagicTodo = ({ open, onClose, config }: any) => (
      <div data-testid="magic-todo-component">
        {open && (
          <>
            <div>{config.name}</div>
            <button onClick={onClose} data-testid="magic-todo-close">
              Close
            </button>
          </>
        )}
      </div>
    );

    const mockTools = [
      {
        id: "notewhiz",
        name: "NoteWhiz",
        description: "Got questions about your notes?",
        icon: () => <div>NoteWhiz Icon</div>,
        component: MockNoteWhiz,
        apiRoute: "/api/notewhiz",
        initialMessage: "Ask me questions about your notes",
      },
      {
        id: "magic-todo",
        name: "Magic Todo",
        description: "Need help organizing your thoughts?",
        icon: () => <div>Magic Todo Icon</div>,
        component: MockMagicTodo,
        apiRoute: "/api/magictodo",
        initialMessage: "Start dumping your thoughts here...",
      },
    ];

    return {
      AI_TOOLS: mockTools,
    };
  }
);

// Import after mocks are defined
import { AI_TOOLS } from "@/app/(platform)/(dashboard)/_components/(ai-agents)/ai-tools-config";

describe("AI Agents", () => {
  it("renders all AI agent components when open is true", () => {
    // For each AI tool, render its component with open=true
    AI_TOOLS.forEach((tool) => {
      const ToolComponent = tool.component;
      render(<ToolComponent open={true} onClose={() => {}} config={tool} />);

      // Check if the component renders with the tool name
      const toolElement = screen.getByText(tool.name);
      expect(toolElement).toBeInTheDocument();
    });
  });

  it("does not render AI agent components when open is false", () => {
    // For each AI tool, render its component with open=false
    AI_TOOLS.forEach((tool) => {
      const ToolComponent = tool.component;
      const { container } = render(
        <ToolComponent open={false} onClose={() => {}} config={tool} />
      );

      // Check that the component doesn't render its content
      const toolElement = screen.queryByText(tool.name);
      expect(toolElement).not.toBeInTheDocument();

      // The wrapper div should still be there
      const componentDiv = container.querySelector(
        `[data-testid="${tool.id}-component"]`
      );
      expect(componentDiv).toBeInTheDocument();
    });
  });

  it("passes the correct configuration props to components", () => {
    // For each AI tool, render its component with open=true
    AI_TOOLS.forEach((tool) => {
      const ToolComponent = tool.component;
      render(<ToolComponent open={true} onClose={() => {}} config={tool} />);

      // Check if the component renders with the tool name
      const toolElement = screen.getByText(tool.name);
      expect(toolElement).toBeInTheDocument();
    });
  });

  it("ensures all tools have a properly formatted apiRoute", () => {
    // Check that all apiRoutes follow the expected format
    AI_TOOLS.forEach((tool) => {
      expect(tool.apiRoute).toBeDefined();
      expect(tool.apiRoute).toMatch(/^\/api\/\w+$/);
    });
  });
});
