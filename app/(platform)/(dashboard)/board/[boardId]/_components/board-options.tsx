"use client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { MoreHorizontal, Trash, Plus } from "lucide-react";
import { deleteBoard } from "@/actions/delete-board";
import { useAction } from "@/hooks/use-actions";
import { toast } from "sonner";
import { ElementRef, useRef } from "react";
import { createBoard } from "@/actions/create-board";
import { useRouter } from "next/navigation";

interface BoardOptionsProps {
  id: string;
  visibilitySettings: {
    showAssistant: boolean;
    showAvatar: boolean;
    showZoomControls: boolean;
    showBookmarks: boolean;
    showThemes: boolean;
  };
  onSettingsChange: (settings: string, value: boolean) => void;
}

const BoardOptions = ({
  id,
  visibilitySettings,
  onSettingsChange,
}: BoardOptionsProps) => {
  const closeRef = useRef<ElementRef<"button">>(null);
  const router = useRouter();

  const { execute: executeDeleteBoard, isLoading: isLoadingDelete } = useAction(
    deleteBoard,
    {
      onError: (error) => toast.error(error),
    }
  );

  const onDelete = () => {
    executeDeleteBoard({ id });
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-auto w-auto p-2 hover:bg-neutral-500/10"
          variant="ghost"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 px-0 py-3 shadow-md rounded-lg bg-white"
        side="bottom"
        align="start"
      >
        <PopoverClose asChild />
        <div className="px-5">
          <h3 className="text-start text-neutral-900 pb-3">Board Settings</h3>

          <div className="space-y-3">
            <SettingItem
              label="Zoom Controls"
              checked={visibilitySettings.showZoomControls}
              onChange={(checked) =>
                onSettingsChange("showZoomControls", checked)
              }
            />
            <SettingItem
              label="Theme"
              checked={visibilitySettings.showThemes}
              onChange={(checked) => onSettingsChange("showThemes", checked)}
            />
            <SettingItem
              label="Bookmark"
              checked={visibilitySettings.showBookmarks}
              onChange={(checked) => onSettingsChange("showBookmarks", checked)}
            />
            <SettingItem
              label="Assistance"
              checked={visibilitySettings.showAssistant}
              onChange={(checked) => onSettingsChange("showAssistant", checked)}
            />
          </div>

          {/* Divider */}
          <div className="border-t my-3" />

          {/* Delete Board */}
          <Button
            onClick={onDelete}
            disabled={isLoading}
            className="flex items-center gap-2 w-full px-3 py-1.5 justify-start text-sm text-red-500 hover:bg-neutral-500/10"
            variant="ghost"
          >
            <Trash className="h-4 w-4" />
            Delete Board
          </Button>

          {/* Create Board  */}
          <Button
            onClick={onCreate}
            className="flex items-center gap-2 w-full px-3 py-1.5 justify-start text-sm hover:bg-neutral-500/10"
            variant="ghost"
          >
            <Plus className="h-4 w-4" />
            Create Board
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface SettingsProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface ToggleButtonProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const SettingItem = ({ label, checked, onChange }: SettingsProps) => (
  <div className="flex items-center justify-between text-sm font-medium text-neutral-900">
    {label} <ToggleButton checked={checked} onChange={onChange} />
  </div>
);

const ToggleButton = ({ checked, onChange }: ToggleButtonProps) => (
  <label className="relative flex w-10 h-5 bg-gray-300 rounded-full cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => {
        onChange(e.target.checked);
      }}
      className="sr-only peer"
    />
    <span className="absolute w-4 h-4 bg-rose-300 rounded-full left-0.5 top-0.5 peer-checked:bg-rose-600 peer-checked:left-5 transition" />
  </label>
);

export default BoardOptions;
