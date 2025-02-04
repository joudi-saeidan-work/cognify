import { cn } from "@/lib/utils";
import { useChat, Message } from "ai/react";
import { Bot, CircleX, Trash, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { AIToolConfig } from "./ai-tools-config";

interface NoteWhizProps {
  open: boolean;
  onClose: () => void;
  config: AIToolConfig;
}

const NoteWhiz = ({ open, onClose, config }: NoteWhizProps) => {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
    error,
  } = useChat({ api: config.apiRoute });

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [open]);

  // Regain focus
  const handleBlur = () => {
    setTimeout(() => {
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    }, 50);
  };

  const lastMessageIsUser = messages[messages.length - 1]?.role === "user";

  return (
    <div
      className={cn(
        "bottom-0 right-0 z-70 w-full max-w-[500px] p-1 xl:right-36",
        open ? "fixed" : "hidden"
      )}
    >
      <div className="flex h-[600px] flex-col rounded-lg bg-white border border-gray-100 shadow-sm">
        {/* Header */}
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 mb-2 mr-2 ms-auto transition-colors"
        >
          ✖
        </button>

        {/* Chat Messages */}
        <div className="h-full mt-2 px-4 overflow-y-auto" ref={scrollRef}>
          {messages.map((message) => (
            <ChatMessage message={message} key={message.id} />
          ))}

          {isLoading && lastMessageIsUser && <LoadingMessage />}

          {!messages.length && <EmptyState message={config.initialMessage} />}

          {error && <ErrorMessage error={error} />}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="m-4 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => setMessages([])}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 border-gray-200"
          >
            <Trash className="h-4 w-4" />
          </Button>

          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            ref={inputRef}
            disabled={isLoading}
            onBlur={handleBlur}
            className="flex-grow border-gray-200 focus:ring-2 focus:ring-blue-400"
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
};

// Subcomponents
interface ChatMessageProps {
  message: Pick<Message, "role" | "content">;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const { user } = useUser();
  const isAIMessage = message.role === "assistant";

  return (
    <div
      className={cn(
        "mb-4 flex items-center",
        isAIMessage ? "me-5 justify-start" : "ms-5 justify-end"
      )}
    >
      {isAIMessage && <Bot className="mr-2 shrink-0 h-6 w-6 text-gray-600" />}

      <div
        className={cn(
          "rounded-lg border px-3 py-2 max-w-[80%]",
          isAIMessage
            ? "bg-gray-50 border-gray-100"
            : "bg-blue-50 border-blue-100 text-gray-700"
        )}
      >
        <p className="whitespace-pre-line">{message.content}</p>
      </div>

      {!isAIMessage && user?.imageUrl && (
        <Image
          src={user.imageUrl}
          alt="User avatar"
          width={32}
          height={32}
          className="ml-2 rounded-full w-8 h-8 object-cover"
        />
      )}
    </div>
  );
};

const LoadingMessage = () => {
  return (
    <div className="mb-4 flex items-center me-5 justify-start">
      <Bot className="mr-2 shrink-0 h-6 w-6 text-gray-600" />
      <div className="rounded-lg border px-3 py-2 bg-gray-50 border-gray-100">
        <div className="flex gap-2 text-gray-600">
          <Loader2 className="animate-spin" />
          Thinking...
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ message }: { message: any }) => {
  return (
    <div className="flex h-full items-center justify-center gap-3 text-gray-500">
      <Bot className="text-gray-600" />
      {message}
    </div>
  );
};

const ErrorMessage = ({ error }: { error: Error }) => {
  return (
    <div className="p-2 text-red-500 text-sm bg-red-50 rounded-lg border border-red-100">
      Error: {error.message || "Failed to process request"}
    </div>
  );
};

export default NoteWhiz;
