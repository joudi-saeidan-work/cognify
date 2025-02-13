"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { defaultImages } from "@/constants/images";
import { coverImageOptions } from "@/constants/colors";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAction } from "@/hooks/use-actions";

import { toast } from "sonner";
import { updateBoard } from "@/actions/update-board";

type SelectedOption = {
  type: "image" | "color";
  value: (typeof defaultImages)[number] | string; // Allow full image object or color string
};

export const FormPicker = () => {
  const params = useParams();
  const { pending } = useFormStatus();

  const [selectedOption, setSelectedOption] = useState<SelectedOption | null>(
    null
  );

  const limitedImages = defaultImages.slice(0, 9);

  const { execute: executeUpdateBoard } = useAction(updateBoard, {
    onSuccess: () => {
      toast.success("Board Updated!");
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  useEffect(() => {
    if (selectedOption) {
      const id = params.boardId as string;

      if (selectedOption.type === "image") {
        executeUpdateBoard({
          id,
          image: selectedOption.value as string,
        });
      } else if (selectedOption.type === "color") {
        executeUpdateBoard({
          id,
          color: selectedOption.value as string,
        });
      }
    }
  }, [selectedOption, params.boardId]);

  return (
    <div className="relative">
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold mb-2">Colors</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {coverImageOptions
              .filter((option) => !option.background.includes("gradient"))
              .map((color) => (
                <div
                  key={color.id}
                  className={cn(
                    `cursor-pointer relative aspect-video group hover:opacity-75 transition bg-muted`,
                    pending && "opacity-50 hover:opacity-50 cursor-auto"
                  )}
                  onClick={() => {
                    if (pending) return;
                    setSelectedOption({
                      type: "color",
                      value: color.background,
                    });
                  }}
                >
                  <div className={`h-full w-full ${color.background}`} />
                  {selectedOption?.type === "color" &&
                    selectedOption.value === color.background && (
                      <div className="absolute inset-y-0 h-full w-full bg-black/30 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                </div>
              ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold mb-2">Gradients</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {coverImageOptions
              .filter((option) => option.background.includes("gradient"))
              .map((color) => (
                <div
                  key={color.id}
                  className={cn(
                    `cursor-pointer relative aspect-video group hover:opacity-75 transition bg-muted`,
                    pending && "opacity-50 hover:opacity-50 cursor-auto"
                  )}
                  onClick={() => {
                    if (pending) return;
                    setSelectedOption({
                      type: "color",
                      value: color.background,
                    });
                  }}
                >
                  <div className={`h-full w-full ${color.background}`} />
                  {selectedOption?.type === "color" &&
                    selectedOption.value === color.background && (
                      <div className="absolute inset-y-0 h-full w-full bg-black/30 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                </div>
              ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold mb-2">Images</p>
          <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[350px]">
            {limitedImages.map((image) => (
              <div
                key={image.id}
                className={cn(
                  "cursor-pointer relative aspect-video group hover:opacity-75 transition bg-muted",
                  pending && "opacity-50 hover:opacity-50 cursor-auto"
                )}
                onClick={() => {
                  if (pending) return;
                  const imageValue = `${image.id}|${image.urls.thumb}|${image.urls.full}|${image.links.html}|${image.user.name}`;
                  setSelectedOption({
                    type: "image",
                    value: imageValue,
                  });
                }}
              >
                <Image
                  src={image.urls.thumb}
                  alt="Unsplash image"
                  className="object-cover rounded-sm"
                  fill
                />
                {selectedOption?.type === "image" &&
                  (selectedOption.value as string).startsWith(image.id) && (
                    <div className="absolute inset-y-0 h-full w-full bg-black/30 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                <Link
                  href={image.links.html}
                  target="_blank"
                  className="opacity-0 group-hover:opacity-100 absolute bottom-0 w-full text-[7px] truncate text-white hover:underline p-1 bg-black/50"
                >
                  {image.user.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
