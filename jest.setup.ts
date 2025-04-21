import "@testing-library/jest-dom";
import "jest-axe/extend-expect";
// Mock the next/font modules
jest.mock("next/font/google", () => ({
  Poppins: jest.fn().mockImplementation(() => ({
    className: "mocked-poppins-font",
    style: { fontFamily: "mocked-poppins" },
  })),
}));

jest.mock("next/font/local", () =>
  jest.fn().mockImplementation(() => ({
    className: "mocked-local-font",
    style: { fontFamily: "mocked-local-font" },
  }))
);
