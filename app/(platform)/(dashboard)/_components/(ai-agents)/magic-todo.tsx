import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Save,
  X,
  CheckSquare,
  WandSparkles,
  MessageSquare,
  Edit,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectKey, setSelectKey] = useState(0); // Force re-render of select components
  const [activeTab, setActiveTab] = useState<string>("input");

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
        setActiveTab("edit");
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

  // Reset state when component opens
  useEffect(() => {
    if (open) {
      // Reset selections and force refresh when component opens
      setSelectedBoard("");
      setSelectedList("");
      setSelectKey((prev) => prev + 1); // Force select components to re-render
      fetchBoards();

      // Reset to input tab if there's no content yet
      if (!editableContent.title) {
        setActiveTab("input");
      }
    }
  }, [open, editableContent.title]);

  async function fetchBoards() {
    try {
      setIsLoaded(false);
      const response = await fetch("/api/get-boards", {
        // Add cache: no-store to prevent caching
        cache: "no-store",
        headers: {
          pragma: "no-cache",
          "cache-control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch boards: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched boards data:", data);
      setBoards(data);
      setIsLoaded(true);
    } catch (error) {
      console.error("Error fetching boards:", error);
      toast.error("Failed to load boards");
      setIsLoaded(true);
    }
  }

  // Set default selections after boards are loaded
  useEffect(() => {
    if (boards.length > 0 && isLoaded) {
      // Always set a new default when boards load or change
      const defaultBoard = boards[0];
      if (defaultBoard) {
        console.log(
          "Setting default board:",
          defaultBoard.id,
          defaultBoard.title
        );
        setSelectedBoard(defaultBoard.id);

        if (defaultBoard.lists && defaultBoard.lists.length > 0) {
          const defaultList = defaultBoard.lists[0];
          console.log(
            "Setting default list:",
            defaultList.id,
            defaultList.title
          );
          setSelectedList(defaultList.id);
        } else {
          setSelectedList("");
        }

        // Force select components to re-render with new values
        setSelectKey((prev) => prev + 1);
      }
    }
  }, [boards, isLoaded]);

  // Update lists when selected board changes
  useEffect(() => {
    if (selectedBoard && boards.length > 0) {
      const currentBoard = boards.find((b) => b.id === selectedBoard);
      if (currentBoard && currentBoard.lists && currentBoard.lists.length > 0) {
        const firstList = currentBoard.lists[0];
        console.log(
          "Updating list selection for board change:",
          currentBoard.title,
          "->",
          firstList.title
        );
        setSelectedList(firstList.id);
      } else {
        console.log(
          "No lists found for selected board, clearing list selection"
        );
        setSelectedList("");
      }
    }
  }, [selectedBoard, boards]);

  const { execute: executeCreateCard } = useAction(createCard, {
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" created!`);
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

  // Handler for board selection
  const handleBoardChange = (value: string) => {
    console.log("Board selection changed to:", value);
    setSelectedBoard(value);

    // Reset list selection when board changes
    setSelectedList("");

    // Find the new board's first list
    const newBoard = boards.find((b) => b.id === value);
    if (newBoard && newBoard.lists && newBoard.lists.length > 0) {
      setSelectedList(newBoard.lists[0].id);
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[9999] w-full max-w-[450px]",
        open ? "block" : "hidden"
      )}
    >
      <div className="flex flex-col rounded-lg bg-card border border-border shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-border">
          <h3 className="text-base font-medium flex items-center gap-1.5">
            <WandSparkles className="h-4 w-4 text-primary" />
            Magic Todo
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-0.5 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full rounded-none">
            <TabsTrigger value="input" className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>Input</span>
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              disabled={!editableContent.title}
              className="flex items-center gap-1.5"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="p-3 m-0">
            <div className="flex flex-col gap-3">
              <Textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setInput(e.target.value);
                }}
                placeholder="Enter your tasks and ideas, I'll organize them..."
                className="resize-none h-32 bg-background border-border focus-visible:ring-1 focus-visible:ring-primary text-sm"
                autoFocus
                disabled={isLoading}
              />

              <Button
                onClick={handleSubmit}
                disabled={!inputText || isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-sm"
                aria-label="Create Magic Todo"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
                )}
                Create Magic Todo
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="p-3 space-y-3 m-0">
            <div className="space-y-1">
              <label htmlFor="title" className="text-xs font-medium">
                Title
              </label>
              <Input
                id="title"
                value={editableContent.title}
                onChange={(e) =>
                  setEditableContent((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="font-medium text-base bg-background border-border"
                placeholder="Title"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="space-y-1">
                <label htmlFor="board" className="text-xs font-medium">
                  Board
                </label>
                <Select
                  key={`board-select-${selectKey}`}
                  value={selectedBoard}
                  onValueChange={handleBoardChange}
                >
                  <SelectTrigger
                    id="board"
                    className="border-border bg-background h-9 text-sm"
                  >
                    <SelectValue placeholder="Select a Board" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {boards.map((board) => (
                      <SelectItem
                        key={board.id}
                        value={board.id}
                        className="text-sm"
                      >
                        {board.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label htmlFor="list" className="text-xs font-medium">
                  List
                </label>
                <Select
                  key={`list-select-${selectKey}`}
                  value={selectedList}
                  onValueChange={(value) => {
                    console.log("List selection changed to:", value);
                    setSelectedList(value);
                  }}
                  disabled={
                    !selectedBoard ||
                    !(
                      boards.find((b) => b.id === selectedBoard)?.lists
                        ?.length ?? 0 > 0
                    )
                  }
                >
                  <SelectTrigger
                    id="list"
                    className="border-border bg-background h-9 text-sm"
                  >
                    <SelectValue placeholder="Select a List" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    {selectedBoard &&
                      boards
                        .find((b) => b.id === selectedBoard)
                        ?.lists?.map((list) => (
                          <SelectItem
                            key={list.id}
                            value={list.id}
                            className="text-sm"
                          >
                            {list.title}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="category" className="text-xs font-medium">
                Category
              </label>
              <Input
                id="category"
                value={editableContent.category}
                onChange={(e) =>
                  setEditableContent((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="italic bg-background border-border text-sm"
                placeholder="Category"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="summary" className="text-xs font-medium">
                Summary
              </label>
              <Textarea
                id="summary"
                value={editableContent.summary}
                onChange={(e) =>
                  setEditableContent((prev) => ({
                    ...prev,
                    summary: e.target.value,
                  }))
                }
                className="resize-none min-h-[80px] bg-background border-border focus-visible:ring-1 focus-visible:ring-primary text-sm"
                placeholder="Summary"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="todoList" className="text-xs font-medium">
                Todo List (comma separated)
              </label>
              <Textarea
                id="todoList"
                value={editableContent.todoList}
                onChange={(e) =>
                  setEditableContent((prev) => ({
                    ...prev,
                    todoList: e.target.value,
                  }))
                }
                placeholder="Enter tasks separated by commas"
                className="resize-none min-h-[80px] bg-background border-border focus-visible:ring-1 focus-visible:ring-primary text-sm"
              />
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-primary hover:bg-primary/90 text-sm mt-2"
              aria-label="Save to Board"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save to Board
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MagicTodo;
