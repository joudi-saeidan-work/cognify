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

  const { setSelectedVoice, voices: voiceContextVoices } = useVoice();

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
      setSelectedVoice(voice);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDisplayOpen(!displayOpen)}
            className="w-full flex justify-between items-center font-bold"
          >
            <span className="text-xs">Display Settings</span>
            {displayOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {displayOpen && (
            <div className="pb-3 pt-2">
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
              >
                <RotateCcw className="h-4 w-4" />
                Reset Settings
              </Button>
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="my-3" />

        {/* Voice Assistant Settings */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVoiceSettingsOpen(!voiceSettingsOpen)}
            className="w-full flex justify-between items-center font-bold"
          >
            <span className="text-xs">Voice Assistant Settings</span>
            {voiceSettingsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {voiceSettingsOpen && (
            <div className="py-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Gender</span>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                >
                  <option value="">Select Gender</option>
                  {/* this will go through our dataset and find all possible genders and display them in the dropdown */}
                  {uniqueValues("gender")
                    .sort()
                    .map((gender: string, index: number) => (
                      <option key={index} value={gender}>
                        {gender}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Language</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                >
                  <option value="">Select Language</option>
                  {/* this will go through our dataset and find all possible genders and display them in the dropdown */}
                  {uniqueValues("language")
                    .sort()
                    .map((language: string, index: number) => (
                      <option key={index} value={language}>
                        {language}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Country</span>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                >
                  <option value="">Select Country</option>
                  {/* this will go through our dataset and find all possible genders and display them in the dropdown */}
                  {uniqueValues("country")
                    .sort()
                    .map((country: string, index: number) => (
                      <option key={index} value={country}>
                        {country}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Model</span>
                <select
                  value={selectedModel}
                  onChange={handleModelSelect}
                  className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                >
                  <option value="">Select Model</option>
                  {/* this will go through our dataset and find all possible genders and display them in the dropdown */}
                  {filteredModels.map((voice: Voice, index: number) => (
                    <option key={index} value={voice.voice_id}>
                      {voice.name} ({voice.voice_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="my-3" />

        {/* Board Actions */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActionsOpen(!actionsOpen)}
            className="w-full flex justify-between items-center font-bold"
          >
            <span className="text-xs">Board Actions</span>
            {actionsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {actionsOpen && (
            <div className="py-1">
              <Button
                onClick={onDelete}
                disabled={isLoadingDelete}
                className="flex items-center gap-2 w-full px-3 py-1.5 justify-start text-sm text-red-500 hover:bg-neutral-500/10"
                variant="ghost"
              >
                <Trash className="h-4 w-4" />
                Delete Board
              </Button>

              <Button
                onClick={onCreate}
                className="flex items-center gap-2 w-full px-3 py-1.5 justify-start text-sm hover:bg-neutral-500/10"
                variant="ghost"
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
