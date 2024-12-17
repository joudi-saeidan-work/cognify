// SideBarContent.tsx
import { SidebarInset } from "@/components/ui/sidebar";

const SideBarContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarInset>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-screen">
        {children}
      </div>
    </SidebarInset>
  );
};

export default SideBarContent;
