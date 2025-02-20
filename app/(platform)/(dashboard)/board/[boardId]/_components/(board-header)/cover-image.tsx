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
      {board.color ? (
        // Render color background
        <div className={cn("absolute inset-0", board.color)} />
      ) : board.imageFullUrl ? (
        // Render image
        <Image
          src={board.imageFullUrl}
          alt={board.title}
          fill
          className="object-cover opacity-75"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
    </div>
  );
};
