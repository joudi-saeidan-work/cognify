import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  Copy,
  Loader2,
  Wand2,
  X,
  ChevronDown,
  Feather,
} from "lucide-react";
import { useChat } from "ai/react";
import { AIToolConfig } from "./ai-tools-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormalizerProps {
  onClose: () => void;
  open: boolean;
  config: AIToolConfig;
}

const STYLE_OPTIONS = [
  "More professional",
  "Grammatically correct",
  "More polite",
  "More technical",
  "More accessible",
  "Less snarky",
  "Angrier",
  "Easier to read",
  "More formal",
  "More informal",
  "More sociable",
  "More to the point",
  "Less emotional",
  "More passionate",
  "More sarcastic",
];

const Formalizer = ({ onClose, open, config }: FormalizerProps) => {
  const [inputText, setInputText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [convertedText, setConvertedText] = useState<string | null>(null);

  const { handleSubmit, isLoading, setInput } = useChat({
    api: config.apiRoute,
    body: {
      style: selectedStyle,
    },
    onFinish: (response) => {
      setConvertedText(response.content);
    },
    onError: (error) => {
      toast.error(`Processing failed: ${error.message}`);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!", { duration: 1500 });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStyle) {
      toast.error("Please select a style option first");
      return;
    }
    setInput(inputText);
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
            <Feather className="h-4 w-4 text-primary" />
            Text Formalizer
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
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter your text here..."
            className="resize-none h-24 text-sm bg-background border-border focus-visible:ring-1 focus-visible:ring-primary"
            disabled={isLoading}
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Make my text...
            </span>
            <div className="flex-1 relative z-[10000]">
              <Select
                value={selectedStyle || ""}
                onValueChange={setSelectedStyle}
                disabled={isLoading}
              >
                <SelectTrigger className="text-xs h-8 px-3 bg-background border-border w-full">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent
                  className="max-h-[300px] overflow-y-auto z-[10001]"
                  position="popper"
                  sideOffset={4}
                >
                  {STYLE_OPTIONS.map((style) => (
                    <SelectItem
                      key={style}
                      value={style}
                      className="text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      {style}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!inputText || !selectedStyle || isLoading}
            className="h-8 text-xs"
            variant="default"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-3 w-3 mr-1.5" />
                Converting...
              </>
            ) : (
              "Convert"
            )}
          </Button>
        </form>

        {/* Converted Text Result */}
        {convertedText && (
          <div className="border-t border-border p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium">Converted Text</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => copyToClipboard(convertedText)}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </Button>
            </div>
            <div className="p-2.5 bg-background rounded-md border border-border text-sm overflow-y-auto max-h-[200px]">
              {convertedText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Formalizer;
