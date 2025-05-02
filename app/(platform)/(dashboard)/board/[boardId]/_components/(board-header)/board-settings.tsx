import { Dispatch, SetStateAction, useState, useRef, useEffect } from "react";
import {
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Eye,
  Trash,
  Plus,
  ChevronDown,
  ChevronUp,
  Volume2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAction } from "@/hooks/use-actions";
import { deleteBoard } from "@/actions/delete-board";
import { createBoard } from "@/actions/create-board";
import voiceData from "../(text-to-speech)/model.json";
import { useVoice, Voice } from "../(text-to-speech)/VoiceContext";

interface BoardSettingsProps {
  zoomLevel: number;
  setZoomLevel: Dispatch<SetStateAction<number>>;
  colorBlindMode: boolean;
  setColorBlindMode: Dispatch<SetStateAction<boolean>>;
  boardId: string;
  onModelChange: (model: Voice) => void;
}

const uniqueValues = (field: keyof Voice) => {
  return [
    ...new Set(voiceData.voices_list.map((voice) => voice[field] as string)),
  ];
};

const BoardSettings = ({
  zoomLevel,
  setZoomLevel,
  colorBlindMode,
  setColorBlindMode,
  boardId,
  onModelChange,
}: BoardSettingsProps) => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const [filteredModels, setFilteredModels] = useState<Voice[]>([]);
  const [message, setMessage] = useState("");
  const [showModel, setShowModel] = useState(false);
  const [url, setUrl] = useState("");

  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  const {
    selectedVoice,
    setSelectedVoice,
    voices: voiceContextVoices,
    saveVoiceSelection,
  } = useVoice();

  const [isSampleLoading, setIsSampleLoading] = useState(false);
  const [sampleAudioUrl, setSampleAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setVoices(voiceData.voices_list);
  }, []);

  useEffect(() => {
    const filtered = voices.filter(
      (voice) =>
        (selectedGender ? voice.gender === selectedGender : true) &&
        (selectedCountry ? voice.country === selectedCountry : true) &&
        (selectedLanguage ? voice.language === selectedLanguage : true)
    );
    setFilteredModels(filtered);
  }, [selectedGender, selectedCountry, selectedLanguage]);

  useEffect(() => {
    const modelArray = filteredModels.filter(
      (model) => model.voice_id === selectedModel
    );

    // Only call onModelChange if we found a matching model
    if (modelArray.length > 0) {
      onModelChange(modelArray[0]);
    }
  }, [selectedModel, filteredModels, onModelChange]);

  useEffect(() => {
    if (selectedVoice) {
      setSelectedGender(selectedVoice.gender || "");
      setSelectedLanguage(selectedVoice.language || "");
      setSelectedCountry(selectedVoice.country || "");
      setSelectedModel(selectedVoice.voice_id || "");
    }
  }, []);

  const { execute: executeDeleteBoard, isLoading: isLoadingDelete } = useAction(
    deleteBoard,
    {
      onError: (error) => toast.error(error),
    }
  );

  const onDelete = () => {
    executeDeleteBoard({ id: boardId });
    closeRef.current?.click();
  };

  const { execute: executeCreateBoard, isLoading } = useAction(createBoard, {
    onSuccess: (data) => {
      toast.success(`Board Created!`);
      router.push(`/board/${data.id}`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onCreate = () => {
    const title = "Untitled";
    executeCreateBoard({ title });
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 50));

  const resetSettings = () => {
    setZoomLevel(110);
    setTheme("light");
    setColorBlindMode(false);
    document.body.classList.remove("accessible");
  };

  const toggleColorBlindMode = () => {
    const newMode = !colorBlindMode;
    setColorBlindMode(newMode);
    if (newMode) {
      document.body.classList.add("accessible");
    } else {
      document.body.classList.remove("accessible");
    }
  };

  const handleSliderChange = (value: number[]) => {
    setZoomLevel(value[0]);
  };

  const handleModelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceId = e.target.value;
    setSelectedModel(voiceId);

    const voice =
      voiceContextVoices.find((v) => v.voice_id === voiceId) || null;
    if (voice) {
      saveVoiceSelection(voice);
    }
  };

  const playSample = async () => {
    if (!selectedModel) {
      toast.error("Please select a voice model first");
      return;
    }

    try {
      setIsSampleLoading(true);

      // Find the voice object for the API
      const selectedVoiceObj = voiceContextVoices.find(
        (v) => v.voice_id === selectedModel
      );
      if (!selectedVoiceObj) {
        throw new Error("Selected voice not found");
      }

      // Prepare the voice object for API
      const voiceForAPI = {
        id: selectedVoiceObj.id,
        voice_id: selectedVoiceObj.voice_id,
        gender: selectedVoiceObj.gender,
        language_code: selectedVoiceObj.language_code,
        language: selectedVoiceObj.language,
        country: selectedVoiceObj.country,
        name: selectedVoiceObj.name,
        type: selectedVoiceObj.type,
      };

      // Sample text to speak
      const sampleText =
        "This is a sample of the selected voice. You can use this voice for your tasks.";

      // Call the API to generate speech
      const response = await fetch("/api/getSpeech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sampleText,
          voice: voiceForAPI,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Check if we have valid audio URL
      if (data && data.length > 0 && data[0].link) {
        setSampleAudioUrl(data[0].link);

        // Play the audio
        if (audioRef.current) {
          audioRef.current.src = data[0].link;
          audioRef.current.play();
        }

        toast.success("Playing sample voice");
      } else {
        throw new Error("No audio URL returned");
      }
    } catch (error) {
      console.error("Error playing sample:", error);
      toast.error("Failed to play sample voice");
    } finally {
      setIsSampleLoading(false);
    }
  };

  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Board Settings"
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Board settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 p-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <DropdownMenuLabel className="text-sm font-semibold">
          Board Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2" />

        {/* Display Settings */}
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDisplayOpen(!displayOpen)}
            className="w-full flex justify-between items-center font-bold"
            aria-label="Display Settings"
          >
            <span className="text-xs">Display Settings</span>
            {displayOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {displayOpen && (
            <div className="pb-3 pt-2 px-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium pl-2">Zoom</span>
                  <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {zoomLevel}%
                  </span>
                </div>

                <div className="flex items-center space-x-2 px-1 mt-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomOut}
                    className="h-7 w-7 rounded-lg"
                    disabled={zoomLevel <= 50}
                    aria-label="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>

                  <Slider
                    value={[zoomLevel]}
                    min={50}
                    max={200}
                    step={5}
                    onValueChange={handleSliderChange}
                    className="flex-1"
                  />

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleZoomIn}
                    className="h-7 w-7 rounded-lg"
                    disabled={zoomLevel >= 200}
                    aria-label="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <DropdownMenuSeparator className="my-2" />

              <div className="py-1">
                <p className="text-xs font-medium mb-1 px-2">Theme</p>
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex items-center rounded-lg my-1 cursor-pointer transition-colors",
                    theme === "light" && "bg-slate-100 dark:bg-slate-800"
                  )}
                >
                  <div
                    className="mr-2 h-5 w-5 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor:
                        theme === "light" ? "#FFFBCC" : "#4B5563",
                    }}
                    aria-label="Light Mode"
                  >
                    <Sun
                      className={cn(
                        "h-3.5 w-3.5",
                        theme === "light"
                          ? "text-yellow-600"
                          : "text-yellow-300"
                      )}
                    />
                  </div>
                  <span className="text-sm">Light Mode</span>
                  {theme === "light" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex items-center rounded-lg my-1 cursor-pointer transition-colors",
                    theme === "dark" && "bg-slate-100 dark:bg-slate-800"
                  )}
                >
                  <div
                    className="mr-2 h-5 w-5 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: theme === "dark" ? "#1E3A8A" : "#E5E7EB",
                    }}
                    aria-label="Dark Mode"
                  >
                    <Moon
                      className={cn(
                        "h-3.5 w-3.5",
                        theme === "dark" ? "text-indigo-200" : "text-indigo-500"
                      )}
                    />
                  </div>
                  <span className="text-sm">Dark Mode</span>
                  {theme === "dark" && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem
                onClick={toggleColorBlindMode}
                className={cn(
                  "flex items-center rounded-lg my-1 cursor-pointer transition-colors",
                  colorBlindMode && "bg-slate-100 dark:bg-slate-800"
                )}
                aria-label="Color Blind Mode"
              >
                <div className="mr-2 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <Eye className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <span className="text-sm">Color Blind Mode</span>
                <div className="ml-auto">
                  <div
                    className={cn(
                      "w-8 h-4 rounded-full transition-colors flex items-center p-0.5",
                      colorBlindMode
                        ? "bg-green-500"
                        : "bg-slate-300 dark:bg-slate-700"
                    )}
                  >
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full bg-white transition-transform",
                        colorBlindMode && "translate-x-4"
                      )}
                    />
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-2" />

              <Button
                variant="outline"
                size="sm"
                onClick={resetSettings}
                className="w-full flex items-center justify-center gap-2"
                aria-label="Reset Settings"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Settings
              </Button>
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="my-3" />

        {/* Voice Assistant Settings */}
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVoiceSettingsOpen(!voiceSettingsOpen)}
            className="w-full flex justify-between items-center font-bold"
            aria-label="Voice Assistant Settings"
          >
            <span className="text-xs">Voice Assistant Settings</span>
            {voiceSettingsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {voiceSettingsOpen && (
            <div className="pb-3 pt-2 px-2 space-y-4">
              <div className="space-y-3">
                {/* Gender */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground/80">
                    Gender
                  </span>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="text-xs bg-muted rounded-md py-1.5 px-2 border border-border/30 focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                  >
                    <option value="">Any Gender</option>
                    {uniqueValues("gender")
                      .sort()
                      .map((gender: string, index: number) => (
                        <option key={index} value={gender}>
                          {gender}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground/80">
                    Language
                  </span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="text-xs bg-muted rounded-md py-1.5 px-2 border border-border/30 focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                  >
                    <option value="">Any Language</option>
                    {uniqueValues("language")
                      .sort()
                      .map((language: string, index: number) => (
                        <option key={index} value={language}>
                          {language}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Country */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground/80">
                    Country
                  </span>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="text-xs bg-muted rounded-md py-1.5 px-2 border border-border/30 focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                  >
                    <option value="">Any Country</option>
                    {uniqueValues("country")
                      .sort()
                      .map((country: string, index: number) => (
                        <option key={index} value={country}>
                          {country}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Model - Fix the layout to match other fields */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground/80">
                    Model
                  </span>
                  <select
                    value={selectedModel}
                    onChange={handleModelSelect}
                    className="text-xs bg-muted rounded-md py-1.5 px-2 border border-border/30 focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                  >
                    <option value="">Select Model</option>
                    {filteredModels.map((voice: Voice, index: number) => (
                      <option key={index} value={voice.voice_id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Test Voice Button */}
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs flex items-center justify-center gap-2 hover:bg-accent/20 transition-colors mt-2"
                onClick={playSample}
                disabled={isSampleLoading || !selectedModel}
              >
                {isSampleLoading ? (
                  <>
                    <svg
                      className="animate-spin h-3 w-3"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Testing Voice...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-accent" />
                    <span>Test Selected Voice</span>
                  </>
                )}
              </Button>

              {/* Selected Voice Display */}
              {selectedModel && (
                <div className="mt-2 py-2 px-3 rounded-md bg-accent/5 border border-accent/10">
                  <div className="flex items-center gap-2">
                    <div className="bg-accent/20 p-1 rounded-full">
                      <Volume2 className="h-3 w-3 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">Selected Voice:</p>
                      <p className="text-xs text-muted-foreground">
                        {
                          voiceContextVoices.find(
                            (v) => v.voice_id === selectedModel
                          )?.name
                        }
                        <span className="opacity-60 ml-1">
                          ({selectedModel})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="my-3" />

        {/* Board Actions */}
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionsOpen(!actionsOpen)}
            className="w-full flex justify-between items-center font-bold"
            aria-label="Board Actions"
          >
            <span className="text-xs">Board Actions</span>
            {actionsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {actionsOpen && (
            <div className="pb-3 pt-2 px-2">
              <Button
                onClick={onDelete}
                disabled={isLoadingDelete}
                className="flex items-center gap-2 w-full px-3 py-1.5 justify-start text-sm text-red-500 hover:bg-neutral-500/10"
                variant="ghost"
                aria-label="Delete Board"
              >
                <Trash className="h-4 w-4" />
                Delete Board
              </Button>

              <Button
                onClick={onCreate}
                className="flex items-center gap-2 w-full px-3 py-1.5 justify-start text-sm hover:bg-neutral-500/10"
                variant="ghost"
                aria-label="Create Board"
              >
                <Plus className="h-4 w-4" />
                Create Board
              </Button>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BoardSettings;
