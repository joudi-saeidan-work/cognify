"use client";

import { CardModal } from "@/components/modals/card-modals";
import { useEffect, useState } from "react";

export const ModalProvider = () => {
  // protect it from hydration errors ,, only rendered by client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return;
  }

  return <CardModal />;
};
