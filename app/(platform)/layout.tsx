import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

import { ModalProvider } from "@/components/providers/modal-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { EventsProvider } from "./(dashboard)/_components/(calendar)/eventsContext";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider dynamic>
      <QueryProvider>
        <Toaster richColors />
        <ModalProvider />
        <EventsProvider>{children}</EventsProvider>
      </QueryProvider>
    </ClerkProvider>
  );
}
