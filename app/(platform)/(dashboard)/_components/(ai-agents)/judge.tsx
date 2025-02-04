import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Loader2, ExternalLink } from "lucide-react";
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
    toast.success("Copied to clipboard!");
  };

  return (
    <div
      className={cn(
        " fixed bottom-0 right-0 w-full max-w-[500px] p-6 bg-white border border-gray-100 shadow-sm rounded-lg",
        open ? "block" : "hidden"
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">⚖️ Tone Judge</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
          aria-label="Close"
        >
          ✖
        </button>
      </div>

      {/* Input Section */}

      <div className="flex flex-col gap-4">
        <Textarea
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setInput(e.target.value);
          }}
          placeholder="Paste your message here... ✍️"
          className="resize-none h-32 p-3 focus:ring-2 focus:ring-blue-400 rounded-lg border-gray-200"
          autoFocus
          disabled={isLoading}
        />
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {inputText.length} characters
          </span>
          <Button
            onClick={handleSubmit}
            disabled={inputText.length < 10 || isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Analyze Tone"}
          </Button>
        </div>
      </div>

      {/* Analysis Results */}
      {toneAnalysis && (
        <div className="h-[600px] overflow-y-auto md:text-sm mt-6 space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
          {/* Tone Intensity */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">
              How Strong Is the Tone?
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-red-400 h-2.5 rounded-full"
                  style={{
                    width: `${(toneAnalysis.analysis.intensity / 5) * 100}%`,
                  }}
                ></div>
              </div>
              <span className="ml-4 text-gray-600">
                {["Calm", "Mild", "Moderate", "Strong", "Intense"][
                  toneAnalysis.analysis.intensity - 1
                ] || "Unknown"}
              </span>
            </div>
          </div>

          {/* Potential Issues */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">
              🚩 Potential Issues
            </h3>
            {toneAnalysis.analysis.triggers.length > 0 ? (
              <ul className="list-disc list-inside text-gray-600">
                {toneAnalysis.analysis.triggers.map((trigger, i) => (
                  <li key={i}>{trigger}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No issues identified.</p>
            )}
          </div>

          {/* What Might Happen? */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">
              🔮 What Might Happen?
            </h3>
            <div className="flex items-center space-x-2 p-4 bg-white rounded-lg border border-gray-100">
              <p className="flex-grow text-gray-700">
                {toneAnalysis.analysis.forecast}
              </p>
              <Copy
                className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => copyToClipboard(toneAnalysis.analysis.forecast)}
                aria-label="Copy Forecast"
              />
            </div>
          </div>

          {/* Suggested Response */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">
              💡 Suggested Response
            </h3>
            <div className="flex items-center space-x-2 p-4 bg-white rounded-lg border border-gray-100">
              <p className="flex-grow text-gray-700">
                {toneAnalysis.response.adhd_friendly}
              </p>
              <Copy
                className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() =>
                  copyToClipboard(toneAnalysis.response.adhd_friendly)
                }
                aria-label="Copy ADHD-friendly response"
              />
            </div>
          </div>

          {/* Alternative Options */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">
              🔄 Try These Alternatives
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toneAnalysis.response.options.map((option, i) => (
                <div
                  key={i}
                  className="p-4 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">
                      {option.style}
                    </span>
                    <Copy
                      className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => copyToClipboard(option.text)}
                      aria-label="Copy option text"
                    />
                  </div>
                  <p className="text-gray-600">{option.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips for Next Time */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">
              🧠 Tips for Next Time
            </h3>
            <ul className="list-disc list-inside text-gray-600">
              {toneAnalysis.response.strategies.map((strategy, i) => (
                <li key={i} className="mb-2">
                  {strategy}{" "}
                  <a
                    href={getStrategyResource(strategy)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 inline-flex items-center"
                  >
                    Learn More <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Judge;
