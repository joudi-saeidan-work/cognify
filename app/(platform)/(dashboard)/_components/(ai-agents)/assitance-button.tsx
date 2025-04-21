"use client";

import { useState, useEffect } from "react";
import { Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AI_TOOLS } from "./ai-tools-config";
import { cn } from "@/lib/utils";

const AssistanceButton = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [open, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Handle dropdown item click
  const handleToolClick = (toolId: string) => {
    if (activeTool === toolId && open) {
      // If clicking the same tool that's already open, close it
      setIsOpen(false);
      setActiveTool(null);
    } else {
      // Otherwise, open the clicked tool
      setIsOpen(true);
      setActiveTool(toolId);
    }
    setMenuOpen(false);
  };

  // Handle main button click when there's an active tool
  const handleMainButtonClick = () => {
    if (activeTool && open) {
      // If there's an active tool, close it first before opening menu
      setIsOpen(false);
      setActiveTool(null);
      // Small delay before opening menu to avoid UI flicker
      setTimeout(() => setMenuOpen(true), 100);
    } else {
      // Normal behavior - toggle dropdown menu
      setMenuOpen(!menuOpen);
    }
  };

  return (
    <>
      {/* Floating button in bottom-right corner */}
      <div
        className="fixed bottom-6 right-6 z-[9998]"
        aria-label="Assistance Button"
      >
        <DropdownMenu
          open={menuOpen}
          onOpenChange={(isOpen) => {
            // Only allow the dropdown menu state to be controlled by our handlers
            if (!isOpen) setMenuOpen(false);
          }}
          aria-label="Assistance Dropdown Menu"
        >
          <DropdownMenuTrigger asChild>
            <motion.button
              onClick={handleMainButtonClick}
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full shadow-md hover:shadow-lg transition-all",
                activeTool
                  ? "bg-primary/90 text-primary-foreground"
                  : "bg-primary text-primary-foreground"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Assistance Button"
            >
              <Bot className="h-5 w-5" aria-label="Assistance Icon" />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            className="mb-2"
            aria-label="Assistance Dropdown Menu Content"
          >
            <p className="px-4 py-2 text-sm font-medium">AI Assistance</p>
            {AI_TOOLS.map((tool) => (
              <DropdownMenuItem
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={cn(
                  "flex items-center gap-2",
                  activeTool === tool.id && "bg-muted"
                )}
                aria-label={`Assistance Tool: ${tool.description}`}
              >
                <tool.icon
                  size={16}
                  aria-label={`Assistance Tool Icon: ${tool.description}`}
                />
                {tool.description}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Render the active tool */}
      <AnimatePresence>
        {AI_TOOLS.map(
          (tool) =>
            activeTool === tool.id && (
              <tool.component
                key={tool.id}
                open={open}
                onClose={() => {
                  setIsOpen(false);
                  setActiveTool(null);
                }}
                config={tool}
                aria-label={`Assistance Tool: ${tool.description}`}
              />
            )
        )}
      </AnimatePresence>
    </>
  );
};

export default AssistanceButton;
