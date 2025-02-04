import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useChat } from "ai/react";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { AIToolConfig } from "./ai-tools-config";
import { Select } from "@radix-ui/react-select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarPlus } from "lucide-react";

// Updated schema to match AI response structure
const RoutineResultSchema = z.object({
  totalDuration: z.string(),
  milestones: z.array(
    z.object({
      phase: z.string(),
      goal: z.string(),
    })
  ),
  weeklyRoutine: z.record(
    z.array(
      z.object({
        task: z.string(),
        duration: z.string(),
      })
    )
  ),
  estimatedCompletionTime: z.string(),
  tips: z.array(z.string()),
});

type RoutineResult = z.infer<typeof RoutineResultSchema>;

interface RoutineBuilderProps {
  onClose: () => void;
  open: boolean;
  config: AIToolConfig;
}

const RoutineBuilder = ({ onClose, open, config }: RoutineBuilderProps) => {
  // -- Form Input States --
  const [goal, setGoal] = useState("");
  const [timeAvailable, setTimeAvailable] = useState("");
  const [timeframeNumber, setTimeframeNumber] = useState("");
  const [timeframeUnit, setTimeframeUnit] = useState("");
  const [daysAvailable, setDaysAvailable] = useState<string[]>([]);
  const [dailyCommitment, setDailyCommitment] = useState(false);
  const [highEnergyDays, setHighEnergyDays] = useState<string[]>([]);
  const [lowEnergyDays, setLowEnergyDays] = useState<string[]>([]);
  const [preferredWorkTime, setPreferredWorkTime] = useState("");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [motivationPreferences, setMotivationPreferences] = useState<string[]>(
    []
  );

  // -- Result State --
  const [routineResult, setRoutineResult] = useState<RoutineResult | null>(
    null
  );

  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const WORK_TIME_OPTIONS = [
    "Morning (6am-12pm)",
    "Afternoon (12pm-5pm)",
    "Evening (5pm-9pm)",
    "Night (9pm-12am)",
    "Flexible",
  ];

  const MOTIVATION_OPTIONS = [
    "Gamification",
    "Small Rewards",
    "Accountability Partner",
    "Progress Tracking",
    "Positive Reinforcement",
    "Deadline-driven",
    "Social Motivation",
  ];

  const TIME_AVAILABLE_OPTIONS = [
    "30 minutes per day",
    "1 hour per day",
    "2 hours per day",
    "3 hours per day",
    "4+ hours per day",
    "Flexible schedule",
  ];

  const CHALLENGES_OPTIONS = [
    "Procrastination",
    "Distractions",
    "Time Management",
    "Lack of Motivation",
    "Overcommitment",
    "Stress/Fatigue",
    "Inconsistent Schedule",
  ];

  // Calendar export function (updated for new schema)
  const exportToCalendar = () => {
    if (!routineResult) return;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Routine Builder//EN",
      ...Object.entries(routineResult.weeklyRoutine).flatMap(([day, tasks]) =>
        tasks.map(
          (task, index) =>
            `BEGIN:VEVENT
UID:${day}-${index}@routinebuilder
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "")}
DTSTART:${day.toUpperCase()}_0000AM
DURATION:PT${task.duration.replace(" minutes", "M").replace(" hours", "H")}
SUMMARY:${task.task}
DESCRIPTION:${task.task} - ${task.duration}
END:VEVENT`
        )
      ),
      "END:VCALENDAR",
    ].join("\n");

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "routine-schedule.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Update the chat’s input message whenever any field changes.
  const updateChatInput = () => {
    const payload = {
      goal,
      timeAvailable,
      timeframe:
        timeframeNumber && timeframeUnit
          ? `${timeframeNumber} ${timeframeUnit}`
          : "",
      daysAvailable,
      preferredWorkTimes: { preferredWorkTime },
      challenges,
      motivationPreferences,
    };
    setInput(JSON.stringify(payload));
  };

  const parseAIResponse = (response: string) => {
    try {
      // Clean response first
      const cleaned = response
        .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width spaces
        .replace(/\\\"/g, '"'); // Fix escaped quotes

      const raw = JSON.parse(cleaned);
      const parsed = RoutineResultSchema.parse(raw);
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
      setRoutineResult(parsed);
    },
    onError: (error) => {
      toast.error(`AI processing failed: ${error.message}`);
    },
  });

  // Helper for toggling checkboxes
  const toggleDay = (
    day: string,
    selectedDays: string[],
    setSelectedDays: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
    updateChatInput();
  };

  // Update the toggle function for multi-select preferences
  const togglePreference = (preference: string) => {
    setMotivationPreferences((prev) =>
      prev.includes(preference)
        ? prev.filter((p) => p !== preference)
        : [...prev, preference]
    );
    updateChatInput();
  };

  // Toggle function for challenges
  const toggleChallenge = (challenge: string) => {
    setChallenges((prev) =>
      prev.includes(challenge)
        ? prev.filter((c) => c !== challenge)
        : [...prev, challenge]
    );
    updateChatInput();
  };

  return (
    <div
      className={cn(
        "h-[600px] overflow-y-auto fixed bottom-0 right-0 w-full max-w-[600px] p-6 bg-white border border-gray-200 shadow-lg rounded-lg",
        open ? "block" : "hidden"
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          🗓️ Routine Builder
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          ✖
        </button>
      </div>

      {/* Form Section */}
      <div className="space-y-6">
        {/* Goal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🎯 Goal
          </label>
          <input
            type="text"
            placeholder="e.g., Run a marathon"
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value);
              updateChatInput();
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {/* Time Available */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ⏳ Time Available
          </label>
          <Select
            value={timeAvailable}
            onValueChange={(value) => {
              setTimeAvailable(value);
              updateChatInput();
            }}
          >
            <SelectTrigger className="border-gray-200 rounded-xl hover:border-gray-300">
              <SelectValue placeholder="Select time availability" />
            </SelectTrigger>
            <SelectContent>
              {TIME_AVAILABLE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Timeframe */}
        <label className="block text-sm font-medium text-gray-700">
          ⏳ Time Frame
        </label>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            min="1"
            placeholder="Number"
            value={timeframeNumber}
            onChange={(e) => {
              const value = Math.max(1, parseInt(e.target.value) || 1);
              setTimeframeNumber(value.toString());
              updateChatInput();
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Select
            value={timeframeUnit}
            onValueChange={(value) => {
              setTimeframeUnit(value);
              updateChatInput();
            }}
          >
            <SelectTrigger className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
              <SelectItem value="months">Months</SelectItem>
              <SelectItem value="years">Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Days Available */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 Days Available
          </label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={`available-${day}`}
                onClick={() => toggleDay(day, daysAvailable, setDaysAvailable)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm",
                  daysAvailable.includes(day)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        {/* Preferred Work Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Work Time
            </label>
            <Select
              value={preferredWorkTime}
              onValueChange={(value) => {
                setPreferredWorkTime(value);
                updateChatInput();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {WORK_TIME_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Challenges */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Challenges
          </label>
          <div className="flex flex-wrap gap-2">
            {CHALLENGES_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => toggleChallenge(option)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm",
                  challenges.includes(option)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        {/* Motivation Preferences */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivation Preferences
          </label>
          <div className="flex flex-wrap gap-2">
            {MOTIVATION_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => togglePreference(option)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm",
                  motivationPreferences.includes(option)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {routineResult && (
        <div className="mt-8 p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              📋 Your Routine Plan
            </h3>
            <Button
              onClick={exportToCalendar}
              variant="outline"
              className="gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              Export to Calendar
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Total Time Commitment</p>
              <p className="text-xl font-semibold text-blue-800">
                {routineResult.totalDuration}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Estimated Completion</p>
              <p className="text-xl font-semibold text-green-800">
                {routineResult.estimatedCompletionTime}
              </p>
            </div>
          </div>

          {/* Milestones Section */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Milestones</h4>
            <div className="space-y-4">
              {routineResult.milestones.map((milestone, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-700">
                    Phase: {milestone.phase}
                  </h5>
                  <p className="text-sm text-gray-500">
                    Goal: {milestone.goal}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Weekly Schedule</h4>
            <div className="space-y-4">
              {Object.entries(routineResult.weeklyRoutine).map(
                ([day, tasks]) => (
                  <div key={day} className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-700 mb-2">{day}</h5>
                    <div className="space-y-2">
                      {tasks.map((task, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-white rounded-md border border-gray-100"
                        >
                          <div>
                            <p className="font-medium text-gray-800">
                              {task.task}
                            </p>
                            <p className="text-sm text-gray-500">
                              {task.duration}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Tips Section */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="text-lg font-semibold mb-3">🌟 Pro Tips</h4>
            <ul className="space-y-2">
              {routineResult.tips.map((tip, index) => (
                <li key={index} className="flex items-start text-gray-700">
                  <span className="mr-2">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="mt-6">
        <Button
          className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "✨ Crafting Your Routine..." : "Generate Smart Routine"}
        </Button>
      </div>
    </div>
  );
};

export default RoutineBuilder;
