import { Poppins } from "next/font/google";
import localFont from "next/font/local";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // alias imports

const headingfont = localFont({ src: "../../public/fonts/font.woff2" });

const textFont = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
const MarketingPage = () => {
  return (
    // we want to center our page every other item should be bellow it
    <div className="flex items-center justify-center min-h-[80vh]">
      {/* Main content centered on the screen */}
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center space-y-6",
          headingfont.className
        )}
      >
        <h1 className="text-4xl md:text-7xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 text-transparent bg-clip-text w-fit tracking-wide">
          Say Goodbye to Chaos.
        </h1>

        <p
          className={cn(
            "text-lg md:text-2xl text-neutral-400 mt-4 max-w-xs md:max-w-xl text-center mx-auto",
            textFont.className
          )}
        >
          With Cognify, managing tasks feels effortless. Focus on what matters.
        </p>
        <Button
          className="mt-6 px-6 py-3 text-lg font-semibold bg-teal-600 hover:bg-teal-500"
          size="lg"
          asChild
        >
          <Link href="/sign-up">Try Cognify</Link>
        </Button>
      </div>
    </div>
  );
};
export default MarketingPage;

// needs to be page.tsx in order for the routing system to work
// need to import button npx shadcn-ui@latest add button
// @ is the alias
