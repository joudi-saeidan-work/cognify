import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Save,
  X,
  CheckSquare,
  ListTodo,
  WandSparkles,
} from "lucide-react";
import { useChat } from "ai/react";
import { Input } from "@/components/ui/input";
import { AIToolConfig } from "./ai-tools-config";
import { createCard } from "@/actions/create-card";
import { useAction } from "@/hooks/use-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Board, List } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

// validate response schema
const OrganizedThoughtsSchema = z.object({
  title: z.string().min(1).default("Untitled"),
  category: z
    .enum(["Note", "Task", "Journal Entry", "Meeting Note", "Other"])
    .default("Other"),
  summary: z.string().default(""),
  todoList: z.array(z.string()).default([]),
});

interface MagicTodoProps {
  onClose: () => void;
  open: boolean;
  config: AIToolConfig;
}

const MagicTodo = ({ onClose, open, config }: MagicTodoProps) => {
  const [inputText, setInputText] = useState("");
  const [editableContent, setEditableContent] = useState({
    title: "",
    category: "",
    summary: "",
    todoList: "",
  });

  const [boards, setBoards] = useState<(Board & { lists: List[] })[]>([]);

  const [selectedBoard, setSelectedBoard] = useState<string>("");
  const [selectedList, setSelectedList] = useState<string>("");

  const parseAIResponse = (content: string) => {
    try {
      const raw = JSON.parse(content);
      const parsed = OrganizedThoughtsSchema.parse(raw);
      return {
        title: parsed.title,
        category: parsed.category,
        summary: parsed.summary,
        todoList: parsed.todoList.join(", "),
      };
    } catch (error) {
      console.error("Parsing failed:", error);
      toast.error("Failed to processs AI response");
    }
    return {
      title: "Invalid Response",
      category: "Other",
      summary: "Could not parse AI output",
      todoList: "",
    };
  };

  const { handleSubmit, isLoading, setInput, reload } = useChat({
    api: config.apiRoute,
    onFinish: (response) => {
      try {
        const parsed = parseAIResponse(response.content);
        setEditableContent(parsed);
      } catch (error) {
        toast.error("Failed to process organization results");
      }
    },
    onError: (error) => {
      toast.error(`AI processing failed: ${error.message}`);
    },
  });

  const descriptionJSON = JSON.stringify({
    type: "doc",
    content: [
      ...(editableContent.summary
        ? [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Summary" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: editableContent.summary }],
            },
          ]
        : []),
      ...(editableContent.todoList
        ? [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "To-Do List" }],
            },
            {
              type: "bulletList",
              content: editableContent.todoList
                .split(/,\s*(?=[^\]]*(?:\[|$))/)
                .filter((task) => task.trim())
                .map((task) => ({
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: task.trim() }],
                    },
                  ],
                })),
            },
          ]
        : []),
    ],
  });

  useEffect(() => {
    async function fetchBoards() {
      try {
        const response = await fetch("/api/get-boards");
        const data = await response.json();
        setBoards(data);
      } catch (error) {
        console.error("Error fetching boards:", error);
      }
    }
    fetchBoards();
  }, []);

  const defaultBoard = boards[0] ?? null;
  const defaultList = defaultBoard?.lists?.[0] ?? null;

  useEffect(() => {
    if (boards.length > 0 && !selectedBoard) {
      setSelectedBoard(defaultBoard?.id || boards[0].id);
    }
    if (defaultBoard?.lists?.length && !selectedList) {
      setSelectedList(defaultList?.id || defaultBoard.lists[0].id);
    }
  }, [boards]);

  const { execute: executeCreateCard } = useAction(createCard, {
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" created `);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleSave = () => {
    if (!selectedBoard || !selectedList) {
      toast.error("Please select both a board and list");
      return;
    }
    const targetBoard = boards.find((b) => b.id === selectedBoard);
    const targetList = targetBoard?.lists?.find((l) => l.id === selectedList);

    if (!targetBoard || !targetList) {
      toast.error("Invalid board/list selection");
      return;
    }
    executeCreateCard({
      title: editableContent.title,
      boardId: targetBoard.id,
      listId: targetList.id,
      description: descriptionJSON,
    });
    onClose();
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[9999] w-full max-w-[500px]",
        open ? "block" : "hidden"
      )}
    >
      <div className="flex flex-col rounded-lg bg-card border border-border shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <WandSparkles className="h-5 w-5 text-primary" />
            Magic Todo
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <Textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setInput(e.target.value);
            }}
            placeholder="Enter your tasks and ideas, I'll organize them..."
            className="resize-none h-32 bg-background border-border focus-visible:ring-1 focus-visible:ring-primary"
            autoFocus
            disabled={isLoading}
          />

          <Button
            onClick={handleSubmit}
            disabled={!inputText || isLoading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <CheckSquare className="mr-2 h-4 w-4" />
            )}
            Create Magic Todo
          </Button>
        </div>

        {editableContent.title && (
          <div className="border-t border-border p-4 space-y-4">
            <Input
              value={editableContent.title}
              onChange={(e) =>
                setEditableContent((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="font-medium text-lg bg-background border-border"
              placeholder="Title"
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                value={selectedBoard}
                onValueChange={(value) => setSelectedBoard(value)}
              >
                <SelectTrigger className="border-border bg-background">
                  <SelectValue placeholder="Select a Board" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedList}
                onValueChange={(value) => setSelectedList(value)}
                disabled={!selectedBoard}
              >
                <SelectTrigger className="border-border bg-background">
                  <SelectValue placeholder="Select a List" />
                </SelectTrigger>
                <SelectContent>
                  {boards
                    .find((b) => b.id === selectedBoard)
                    ?.lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              value={editableContent.category}
              onChange={(e) =>
                setEditableContent((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              className="italic bg-background border-border"
              placeholder="Category"
            />

            <Textarea
              value={editableContent.summary}
              onChange={(e) =>
                setEditableContent((prev) => ({
                  ...prev,
                  summary: e.target.value,
                }))
              }
              className="resize-none min-h-[100px] bg-background border-border focus-visible:ring-1 focus-visible:ring-primary"
              placeholder="Summary"
            />

            <Textarea
              value={editableContent.todoList}
              onChange={(e) =>
                setEditableContent((prev) => ({
                  ...prev,
                  todoList: e.target.value,
                }))
              }
              placeholder="Enter tasks separated by commas"
              className="resize-none min-h-[80px] bg-background border-border focus-visible:ring-1 focus-visible:ring-primary"
            />

            <Button
              onClick={handleSave}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              Save to Board
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MagicTodo;
