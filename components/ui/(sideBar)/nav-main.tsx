import React from "react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ElementType;
    isActive?: boolean;
  }[];
}) {
  const { setOpen, setOpenMobile } = useSidebar();

  const handleClick = () => {
    setOpen(false); // Collapse sidebar when an item is clicked
    setOpenMobile(false);
  };

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title} className="ml-2">
          <Link href={item.url} passHref>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              onClick={handleClick}
            >
              <div className="flex items-center gap-2">
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </div>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
