"use client";

import { useEffect, useState } from "react";
import { ContentForm } from "../modals/editor";

export const ModalProvider = () => {
  // protect it from hydration errors ,, only rendered by client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return;
  }

  return <ContentForm />;
};
