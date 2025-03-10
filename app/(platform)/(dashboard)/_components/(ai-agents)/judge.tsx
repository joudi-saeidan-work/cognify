import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy,
  Loader2,
  ExternalLink,
  Scale,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { AIToolConfig } from "./ai-tools-config";
import { useChat } from "ai/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JudgeProps {
  onClose: () => void;
  open: boolean;
  config: AIToolConfig;
}

interface ToneAnalysis {
  analysis: {
    tone: string;
    triggers: string[];
    forecast: string;
    intensity: number;
  };
  response: {
    adhd_friendly: string;
    options: Array<{ style: string; text: string }>;
    strategies: string[];
  };
}

const ToneAnalysisSchema = z.object({
  analysis: z.object({
    tone: z.string(),
    triggers: z.array(z.string()),
    forecast: z.string(),
    intensity: z.number().min(0).max(5),
  }),
  response: z.object({
    adhd_friendly: z.string(),
    options: z.array(
      z.object({
        style: z.string(),
        text: z.string(),
      })
    ),
    strategies: z.array(z.string()),
  }),
}) satisfies z.ZodType<ToneAnalysis>;

// Curated resources for common strategies
const strategyResources: { [key: string]: string } = {
  "Emotion Labeling":
    "https://youtube.com/shorts/jcbskp9AqUk?si=tL4ybYljcUAyCgD-",
  "Acknowledgment of feelings": "https://www.youtube.com/watch?v=2kew2JhKq3Y",
  "Solution Bridging": "https://www.youtube.com/watch?v=OM0Xv0eVGtY&t=116s",
  "Active Listening": "https://www.youtube.com/watch?v=wpUcYZ0-8DM",
  "Tone Softening": "https://www.youtube.com/watch?v=example4",
  "Positive Reframing": "https://www.youtube.com/watch?v=nsOKrCVs6WM",
};

// Fallback to a Google search for unknown strategies
const getStrategyResource = (strategy: string) => {
  return (
    strategyResources[strategy] ||
    `https://www.google.com/search?q=${encodeURIComponent(strategy)}`
  );
};

