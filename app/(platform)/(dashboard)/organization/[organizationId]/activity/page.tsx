import { Separator } from "@/components/ui/separator";
import { Info } from "../_components/info";
import { ActivityList } from "./_components/activity-list";
import { Suspense } from "react";

const ActivityPage = () => {
  return (
    <div className="w-full mb-20 p-4">
      <Info />
      {/* Full-width separator */}
      <Separator className="my-4 w-screen dark:bg-muted" />
      <Suspense fallback={<ActivityList.Skeleton />}>
        <ActivityList />
      </Suspense>
    </div>
  );
};
export default ActivityPage;
