// This is done to because we want to manange the test of the mobile side bar

import { create } from "zustand";

type MobileSideBarStore = {
  isOpen: boolean; // Determines if the sidebar is open
  onOpen: () => void; // Function to open the sidebar
  onClose: () => void; // Function to close the sidebar
};

export const userMobileSideBar = create<MobileSideBarStore>((set) => ({
  isOpen: false, // Initial state is closed
  onOpen: () => set({ isOpen: true }), // Sets isOpen to true to open
  onClose: () => set({ isOpen: false }), // Sets isOpen to false to close
}));

// Desktop Sidebar: Simple, section-specific state with onClick, no useEffect or global state.
// Mobile Sidebar: Uses Zustand to manage the global isOpen state, with useEffect to handle auto-close on navigation.
// Zustand: A lightweight, fast, and simple state management library that offers global state without the complexity of Redux, making it ideal for managing the open/close state of the mobile sidebar.
