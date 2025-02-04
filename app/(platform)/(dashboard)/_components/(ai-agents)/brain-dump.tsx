import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RefreshCw, Save } from "lucide-react";
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

interface BrainDumpProps {
  onClose: () => void;
  open: boolean;
  config: AIToolConfig;
}

const BrainDump = ({ onClose, open, config }: BrainDumpProps) => {
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
        "fixed bottom-0 right-0 w-full max-w-[500px] p-6 bg-white border border-gray-200 shadow-lg rounded-t-lg",
        open ? "block" : "hidden"
      )}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Quick Brain Dump
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✖
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <Textarea
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setInput(e.target.value);
          }}
          placeholder="Type or speak your thoughts here..."
          className="resize-none h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoFocus
          disabled={isLoading}
        />

        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!inputText || isLoading}
            className="bg-blue-500 hover:bg-blue-600 flex-grow text-white"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              "Organize My Thoughts"
            )}
          </Button>
        </div>

        {editableContent.title && (
          <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <Input
              value={editableContent.title}
              onChange={(e) =>
                setEditableContent((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="font-bold text-lg bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                value={selectedBoard}
                onValueChange={(value) => setSelectedBoard(value)}
              >
                <SelectTrigger className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
                <SelectTrigger className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
              className="italic bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <Textarea
              value={editableContent.summary}
              onChange={(e) =>
                setEditableContent((prev) => ({
                  ...prev,
                  summary: e.target.value,
                }))
              }
              className="resize-none bg-white min-h-[100px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="resize-none bg-white min-h-[80px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <Button
              onClick={handleSave}
              className="w-full bg-green-700 hover:bg-green-600 text-white"
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

export default BrainDump;
