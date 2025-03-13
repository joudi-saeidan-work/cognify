import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button Component", () => {
  it("renders correctly", () => {
    render(<Button>Test Button</Button>);
    const buttonElement = screen.getByText("Test Button");
    expect(buttonElement).toBeInTheDocument();
  });
});
