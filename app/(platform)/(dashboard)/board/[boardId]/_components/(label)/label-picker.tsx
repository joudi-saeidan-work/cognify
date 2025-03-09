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

// color labels
const LABEL_COLORS = [
  { bg: "#FFB6C1", text: "black", name: "light pink" },
  { bg: "#FFDAB9", text: "black", name: "peach" },
  { bg: "#98FB98", text: "black", name: "pale green" },
  { bg: "#AFEEEE", text: "black", name: "pale turquoise" },
  { bg: "#B0E0E6", text: "black", name: "powder blue" },
  { bg: "#DDA0DD", text: "black", name: "plum" },
  { bg: "#D3D3D3", text: "black", name: "light gray" },
  { bg: "#FF7F7F", text: "black", name: "soft red" },
  { bg: "#FFA07A", text: "black", name: "light salmon" },
  { bg: "#FFD700", text: "black", name: "gold" },
  { bg: "#90EE90", text: "black", name: "light green" },
  { bg: "#87CEEB", text: "black", name: "sky blue" },
  { bg: "#4682B4", text: "white", name: "steel blue" },
  { bg: "#9370DB", text: "white", name: "medium purple" },
  { bg: "#C0C0C0", text: "black", name: "silver" },
];

interface LabelPickerProps {
  open: boolean;
  onClose: () => void;
  cardId: string;
  boardId: string;
  currentLabel: string | null;
  labels: Label[];
}

export const LabelPicker = ({
  open,
  onClose,
  cardId,
  boardId,
  currentLabel,
  labels,
}: LabelPickerProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [newLabelText, setNewLabelText] = useState("");
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[0].bg);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);

  // Update card action
  const { execute: executeUpdateCard } = useAction(updateCard, {
    onSuccess: () => {
      toast.success("Card updated");
      queryClient.invalidateQueries({ queryKey: ["card", cardId] });
      onClose();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

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
    executeUpdateCard({
      id: cardId,
      boardId,
      labelId: labelId,
    });
  };

  const handleRemoveLabel = () => {
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

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-white p-0 overflow-hidden max-w-xs">
          <DialogTitle className="text-center pt-5 px-6 text-sm font-semibold text-gray-600">
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
                    className="pl-9 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={currentLabel === label.id}
                        onChange={() => handleLabelSelect(label.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div
                        className="flex-1 p-2 rounded text-sm font-semibold cursor-pointer"
                        style={{
                          backgroundColor: label.color,
                          height: "40px",
                          color:
                            LABEL_COLORS.find(
                              (color) => color.bg === label.color
                            )?.text || "white",
                        }}
                        onClick={() => handleLabelSelect(label.id)}
                      >
                        {label.name}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => startEditingLabel(label)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteLabel(label.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {currentLabel && (
                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={handleRemoveLabel}
                  >
                    Remove Label
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="w-full text-center text-sm font-semibold text-gray-600 hover:bg-gray-100 py-2"
                  onClick={() => {
                    setEditingLabel(null);
                    setNewLabelText("");
                    setSelectedColor(LABEL_COLORS[0].bg);
                    setCreatingLabel(true);
                  }}
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
                    color:
                      LABEL_COLORS.find((color) => color.bg === selectedColor)
                        ?.text || "white",
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
                    className="mt-1"
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
                            ? "ring-2 ring-black ring-offset-2"
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
                    onClick={() => {
                      setCreatingLabel(false);
                      setNewLabelText("");
                      setEditingLabel(null);
                    }}
                  >
                    Cancel
                  </Button>
                  {editingLabel ? (
                    <Button onClick={handleUpdateLabel}>Update</Button>
                  ) : (
                    <Button onClick={handleCreateLabel}>Create</Button>
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
