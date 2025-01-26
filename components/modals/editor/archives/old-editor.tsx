"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import ToolBar from "./old-toolbar";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ImageResize from "tiptap-extension-resize-image";

interface TipTapProps {
  description: string;
  onChange: (richText: string) => void;
}

// initialise the editor

const TipTap = ({ description, onChange }: TipTapProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure(),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal ml-3",
        },
      }),
      BulletList.configure({
        HTMLAttributes: { class: "list-disc ml-3" },
      }),
      Highlight,
      Image,
      ImageResize,
    ], // we are using the stater kit for now
    content: description, // the content of the editor which we called description
    editorProps: {
      // how the editor looks like
      attributes: {
        class: "rounded-md border min-h-[156px] bg-slate-50 py-2 px-3",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML()); // takes whatever is in the editor and make some changes
      console.log(editor.getHTML());
    },
  });
  return (
    <div className="flex flex-col justify-stretch min-hi-[250px]">
      <ToolBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default TipTap;
