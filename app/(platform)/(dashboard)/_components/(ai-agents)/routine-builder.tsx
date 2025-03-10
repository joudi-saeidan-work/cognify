import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarPlus,
  Medal,
  Loader2,
  X,
  Calendar,
  Clock,
  LightbulbIcon,
  CheckCircle2,
} from "lucide-react";
import { useChat } from "ai/react";
import { AIToolConfig } from "./ai-tools-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface RoutineBuilderProps {
  onClose: () => void;
  open: boolean;
  config: AIToolConfig;
}

interface RoutineMilestone {
  phase: string;
  goal: string;
}

interface RoutineTask {
  task: string;
  duration: string;
}

interface RoutineResult {
  estimatedCompletionTime: string;
  milestones: RoutineMilestone[];
  weeklyRoutine: { [key: string]: RoutineTask[] };
  tips: string[];
}

const RoutineBuilder = ({ onClose, open, config }: RoutineBuilderProps) => {
  // -- Form Input States --
  const [goal, setGoal] = useState("");
  const [daysAvailable, setDaysAvailable] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);

  // -- Result State --
  const [routineResult, setRoutineResult] = useState<RoutineResult | null>(
    null
  );

  // Add this with your other state variables
  const [loading, setLoading] = useState(false);

  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const CHALLENGE_OPTIONS = [
    "Procrastination",
    "Lack of motivation",
    "Time management",
    "Consistency",
    "Distractions",
    "Energy levels",
    "Work-life balance",
  ];

  // Updated parsing logic to handle markdown-formatted JSON
  const { handleSubmit, isLoading, setInput } = useChat({
    api: config.apiRoute,
    onFinish: (response) => {
      console.log("API response received:", response);
      try {
        // Clean the response content by removing markdown formatting
        let cleanContent = response.content;

        // Remove markdown code block indicators if present
        if (cleanContent.includes("```json") || cleanContent.includes("```")) {
          cleanContent = cleanContent
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        }

        console.log("Cleaned content:", cleanContent);
        const parsedContent = JSON.parse(cleanContent);
        setRoutineResult(parsedContent);
      } catch (e) {
        toast.error("Failed to generate routine");
        console.error("Failed to parse response:", e, response.content);
      }
    },
    onError: (error) => {
      console.error("API error:", error);
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleDayToggle = (day: string) => {
    if (daysAvailable.includes(day)) {
      setDaysAvailable(daysAvailable.filter((d) => d !== day));
    } else {
      setDaysAvailable([...daysAvailable, day]);
    }
  };

  const handleChallengeToggle = (challenge: string) => {
    if (challenges.includes(challenge)) {
      setChallenges(challenges.filter((c) => c !== challenge));
    } else {
      setChallenges([...challenges, challenge]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:p-5">
      <div className="bg-black/50 absolute inset-0" onClick={onClose} />
      <div
        className={cn(
          "z-50 flex h-full w-full flex-col rounded-t-lg sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-[550px] sm:rounded-lg bg-card border border-border shadow-xl overflow-hidden",
          "animate-in slide-in-from-bottom-10 fade-in-0 duration-300 ease-in-out"
        )}
      >
        {/* Header */}
        <div className="flex items-center px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-primary" />
            <h2 className="text-base font-medium">{config.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-full h-6 w-6 inline-flex items-center justify-center transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 h-full">
          {!routineResult ? (
            /* Input Form */
            <div className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!goal) {
                    toast.error("Please enter a goal first");
                    return;
                  }

                  // Create user preferences object
                  const userPreferences = {
                    goal,
                    daysAvailable:
                      daysAvailable.length > 0 ? daysAvailable : DAYS,
                    challenges: challenges.length > 0 ? challenges : [],
                  };

                  // First set the input so the API has the correct content to process
                  setInput(JSON.stringify(userPreferences));

                  // Then submit the form
                  handleSubmit(e, {
                    data: { userPreferences: JSON.stringify(userPreferences) },
                  });
                }}
                className="space-y-3"
              >
                {/* Goal Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="goal" className="text-xs font-medium">
                    What's your goal?
                  </Label>
                  <Textarea
                    id="goal"
                    placeholder="E.g., Learn piano, Run a marathon, Launch a podcast..."
                    className="resize-none h-20 text-sm"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  />
                </div>

                {/* Days Available */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium block">
                    Which days can you commit to this goal?
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={cn(
                          "py-1 px-2 rounded-md text-xs font-medium transition-colors",
                          daysAvailable.includes(day)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {SHORT_DAYS[index]}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {daysAvailable.length === 0
                      ? "If none selected, all days will be considered."
                      : `Selected: ${daysAvailable.length} days`}
                  </p>
                </div>

                {/* Challenges */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium block">
                    What challenges might you face?
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CHALLENGE_OPTIONS.map((challenge) => (
                      <div
                        key={challenge}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={challenge}
                          checked={challenges.includes(challenge)}
                          onCheckedChange={() =>
                            handleChallengeToggle(challenge)
                          }
                          className="h-3.5 w-3.5"
                        />
                        <label
                          htmlFor={challenge}
                          className="text-xs cursor-pointer"
                        >
                          {challenge}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!goal || isLoading || loading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Medal className="mr-2 h-4 w-4" />
                      Generate Smart Routine
                    </>
                  )}
                </Button>
              </form>
            </div>
          ) : (
            /* Results Section */
            <div className="space-y-4">
              {/* Header with export button */}
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Your Routine Plan</h4>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-md bg-muted/50 border border-border/50 w-full">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Estimated Completion
                  </p>
                  <p className="text-sm font-medium">
                    {routineResult.estimatedCompletionTime}
                  </p>
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Milestones</p>
                <div className="space-y-2">
                  {routineResult.milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="p-2.5 rounded-md bg-background border border-border/50"
                    >
                      <p className="text-xs font-medium">{milestone.phase}</p>
                      <p className="text-xs text-muted-foreground">
                        {milestone.goal}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Schedule */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Weekly Schedule</p>
                <div className="space-y-3">
                  {Object.entries(routineResult.weeklyRoutine).map(
                    ([day, tasks]) => (
                      <div key={day} className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          {day}
                        </p>
                        {tasks.map((task, index) => (
                          <div
                            key={index}
                            className="p-2 rounded-md bg-background border border-border/50 flex justify-between items-center"
                          >
                            <p className="text-xs">{task.task}</p>
                            <p className="text-xs text-muted-foreground ml-2 shrink-0">
                              {task.duration}
                            </p>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Tips */}
              <div className="p-3 rounded-md bg-primary/10 border border-primary/20">
                <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                  <LightbulbIcon className="h-3.5 w-3.5 text-primary" />
                  Pro Tips
                </p>
                <ul className="space-y-1.5 text-xs">
                  {routineResult.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <span className="text-primary">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Back Button */}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setRoutineResult(null)}
              >
                Create Another Routine
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoutineBuilder;
