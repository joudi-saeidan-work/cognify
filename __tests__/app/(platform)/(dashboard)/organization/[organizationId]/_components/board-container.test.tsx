/**
 * @jest-environment node
 */

import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BoardContainer } from "../../../../../../../app/(platform)/(dashboard)/organization/[organizationId]/_components/board-container";
import { redirect } from "next/navigation";

// Mock redirect
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// Mock auth
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

// Mock db
jest.mock("@/lib/db", () => ({
  db: {
    board: {
      findMany: jest.fn(),
    },
  },
}));

// Mock the BoardList component
jest.mock(
  "../../../../../../../app/(platform)/(dashboard)/organization/[organizationId]/_components/board-list",
  () => {
    const mockBoardList = ({ boards }: { boards: any[] }) => {
      return { __mockedBoardList: true, boards };
    };

    // For server component testing, ensure default export
    mockBoardList.displayName = "BoardList";
    return mockBoardList;
  }
);

describe("BoardContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to select-org when no orgId is provided", async () => {
    // Mock auth to return no orgId
    require("@clerk/nextjs/server").auth.mockResolvedValue({
      orgId: null,
    });

    await BoardContainer();

    // Expect redirect to be called with the correct path
    expect(redirect).toHaveBeenCalledWith("/select-org");
  });

  it("fetches boards for the organization", async () => {
    // Mock auth to return an orgId
    require("@clerk/nextjs/server").auth.mockResolvedValue({
      orgId: "org_123",
    });

    // Mock database response
    const mockBoards = [
      { id: "board1", title: "Board 1", createdAt: new Date() },
      { id: "board2", title: "Board 2", createdAt: new Date() },
    ];

    require("@/lib/db").db.board.findMany.mockResolvedValue(mockBoards);

    const result = await BoardContainer();

    // Check db query was called with correct parameters
    expect(require("@/lib/db").db.board.findMany).toHaveBeenCalledWith({
      where: { orgId: "org_123" },
      orderBy: { createdAt: "desc" },
    });

    // Testing React Server Components is tricky
    // For now, just verify boards were passed
    expect(result.props.boards).toEqual(mockBoards);
  });

  it("handles database errors gracefully", async () => {
    // Mock auth to return an orgId
    require("@clerk/nextjs/server").auth.mockResolvedValue({
      orgId: "org_123",
    });

    // Mock database error
    require("@/lib/db").db.board.findMany.mockRejectedValue(
      new Error("Database error")
    );

    // We need to catch the error to prevent test failure
    let error;
    try {
      await BoardContainer();
    } catch (err) {
      error = err;
    }

    // Expect the error to be propagated
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Database error");
  });
});
