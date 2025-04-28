import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase,
  Copy,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  MessageSquare,
  ScrollText,
} from "lucide-react";
import { useChat } from "ai/react";
import { AIToolConfig } from "./ai-tools-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ConsultantProps {
  onClose: () => void;
  open: boolean;
  config: AIToolConfig;
}

interface AnalysisContent {
  pros: string[];
  cons: string[];
  advice: string;
}

const Consultant = ({ onClose, open, config }: ConsultantProps) => {
  const [scenario, setScenario] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisContent | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    pros: true,
    cons: true,
    advice: true,
  });
  const [activeTab, setActiveTab] = useState<string>("input");

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
        setAnalysis(parsedContent);
        setActiveTab("results");
      } catch (e) {
        // If parsing fails, use the raw response
        toast.error("Could not parse response properly", { duration: 3000 });
        console.error("Failed to parse consultant response:", e);
      }
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!", { duration: 1500 });
  };

  const copyFullAnalysis = () => {
    if (!analysis) return;

    const fullText = `
PROS:
${analysis.pros.map((pro) => `• ${pro}`).join("\n")}

CONS:
${analysis.cons.map((con) => `• ${con}`).join("\n")}

ADVICE:
${analysis.advice}
    `.trim();

    copyToClipboard(fullText);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario.trim()) {
      toast.error("Please enter a scenario to analyze");
      return;
    }
    setInput(scenario);
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
            <Briefcase className="h-4 w-4 text-primary" />
            The Consultant
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-0.5 hover:bg-muted/80 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full rounded-none">
            <TabsTrigger value="input" className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>Situation</span>
            </TabsTrigger>
            <TabsTrigger
              value="results"
              disabled={!analysis}
              className="flex items-center gap-1.5"
            >
              <ScrollText className="h-4 w-4" />
              <span>Analysis</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="p-3 m-0">
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
              <div className="space-y-1">
                <label htmlFor="scenario" className="text-xs font-medium">
                  Describe your situation or decision
                </label>
                <Textarea
                  id="scenario"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="I'm trying to decide between..."
                  className="resize-none h-32 text-sm bg-background border-border focus-visible:ring-1 focus-visible:ring-primary"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={!scenario.trim() || isLoading}
                className="text-sm"
                variant="default"
                aria-label="Consult"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-3.5 w-3.5 mr-1.5" />
                    Analyzing...
                  </>
                ) : (
                  "Get Consultation"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="results" className="p-0 m-0">
            {analysis && (
              <div className="p-3 space-y-3 overflow-auto max-h-[500px]">
                {/* Actions Row */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={copyFullAnalysis}
                    aria-label="Copy All"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy All
                  </Button>
                </div>

                {/* Pros Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium flex items-center gap-1.5">
                      <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
                      Pros
                    </label>
                    <button
                      onClick={() => toggleSection("pros")}
                      className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                      aria-label="Toggle Pros"
                    >
                      {expandedSections.pros ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {expandedSections.pros && analysis.pros.length > 0 && (
                    <ul className="pl-5 pr-2 py-1.5 rounded border border-border/50 bg-background/50 text-sm list-disc space-y-1.5">
                      {analysis.pros.map((pro, index) => (
                        <li key={index} className="text-sm">
                          {pro}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Cons Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium flex items-center gap-1.5">
                      <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                      Cons
                    </label>
                    <button
                      onClick={() => toggleSection("cons")}
                      className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                      aria-label="Toggle Cons"
                    >
                      {expandedSections.cons ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {expandedSections.cons && analysis.cons.length > 0 && (
                    <ul className="pl-5 pr-2 py-1.5 rounded border border-border/50 bg-background/50 text-sm list-disc space-y-1.5">
                      {analysis.cons.map((con, index) => (
                        <li key={index} className="text-sm">
                          {con}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Advice Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      Advice
                    </label>
                    <button
                      onClick={() => toggleSection("advice")}
                      className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                      aria-label="Toggle Advice"
                    >
                      {expandedSections.advice ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {expandedSections.advice && (
                    <div className="relative group rounded border border-border/50 p-2.5 bg-background/50 text-sm">
                      <div className="whitespace-pre-line">
                        {analysis.advice}
                      </div>
                      <button
                        onClick={() => copyToClipboard(analysis.advice)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Copy Advice"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setActiveTab("input")}
                  variant="outline"
                  className="w-full text-sm mt-2"
                >
                  Ask Another Question
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Consultant;
