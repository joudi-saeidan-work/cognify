import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <div className="w-full p-4 border-t bg-background dark:bg-black dark:border-gray-800">
      <div className="w-full px-4 md:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo />
        <div className="space-x-2 sm:space-x-4 flex flex-wrap items-center justify-center sm:justify-between w-full sm:w-auto">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
            aria-label="Privacy Policy"
          >
            Privacy Policy
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
            aria-label="Terms of Service"
          >
            Terms of Service
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Footer;

// export default is only used in layouts and in pages not in reusable components
