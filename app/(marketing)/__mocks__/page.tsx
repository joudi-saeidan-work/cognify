import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// In the mock, we replace the font imports with simple string constants
const headingFontClass = "mocked-local-font";
const textFontClass = "mocked-poppins-font";

// This is a duplicate of the real MarketingPage but with string constants instead of font imports
const MarketingPage = () => {
  return (
    <div
      className="flex items-center justify-center min-h-[80vh]"
      data-testid="outer-container"
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center space-y-6",
          headingFontClass
        )}
        data-testid="inner-container"
      >
        <h1 className="text-4xl md:text-7xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 text-transparent bg-clip-text w-fit tracking-wide">
          Say Goodbye to Chaos.
        </h1>

        <p
          className={cn(
            "text-lg md:text-2xl text-neutral-400 mt-4 max-w-xs md:max-w-xl text-center mx-auto",
            textFontClass
          )}
          data-testid="paragraph"
        >
          With Cognify, managing tasks feels effortless. Focus on what matters.
        </p>
        <Button
          className="mt-6 px-6 py-3 text-lg font-semibold bg-teal-600 hover:bg-teal-500"
          size="lg"
          asChild
          aria-label="Try Cognify"
        >
          <Link href="/sign-up">Try Cognify</Link>
        </Button>
      </div>
    </div>
  );
};

export default MarketingPage;
