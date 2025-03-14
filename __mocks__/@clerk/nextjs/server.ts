// Mock for Clerk auth
export const auth = jest.fn().mockResolvedValue({
  userId: "user123",
  orgId: "org123",
});
