import { Separator } from "@/components/ui/separator";
import { Info } from "./_components/info";
import { Suspense } from "react";
import BoardList from "./_components/board-list";
import { BoardContainer } from "./_components/board-container";

const OrganizationIdPage = async () => {
  return (
    <div className="w-full mb-20 p-4">
      <Info />
      {/* Full-width separator */}

      <Separator className="my-4 w-screen dark:bg-muted" />
      <div className="px-2 md:px-4">
        <BoardContainer />
      </div>
    </div>
  );
};

export default OrganizationIdPage;
