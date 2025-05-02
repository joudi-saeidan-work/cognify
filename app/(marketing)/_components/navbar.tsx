"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ThemeModeToggle";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detect scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "h-16 bg-background/80 backdrop-blur-md border-b"
          : "h-20 bg-transparent"
      }`}
    >
      <div className="w-full px-4 md:px-8 lg:px-12 h-full flex items-center justify-between">
        <Logo />

        {/* Desktop Navigation - completely hidden on mobile */}
        <div className="hidden md:flex items-center space-x-1">
          <Separator orientation="vertical" className="h-6 mx-2" />
          <ThemeToggle colorBlindMode={false} setColorBlindMode={() => {}} />
          <div className="flex items-center space-x-2 ml-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button size="sm" className="font-medium" asChild>
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation - ONLY ThemeToggle and menu button */}
        <div className="flex md:hidden items-center space-x-2">
          <ThemeToggle colorBlindMode={false} setColorBlindMode={() => {}} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[100%] left-0 right-0 bg-background border-b shadow-lg">
          <div className="w-full px-4 py-4 flex flex-col space-y-4">
            <Separator className="my-2" />
            <div className="flex flex-col space-y-2">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link
                  href="/sign-in"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              </Button>
              <Button size="sm" className="w-full" asChild>
                <Link
                  href="/sign-up"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;

// export default is only used in layouts and in pages not in reusable components
