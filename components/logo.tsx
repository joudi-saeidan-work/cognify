import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import localFont from "next/font/local";

const headingFont = localFont({ src: "../public/fonts/font.woff2" });

export const Logo = () => {
  return (
    <Link href="/" aria-label="Logo">
      <div className="hover:opacity-75 transition items-center gap-x-2 hidden md:flex">
        <Image
          src="/logo.svg"
          alt="Logo"
          height={30}
          width={30}
          aria-label="Logo"
        />
        <p className={cn("text-md ", headingFont.className)} aria-label="Logo">
          Cognify
        </p>
      </div>
    </Link>
  );
};
