"use client";

import { Board } from "@prisma/client";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CoverImageProps {
  board: Board;
}

export const CoverImage = ({ board }: CoverImageProps) => {
  return (
    <div className="relative w-full h-[185px] overflow-hidden">
      <>
        {board.color && (
          <div
            className={cn(
              "absolute inset-0",
              "bg-gradient-to-br from-[#2A3950] to-[#E6E6E6]"
            )}
          />
        )}
        {board.imageId && (
          <Image
            src={board?.imageFullUrl || "/Designer.png"}
            alt={board.title}
            fill
            className="object-cover opacity-75"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
      </>
    </div>
  );
};
