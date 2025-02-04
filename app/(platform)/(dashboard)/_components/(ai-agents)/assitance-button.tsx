import { useEffect, useState } from "react";
import { ChevronDown, Bot, Lightbulb, Edit3, SpellCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AI_TOOLS } from "./ai-tools-config";

const AssistanceButton = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null); // Track which tool is active

  const [open, setIsOpen] = useState(false);

  return (
    <>
      {/* Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="font-semibold">
            <Bot className="h-5 w-5" /> Get Assistance
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start">
          <p className="px-4 py-2 text-sm font-semibold text-primary">
            AI Help
          </p>
          {AI_TOOLS.map((tool) => (
            <DropdownMenuItem
              key={tool.id}
              onClick={() => {
                setIsOpen(true);
                setActiveTool(tool.id);
              }}
            >
              <tool.icon size={20} className="mr-2" />
              {tool.description}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
            />
          )
      )}
    </>
  );
};

export default AssistanceButton;
