"use client";

import { useState } from "react";
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

  return (
    <>
      {/* Floating button in bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <motion.button
              className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bot className="h-5 w-5" />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="mb-2">
            <p className="px-4 py-2 text-sm font-medium">AI Assistance</p>
            {AI_TOOLS.map((tool) => (
              <DropdownMenuItem
                key={tool.id}
                onClick={() => {
                  setIsOpen(true);
                  setActiveTool(tool.id);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <tool.icon size={16} />
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
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <tool.component
                  open={open}
                  onClose={() => {
                    setIsOpen(false);
                    setActiveTool(null);
                  }}
                  config={tool}
                />
              </motion.div>
            )
        )}
      </AnimatePresence>
    </>
  );
};

export default AssistanceButton;
