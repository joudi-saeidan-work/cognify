"use client"; // This directive ensures the component is rendered on the client side.

import { useQuery } from "@tanstack/react-query"; // Hook for fetching and caching data.
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"; // Dialog components for displaying modals.
import { useCardModal } from "@/hooks/use-card-modal"; // Custom hook to manage the state of the card modal.
import { CardWithList } from "@/types"; // Type definition for a card with its associated list.
import { fetcher } from "@/lib/fetcher"; // Utility function for making API requests.
import { Header } from "./header"; // Header component for displaying card information.
import { Description } from "./description"; // Description component for showing card details.
import { Actions } from "./actions";
import { AuditLog } from "@prisma/client";
import { Activity } from "./activity";

/**
 * CardModal Component
 * This component displays a modal to view or edit card details.
 */
export const CardModal = () => {
  // Retrieve the card ID, modal open state, and close function from the custom hook.
  const id = useCardModal((state) => state.id);
  const isOpen = useCardModal((state) => state.isOpen);
  const onClose = useCardModal((state) => state.onClose);

  // Fetch the card data using React Query. It fetches the card based on the current ID.
  const { data: cardData } = useQuery<CardWithList>({
    queryKey: ["card", id], // Unique key for caching the card data.
    queryFn: () => fetcher(`/api/cards/${id}`), // Function to fetch the card data from the API.
  });

  const { data: auditLogsData } = useQuery<AuditLog[]>({
    queryKey: ["card-logs", id], // Unique key for caching the card data.
    queryFn: () => fetcher(`/api/cards/${id}/logs`), // Function to fetch the card data from the API.
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {/* Hidden title for accessibility */}
        <DialogTitle hidden>Edit Card</DialogTitle>

        {/* Display the header skeleton if data is loading, otherwise show the header with data */}
        {!cardData ? <Header.Skeleton /> : <Header data={cardData} />}

        {/* Grid layout for displaying the description */}
        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-4">
          {/* Span 3 columns on medium and larger screens */}
          <div className="col-span-3">
            <div className="w-full space-y-6">
              {/* Display the description skeleton if data is loading, otherwise show the description with data */}
              {!cardData ? (
                <Description.Skeleton />
              ) : (
                <Description data={cardData} />
              )}
              {!auditLogsData ? (
                <Activity.Skeleton />
              ) : (
                <Activity items={auditLogsData} />
              )}
            </div>
          </div>
          {!cardData ? <Actions.Skeleton /> : <Actions data={cardData} />}
        </div>
      </DialogContent>
    </Dialog>
  );
};
