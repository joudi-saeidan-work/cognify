import { cn } from "@/lib/utils";
import { useChat, Message } from "ai/react";
import { Bot, X, Trash, Loader2 } from "lucide-react";
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
        "fixed bottom-0 right-0 z-[9999] w-full max-w-[500px] p-1 xl:right-36",
        open ? "block" : "hidden"
      )}
    >
      <div className="flex h-[600px] flex-col rounded-lg bg-card border border-border shadow-xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <config.icon className="h-5 w-5 text-primary" />
            {config.name}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3" ref={scrollRef}>
          {messages.map((message) => (
            <ChatMessage message={message} key={message.id} />
          ))}

          {isLoading && lastMessageIsUser && <LoadingMessage />}

          {!messages.length && <EmptyState message={config.initialMessage} />}

          {error && <ErrorMessage error={error} />}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-border flex gap-2"
        >
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => setMessages([])}
            disabled={isLoading}
            className="shrink-0"
            aria-label="Clear Chat"
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
            className="flex-grow"
            aria-label="Type your message..."
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="shrink-0"
            aria-label="Send"
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
        "mb-4 flex items-start",
        isAIMessage ? "justify-start" : "justify-end"
      )}
      aria-label={isAIMessage ? "AI Message" : "User Message"}
    >
      {isAIMessage && (
        <div className="mr-2 shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "rounded-lg px-3 py-2 max-w-[80%]",
          isAIMessage
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground"
        )}
        aria-label={isAIMessage ? "AI Message" : "User Message"}
      >
        <p className="whitespace-pre-line text-sm">{message.content}</p>
      </div>

      {!isAIMessage && user?.imageUrl && (
        <Image
          src={user.imageUrl}
          alt="User avatar"
          width={32}
          height={32}
          className="ml-2 rounded-full w-8 h-8 object-cover"
          aria-label="User Avatar"
        />
      )}
    </div>
  );
};

const LoadingMessage = () => {
  return (
    <div className="mb-4 flex items-start justify-start">
      <div className="mr-2 shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="rounded-lg px-3 py-1.5 bg-muted text-foreground">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Loader2 className="animate-spin h-3 w-3" />
          <span className="text-xs">Thinking...</span>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ message }: { message: any }) => {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-2 text-muted-foreground px-4">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
        <Bot className="h-5 w-5 text-primary" />
      </div>
      <p className="text-center text-sm" aria-label="Empty State Message">
        {message}
      </p>
    </div>
  );
};

const ErrorMessage = ({ error }: { error: Error }) => {
  return (
    <div className="p-2 text-red-500 text-sm bg-red-50 rounded-lg border border-red-100">
      <p aria-label="Error Message">
        Error: {error.message || "Failed to process request"}
      </p>
    </div>
  );
};

export default NoteWhiz;
