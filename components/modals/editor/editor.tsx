"use client";

import { useState } from "react";

import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  type EditorInstance,
  EditorRoot,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
  ImageResizer,
  type JSONContent,
  Placeholder,
} from "novel";

import {
  slashCommand,
  suggestionItems,
} from "@/components/modals/editor/slash-command";
import EditorMenu from "@/components/modals/editor/editor-menu";
import { uploadFn } from "@/components/modals/editor/image-upload";
import { defaultExtensions } from "@/components/modals/editor/extensions";
import { TextButtons } from "@/components/modals/editor/selectors/text-buttons";
import { LinkSelector } from "@/components/modals/editor/selectors/link-selector";
import { NodeSelector } from "@/components/modals/editor/selectors/node-selector";
import { MathSelector } from "@/components/modals/editor/selectors/math-selector";
import { ColorSelector } from "@/components/modals/editor/selectors/color-selector";

import { Separator } from "@/components/ui/separator";
import { HighlightSelector } from "./selectors/highlight-selector";

const hljs = require("highlight.js");

const extensions = [...defaultExtensions, slashCommand];

export const defaultEditorContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
};

interface EditorProps {
  initialValue?: JSONContent;
  onChange: (content: string) => void;
}

export default function Editor({ initialValue, onChange }: EditorProps) {
  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [openHighlight, setopenHighlight] = useState(false);

  const [openLink, setOpenLink] = useState(false);
  const [openAI, setOpenAI] = useState(false);

  // apply code highlight
  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, "text/html");
    doc.querySelectorAll("pre code").forEach((el) => {
      // @ts-ignore
      // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
      hljs.highlightElement(el);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  return (
    <div className="relative w-full max-w-screen-lg h-[750px] overflow-y-auto bg-neutral-100 pl-4 pt-4">
      <EditorRoot>
        <EditorContent
          immediatelyRender={false}
          initialContent={initialValue}
          extensions={extensions}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) =>
              handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) =>
              handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                "prose dark:prose-invert prose-headings:font-title font-default focus:outline-none",
            },
          }}
          onUpdate={({ editor }) => {
            // When ever there is a change
            // highlight the code block within the content
            const htmlContent = editor.getHTML();
            highlightCodeblocks(htmlContent);

            // pass the content as json to store in the database

            const editorContent = editor.getJSON();
            const content = JSON.stringify(editorContent);

            onChange(content);
          }}
          slotAfter={<ImageResizer />}
        >
          <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">
              No results
            </EditorCommandEmpty>
            {/* Command list can be customized */}
            <EditorCommandList>
              {suggestionItems.map((item: any) => (
                <EditorCommandItem
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                  key={item.title}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>
          {/* ToDo AI code generation */}
          <EditorMenu open={openAI} onOpenChange={setOpenAI}>
            <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} />

            <Separator orientation="vertical" />
            <LinkSelector open={openLink} onOpenChange={setOpenLink} />

            <Separator orientation="vertical" />
            <MathSelector />

            <Separator orientation="vertical" />
            <TextButtons />

            <Separator orientation="vertical" />
            <ColorSelector open={openColor} onOpenChange={setOpenColor} />
            <HighlightSelector
              open={openHighlight}
              onOpenChange={setopenHighlight}
            />
          </EditorMenu>
        </EditorContent>
      </EditorRoot>
    </div>
  );
}
