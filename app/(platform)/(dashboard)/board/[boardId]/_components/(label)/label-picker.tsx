"use client";

import { useState, useEffect } from "react";
import { X, SearchIcon, Plus, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-actions";
import { updateCard } from "@/actions/update-card";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { createLabel } from "@/actions/create-label";
import { updateLabel } from "@/actions/update-label";
import { deleteLabel } from "@/actions/delete-label";
import { Label } from "@prisma/client";
import { getContrastColor } from "../(card)/card-item";

// color labels
const LABEL_COLORS = [
  { bg: "#FFB6C1", name: "light pink" },
  { bg: "#FFDAB9", name: "peach" },
  { bg: "#98FB98", name: "pale green" },
  { bg: "#AFEEEE", name: "pale turquoise" },
  { bg: "#B0E0E6", name: "powder blue" },
  { bg: "#DDA0DD", name: "plum" },
  { bg: "#D3D3D3", name: "light gray" },
  { bg: "#FF7F7F", name: "soft red" },
  { bg: "#FFA07A", name: "light salmon" },
  { bg: "#FFD700", name: "gold" },
  { bg: "#90EE90", name: "light green" },
  { bg: "#87CEEB", name: "sky blue" },
  { bg: "#4682B4", name: "steel blue" },
  { bg: "#9370DB", name: "medium purple" },
  { bg: "#C0C0C0", name: "silver" },
];

interface LabelPickerProps {
  open: boolean;
  onClose: () => void;
  cardId: string;
  boardId: string;
  currentLabel: string | null;
  labels: Label[];
  cardPosition?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export const LabelPicker = ({
  open,
  onClose,
  cardId,
  boardId,
  currentLabel,
  labels,
  cardPosition,
}: LabelPickerProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [newLabelText, setNewLabelText] = useState("");
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].bg);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [optimisticLabelId, setOptimisticLabelId] = useState<string | null>(
    currentLabel
  );

  // Update card action
  const { execute: executeUpdateCard } = useAction(updateCard, {
    onSuccess: () => {
      toast.success("Card updated");
      queryClient.invalidateQueries({ queryKey: ["card", cardId] });
    },
    onError: (error) => {
      setOptimisticLabelId(currentLabel);
      toast.error(error);
    },
  });

  // Reset optimistic selection when currentLabel changes from props
  useEffect(() => {
    setOptimisticLabelId(currentLabel);
  }, [currentLabel]);

  // Create label action
  const { execute: executeCreateLabel } = useAction(createLabel, {
    onSuccess: () => {
      toast.success("Label created");
      queryClient.invalidateQueries({ queryKey: ["labels", boardId] });
      setNewLabelText("");
      setCreatingLabel(false);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Update label action
  const { execute: executeUpdateLabel } = useAction(updateLabel, {
    onSuccess: () => {
      toast.success("Label updated");
      queryClient.invalidateQueries({ queryKey: ["labels", boardId] });
      setEditingLabel(null);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Delete label action
  const { execute: executeDeleteLabel } = useAction(deleteLabel, {
    onSuccess: () => {
      toast.success("Label deleted");
      queryClient.invalidateQueries({ queryKey: ["labels", boardId] });
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const filteredLabels = labels.filter((label) =>
    label.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleLabelSelect = (labelId: string) => {
    // Toggle selection - if already selected, deselect it
    const newLabelId = optimisticLabelId === labelId ? null : labelId;
    setOptimisticLabelId(newLabelId);

    executeUpdateCard({
      id: cardId,
      boardId,
      labelId: newLabelId,
    });
  };

  const handleRemoveLabel = () => {
    setOptimisticLabelId(null);

    executeUpdateCard({
      id: cardId,
      boardId,
      labelId: null,
    });
  };

  const handleCreateLabel = () => {
    executeCreateLabel({
      name: newLabelText.trim() || null,
      color: selectedColor,
      boardId,
    });
  };

  const handleUpdateLabel = () => {
    if (!editingLabel) return;

    executeUpdateLabel({
      id: editingLabel.id,
      name: newLabelText.trim() || null,
      color: selectedColor,
      boardId,
    });
  };

  const handleDeleteLabel = (labelId: string) => {
    executeDeleteLabel({
      id: labelId,
      boardId,
    });

    // If the deleted label was applied to the current card, remove it
    if (labels.find((l) => l.id === labelId)?.name === currentLabel) {
      handleRemoveLabel();
    }
  };

  const startEditingLabel = (label: Label) => {
    setEditingLabel(label);
    setNewLabelText(label.name || "");
    setSelectedColor(label.color);
    setCreatingLabel(true);
  };

  // Calculate dialog position based on card position
  const getDialogPosition = () => {
    if (!cardPosition) return {};

    // Position to the right of the card by default
    const position = {
      position: "fixed" as const,
      top: `${cardPosition.top}px`,
      left: `${cardPosition.left + cardPosition.width + 16}px`, // 16px gap
    };

    // Check if dialog would go off-screen to the right
    const dialogWidth = 320; // Approximate width of dialog
    if (
      cardPosition.left + cardPosition.width + dialogWidth + 16 >
      window.innerWidth
    ) {
      // Position to the left of the card instead
      position.left = `${cardPosition.left - dialogWidth - 16}px`;

      // If that would go off-screen to the left, position below the card
      if (cardPosition.left - dialogWidth - 16 < 0) {
        position.left = `${cardPosition.left}px`;
        position.top = `${cardPosition.top + cardPosition.height + 16}px`;
      }
    }

    return position;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="p-0 overflow-hidden max-w-xs dark:bg-slate-800 bg-white"
          style={getDialogPosition()}
          aria-describedby="label-picker-description"
        >
          <p id="label-picker-description" className="sr-only">
            Select a label for the card.
          </p>
          <DialogTitle className="text-center pt-5 px-6 text-sm font-semibold text-gray-600 dark:text-gray-300">
            {creatingLabel
              ? editingLabel
                ? "Edit Label"
                : "Create Label"
              : "Labels"}
          </DialogTitle>

          <div className="p-4 space-y-4">
            {!creatingLabel ? (
              <>
                <div className="relative">
                  <SearchIcon className="h-4 w-4 absolute top-2.5 left-3 text-muted-foreground" />
                  <Input
                    placeholder="Search labels..."
                    className="pl-9 text-sm dark:bg-slate-700 dark:text-white dark:border-slate-600"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    type="text"
                  />
                </div>

                {labels.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No labels created yet. Create your first label below.
                  </p>
                )}

                {filteredLabels.length === 0 && search.length > 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No matching labels found
                  </p>
                )}

                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {filteredLabels.map((label) => (
                    <div
                      key={label.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={optimisticLabelId === label.id}
                        onChange={() => handleLabelSelect(label.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div
                        className="flex-1 p-2 rounded text-sm font-semibold cursor-pointer"
                        style={{
                          backgroundColor: label.color,
                          height: "40px",
                          color: getContrastColor(label.color),
                        }}
                        onClick={() => handleLabelSelect(label.id)}
                      >
                        {label.name}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 dark:hover:bg-slate-600"
                          onClick={() => startEditingLabel(label)}
                          aria-label="Edit Label"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          onClick={() => handleDeleteLabel(label.id)}
                          aria-label="Delete Label"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {optimisticLabelId && (
                  <Button
                    variant="outline"
                    className="w-full text-sm dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
                    onClick={handleRemoveLabel}
                    aria-label="Remove Label"
                  >
                    Remove Label
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="w-full text-center text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 py-2"
                  onClick={() => {
                    setEditingLabel(null);
                    setNewLabelText("");
                    setSelectedColor(LABEL_COLORS[0].bg);
                    setCreatingLabel(true);
                  }}
                  aria-label="Create Label"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create a new label
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                {/* Label Preview */}
                <div
                  className="p-3 rounded text-sm font-semibold text-center mx-auto"
                  style={{
                    backgroundColor: selectedColor,
                    color: getContrastColor(selectedColor),
                    width: "80%",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {newLabelText}
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input
                    placeholder="Label name (optional)"
                    value={newLabelText}
                    onChange={(e) => setNewLabelText(e.target.value)}
                    className="mt-1 dark:bg-slate-700 dark:text-white dark:border-slate-600"
                    type="text"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Color</label>
                  <div className="grid grid-cols-5 gap-2 mt-1">
                    {LABEL_COLORS.map((color) => (
                      <div
                        key={color.bg}
                        className={`h-8 rounded cursor-pointer ${
                          selectedColor === color.bg
                            ? "ring-2 ring-black dark:ring-white ring-offset-2 dark:ring-offset-slate-800"
                            : ""
                        }`}
                        style={{ backgroundColor: color.bg }}
                        onClick={() => setSelectedColor(color.bg)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    className="dark:text-white dark:hover:bg-slate-700"
                    onClick={() => {
                      setCreatingLabel(false);
                      setNewLabelText("");
                      setEditingLabel(null);
                    }}
                    aria-label="Cancel"
                  >
                    Cancel
                  </Button>
                  {editingLabel ? (
                    <Button
                      className="dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500"
                      onClick={handleUpdateLabel}
                      aria-label="Update Label"
                    >
                      Update
                    </Button>
                  ) : (
                    <Button
                      className="dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500"
                      onClick={handleCreateLabel}
                      aria-label="Create Label"
                    >
                      Create
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
