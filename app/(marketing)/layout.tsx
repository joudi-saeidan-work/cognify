"use client";

import Footer from "./_components/footer";
import NavBar from "./_components/navbar";
import { useTheme } from "next-themes";

const MarketingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen w-full bg-background text-foreground dark:bg-black">
      <NavBar />
      <main className="w-full">{children}</main>
      <Footer />
    </div>
  );
};

export default MarketingLayout;
