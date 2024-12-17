import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Board } from "@prisma/client";
import { BordTitleForm } from "./board-title-form";
import BoardOptions from "./board-options";

interface BoardNavBarProps {
  data: Board;
}

const BoardNavbar = async ({ data }: BoardNavBarProps) => {
  return (
    <div className="fixed w-full  h-11 z-[50] bg-black/20 flex items-center md:pr-14 pl-12 md:pl-0 pt-1 pb-1 gap-x-4 text-white text-lg">
      <BordTitleForm data={data} />
      <div className="ml-auto">
        <BoardOptions id={data.id} />
      </div>
    </div>
  );
};

export default BoardNavbar;
