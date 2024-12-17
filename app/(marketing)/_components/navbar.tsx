import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export const NavBar = () => {
  return (
    <div className="fixed top-0 w-full h-14 px-4 border-b shadow-sm bg-gray-50 flex items-center">
      <div className="md:max-w-screen-2xl mx-auto flex items-center w-full justify-between">
        <Logo />
        <div className="space-x-4 md:block md:w-auto flex items-center justify-between w-full">
          <Button size="sm" variant="outline" asChild>
            <Link href="/sign-in">Login</Link>
          </Button>
          <Button
            size="sm"
            className="font-semibold bg-teal-600 hover:bg-teal-500"
            asChild
          >
            <Link href="/sign-up">Try Cognify</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NavBar;

// export default is only used in layouts and in pages not in reusable components
