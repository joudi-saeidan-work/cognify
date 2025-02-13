"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { defaultImages } from "@/constants/images";
import { coverImageOptions } from "@/constants/colors";
import Link from "next/link";
import { FormErrors } from "./form-errors";
import { useParams } from "next/navigation";
import { useAction } from "@/hooks/use-actions";

import { toast } from "sonner";
import { updateBoard } from "@/actions/update-board";
import { revalidatePath } from "next/cache";

export const FormPicker = () => {
  const { pending } = useFormStatus();

  const [selectedOption, setSelectedOption] = useState<{
    type: "image" | "color";
    value: string;
  } | null>(null);

  const limitedImages = defaultImages.slice(0, 9);

  const params = useParams();

  const { execute: executeUpdateBoard } = useAction(updateBoard, {
    onSuccess: (data) => {
      toast.success("Board Updated!");
      revalidatePath(`/board/${data.id}`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const onClick = () => {
    const id = params.booardId as string;
    const image =
      selectedOption?.type == "image" ? selectedOption.value : undefined;
    const color =
      selectedOption?.type == "color" ? selectedOption.value : undefined;
    executeUpdateBoard({ id, image, color });
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-2 mb-2 overflow-y-auto">
        {/* Displaying Images */}
        {limitedImages.map((image) => (
          <div
            key={image.id}
            className={cn(
              "cursor-pointer relative aspect-video group hover:opacity-75 transition bg-muted",
              pending && "opacity-50 hover:opacity-50 cursor-auto"
            )}
            onClick={() => {
              if (pending) return;
              setSelectedOption({ type: "image", value: image.id });
              onClick();
            }}
          >
            <Image
              src={image.urls.thumb}
              alt="Unsplash image"
              className="object-cover rounded-sm"
              fill
            />
            {selectedOption?.type === "image" &&
              selectedOption.value === image.id && (
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
        {/* Displaying Colors */}
        {coverImageOptions.map((color) => (
          <div
            key={color.id}
            className={cn(
              `cursor-pointer relative aspect-video group hover:opacity-75 transition bg-muted`,
              pending && "opacity-50 hover:opacity-50 cursor-auto"
            )}
            onClick={() => {
              if (pending) return;
              setSelectedOption({ type: "color", value: color.background });
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
  );
};
