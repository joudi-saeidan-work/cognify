/**
 * @jest-environment jsdom
 */

// Mock AI related modules first
jest.mock("ai/react", () => ({
  useChat: jest.fn(),
  useAssistant: jest.fn(),
}));

// Mock the actual AI components to avoid their initialization
jest.mock(
  "@/app/(platform)/(dashboard)/_components/(ai-agents)/note-whiz",
  () => {
    return {
      __esModule: true,
      default: () => <div>Mock NoteWhiz</div>,
    };
  }
);

jest.mock(
  "@/app/(platform)/(dashboard)/_components/(ai-agents)/magic-todo",
  () => {
    return {
      __esModule: true,
      default: () => <div>Mock MagicTodo</div>,
    };
  }
);

jest.mock(
  "@/app/(platform)/(dashboard)/_components/(ai-agents)/formalizer",
  () => {
    return {
      __esModule: true,
      default: () => <div>Mock Formalizer</div>,
    };
  }
);

jest.mock(
  "@/app/(platform)/(dashboard)/_components/(ai-agents)/professor",
  () => {
    return {
      __esModule: true,
      default: () => <div>Mock Professor</div>,
    };
  }
);

jest.mock(
  "@/app/(platform)/(dashboard)/_components/(ai-agents)/consultant",
  () => {
    return {
      __esModule: true,
      default: () => <div>Mock Consultant</div>,
    };
  }
);

jest.mock(
  "@/app/(platform)/(dashboard)/_components/(ai-agents)/routine-builder",
  () => {
    return {
      __esModule: true,
      default: () => <div>Mock RoutineBuilder</div>,
    };
  }
);

// Now import and test the AI_TOOLS config
import {
  AI_TOOLS,
  AIToolConfig,
} from "@/app/(platform)/(dashboard)/_components/(ai-agents)/ai-tools-config";
import React from "react";

describe("AI Tools Configuration", () => {
  it("should export AI_TOOLS as an array", () => {
    expect(Array.isArray(AI_TOOLS)).toBe(true);
    expect(AI_TOOLS.length).toBeGreaterThan(0);
  });

  it("should have 6 AI tools defined", () => {
    expect(AI_TOOLS.length).toBe(6);
  });

  it("should have all tools with the required properties", () => {
    AI_TOOLS.forEach((tool) => {
      expect(tool).toHaveProperty("id");
      expect(tool).toHaveProperty("name");
      expect(tool).toHaveProperty("description");
      expect(tool).toHaveProperty("icon");
      expect(tool).toHaveProperty("component");
      expect(tool).toHaveProperty("apiRoute");
      expect(tool).toHaveProperty("initialMessage");
    });
  });

  it("should have unique IDs for all tools", () => {
    const ids = AI_TOOLS.map((tool) => tool.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(AI_TOOLS.length);
  });

  it("should include specific expected tools", () => {
    const toolIds = AI_TOOLS.map((tool) => tool.id);
    expect(toolIds).toContain("notewhiz");
    expect(toolIds).toContain("magic-todo");
    expect(toolIds).toContain("formalizer");
    expect(toolIds).toContain("professor");
    expect(toolIds).toContain("consultant");
    expect(toolIds).toContain("routinebuilder");
  });

  it("should have valid API routes", () => {
    AI_TOOLS.forEach((tool) => {
      expect(tool.apiRoute).toMatch(/^\/api\/[a-zA-Z0-9-]+$/);
    });
  });
});