const Judge = ({ onClose, open, config }: JudgeProps) => {
  const [inputText, setInputText] = useState("");
  const [toneAnalysis, setToneAnalysis] = useState<ToneAnalysis | null>(null);
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    issues: true,
    forecast: true,
    suggested: true,
    alternatives: false,
    tips: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const parseAIResponse = (response: string) => {
    try {
      const raw = JSON.parse(response);
      const parsed = ToneAnalysisSchema.parse(raw);
      return parsed;
    } catch (error) {
      console.error("Parsing Failed:", error);
      toast.error("Failed to process AI response");
      return null;
    }
  };

  const { handleSubmit, isLoading, setInput } = useChat({
    api: config.apiRoute,
    onFinish: (response) => {
      const parsed = parseAIResponse(response.content);
      setToneAnalysis(parsed);
    },
    onError: (error) => {
      toast.error(`AI processing failed: ${error.message}`);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!", { duration: 1500 });
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[9999] w-full max-w-[450px]",
        open ? "block" : "hidden"
      )}
    >
      <div className="flex flex-col rounded-lg bg-card border border-border shadow-lg overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h3 className="font-medium flex items-center gap-1.5 text-sm">
            <Scale className="h-4 w-4 text-primary" />
            Tone Judge
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Compact Input Section */}
        <div className="p-2.5 flex flex-col gap-2">
          <Textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setInput(e.target.value);
            }}
            placeholder="Paste your message to analyze..."
            className="resize-none h-24 text-sm bg-background border-border focus-visible:ring-1 focus-visible:ring-primary"
            autoFocus
            disabled={isLoading}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {inputText.length} chars
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!inputText || isLoading}
              className="h-8 px-3 text-xs"
              variant="default"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-3 w-3 mr-1.5" />
                  Analyzing...
                </>
              ) : (
                "Analyze Tone"
              )}
            </Button>
          </div>
        </div>

        {/* Compact Analysis Results */}
        {toneAnalysis && (
          <div className="max-h-[60vh] overflow-y-auto space-y-2 px-2.5 pb-2.5">
            {/* Tone Intensity - Always visible */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Tone Intensity</span>
                <span className="text-xs text-muted-foreground">
                  {["Calm", "Mild", "Moderate", "Strong", "Intense"][
                    toneAnalysis.analysis.intensity - 1
                  ] || "Unknown"}
                </span>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{
                    width: `${(toneAnalysis.analysis.intensity / 5) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Collapsible Sections */}
            {/* Potential Issues */}
            <div className="border-t border-border/50 pt-2">
              <button
                onClick={() => toggleSection("issues")}
                className="flex items-center justify-between w-full text-left text-xs font-medium py-1"
              >
                <span>🚩 Potential Issues</span>
                {expandedSections.issues ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {expandedSections.issues &&
                toneAnalysis.analysis.triggers.length > 0 && (
                  <ul className="mt-1 pl-4 text-xs text-muted-foreground space-y-0.5 list-disc">
                    {toneAnalysis.analysis.triggers.map((trigger, i) => (
                      <li key={i}>{trigger}</li>
                    ))}
                  </ul>
                )}
            </div>

            {/* What Might Happen */}
            <div className="border-t border-border/50 pt-2">
              <button
                onClick={() => toggleSection("forecast")}
                className="flex items-center justify-between w-full text-left text-xs font-medium py-1"
              >
                <span>🔮 What Might Happen</span>
                {expandedSections.forecast ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {expandedSections.forecast && (
                <div className="mt-1 relative group">
                  <p className="text-xs p-2 bg-background/50 rounded border border-border/50">
                    {toneAnalysis.analysis.forecast}
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(toneAnalysis.analysis.forecast)
                    }
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Copy Forecast"
                  >
                    <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* Suggested Response */}
            <div className="border-t border-border/50 pt-2">
              <button
                onClick={() => toggleSection("suggested")}
                className="flex items-center justify-between w-full text-left text-xs font-medium py-1"
              >
                <span>💡 Suggested Response</span>
                {expandedSections.suggested ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {expandedSections.suggested && (
                <div className="mt-1 relative group">
                  <p className="text-xs p-2 bg-background/50 rounded border border-border/50">
                    {toneAnalysis.response.adhd_friendly}
                  </p>
                  <button
                    onClick={() =>
                      copyToClipboard(toneAnalysis.response.adhd_friendly)
                    }
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Copy Suggested Response"
                  >
                    <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* Alternative Options */}
            <div className="border-t border-border/50 pt-2">
              <button
                onClick={() => toggleSection("alternatives")}
                className="flex items-center justify-between w-full text-left text-xs font-medium py-1"
              >
                <span>🔄 Try These Alternatives</span>
                {expandedSections.alternatives ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {expandedSections.alternatives && (
                <div className="mt-1 space-y-1.5">
                  {toneAnalysis.response.options.map((option, i) => (
                    <div
                      key={i}
                      className="relative group rounded border border-border/50 p-2 bg-background/50"
                    >
                      <div className="text-xs font-medium mb-0.5">
                        {option.style}
                      </div>
                      <p className="text-xs">{option.text}</p>
                      <button
                        onClick={() => copyToClipboard(option.text)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Copy option text"
                      >
                        <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="border-t border-border/50 pt-2">
              <button
                onClick={() => toggleSection("tips")}
                className="flex items-center justify-between w-full text-left text-xs font-medium py-1"
              >
                <span>🧠 Tips for Next Time</span>
                {expandedSections.tips ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {expandedSections.tips && (
                <ul className="mt-1 pl-4 text-xs text-muted-foreground space-y-1 list-disc">
                  {toneAnalysis.response.strategies.map((strategy, i) => (
                    <li key={i} className="pb-0.5">
                      {strategy}{" "}
                      <a
                        href={getStrategyResource(strategy)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 inline-flex items-center"
                      >
                        Learn
                        <ExternalLink className="ml-0.5 h-2.5 w-2.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Judge;
