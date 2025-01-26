import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Check, ChevronDown, Highlighter } from "lucide-react";
import { EditorBubbleItem, useEditor } from "novel";

export interface BubbleColorMenuItem {
  name: string;
  color: string;
  colorTailwind?: string;
}

const HIGHLIGHT_COLORS: BubbleColorMenuItem[] = [
  {
    name: "Default",
    color: "var(--novel-highlight-default)",
    colorTailwind: "bg-white",
  },
  {
    name: "Purple",
    color: "var(--novel-highlight-purple)",
    colorTailwind: " bg-purple-200",
  },
  {
    name: "Red",
    color: "var(--novel-highlight-red)",
    colorTailwind: "bg-red-200",
  },
  {
    name: "Yellow",
    color: "var(--novel-highlight-yellow)",
    colorTailwind: "bg-yellow-200",
  },
  {
    name: "Blue",
    color: "var(--novel-highlight-blue)",
    colorTailwind: "bg-blue-200",
  },
  {
    name: "Green",
    color: "var(--novel-highlight-green)",
    colorTailwind: "bg-green-200",
  },
  {
    name: "Orange",
    color: "var(--novel-highlight-orange)",
    colorTailwind: "bg-orange-200",
  },
  {
    name: "Pink",
    color: "var(--novel-highlight-pink)",
    colorTailwind: "bg-pink-200",
  },
  {
    name: "Gray",
    color: "var(--novel-highlight-gray)",
    colorTailwind: "bg-gray-200",
  },
];

interface ColorSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
import { cx } from "class-variance-authority";

export const HighlightSelector = ({
  open,
  onOpenChange,
}: ColorSelectorProps) => {
  const { editor } = useEditor();

  if (!editor) return null;

  const activeHighlightItem = HIGHLIGHT_COLORS.find(({ color }) =>
    editor.isActive("highlight", { color })
  );

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm" className="gap-2 rounded-none" variant="ghost">
          <span
            className={cx(
              "rounded-sm px-1",
              activeHighlightItem?.colorTailwind || "bg-transparent"
            )}
          >
            <Highlighter className="size-4" />
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        sideOffset={5}
        className="my-1 flex max-h-80 w-48 flex-col overflow-hidden overflow-y-auto rounded border p-1 shadow-xl"
        align="start"
      >
        <div>
          <div className="my-1 px-2 text-sm font-semibold text-muted-foreground">
            Background
          </div>
          {HIGHLIGHT_COLORS.map(({ name, color, colorTailwind }) => (
            <EditorBubbleItem
              key={name}
              onSelect={() => {
                if (name === "Default") {
                  editor.commands.unsetHighlight(); // Remove highlight
                } else {
                  editor.chain().focus().setHighlight({ color }).run(); // Apply the selected color
                }
                onOpenChange(false);
              }}
              className="flex cursor-pointer items-center justify-between px-2 py-1 text-sm hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cx(
                    "rounded-sm border px-2 py-px font-medium",
                    colorTailwind || "bg-transparent"
                  )}
                >
                  A
                </div>
                <span>{name}</span>
                {activeHighlightItem?.name === name && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            </EditorBubbleItem>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
