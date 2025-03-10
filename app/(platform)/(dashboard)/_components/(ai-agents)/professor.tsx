import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Copy,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Code,
} from "lucide-react";
import { useChat } from "ai/react";
import { AIToolConfig } from "./ai-tools-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfessorProps {
  onClose: () => void;
  open: boolean;
  config: AIToolConfig;
}

interface LessonContent {
  explanation: string;
  example: string;
}

const Professor = ({ onClose, open, config }: ProfessorProps) => {
  const [topic, setTopic] = useState("");
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(
    null
  );
  const [expandedSections, setExpandedSections] = useState({
    explanation: true,
    example: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const { handleSubmit, isLoading, setInput } = useChat({
    api: config.apiRoute,
    onFinish: (response) => {
      try {
        // Try to parse the response as JSON
        const parsedContent = JSON.parse(response.content);
        setLessonContent(parsedContent);
      } catch (e) {
        // If parsing fails, use the raw response as explanation
        setLessonContent({
          explanation: response.content,
          example: "Example could not be generated.",
        });
        toast.error("Could not parse response properly", { duration: 3000 });
      }
    },
    onError: (error) => {
      toast.error(`Learning failed: ${error.message}`);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!", { duration: 1500 });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Please enter a topic to learn about");
      return;
    }
    setInput(topic);
    handleSubmit(e);
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[9999] w-full max-w-[450px]",
        open ? "block" : "hidden"
      )}
    >
      <div className="flex flex-col rounded-lg bg-card border border-border shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h3 className="font-medium flex items-center gap-1.5 text-sm">
            <BookOpen className="h-4 w-4 text-primary" />
            The Professor
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleFormSubmit}
          className="p-2.5 flex flex-col gap-2.5"
        >
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What do you want to learn about?"
            className="resize-none h-20 text-sm bg-background border-border focus-visible:ring-1 focus-visible:ring-primary"
            disabled={isLoading}
          />

          <Button
            type="submit"
            disabled={!topic.trim() || isLoading}
            className="h-8 text-xs"
            variant="default"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-3 w-3 mr-1.5" />
                Creating lesson...
              </>
            ) : (
              "Teach me"
            )}
          </Button>
        </form>

        {/* Lesson Content */}
        {lessonContent && (
          <div className="border-t border-border p-2.5 space-y-2.5 overflow-auto max-h-[500px]">
            {/* Explanation Section */}
            <div className="space-y-1.5">
              <button
                onClick={() => toggleSection("explanation")}
                className="flex items-center justify-between w-full text-left text-xs font-medium"
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  Explanation
                </span>
                {expandedSections.explanation ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {expandedSections.explanation && (
                <div className="relative group rounded border border-border/50 p-2.5 bg-background/50 text-sm">
                  <div className="whitespace-pre-line">
                    {lessonContent.explanation}
                  </div>
                  <button
                    onClick={() => copyToClipboard(lessonContent.explanation)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* Example Section */}
            <div className="space-y-1.5">
              <button
                onClick={() => toggleSection("example")}
                className="flex items-center justify-between w-full text-left text-xs font-medium"
              >
                <span className="flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-primary" />
                  Example
                </span>
                {expandedSections.example ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {expandedSections.example && (
                <div className="relative group rounded border border-border/50 p-2.5 bg-background/50 text-sm">
                  <div className="whitespace-pre-line">
                    {lessonContent.example}
                  </div>
                  <button
                    onClick={() => copyToClipboard(lessonContent.example)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Professor;
