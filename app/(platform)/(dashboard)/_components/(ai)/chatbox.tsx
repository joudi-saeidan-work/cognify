import { cn } from "@/lib/utils";
import { useChat, Message } from "ai/react"; // vercel ai
import { Bot, CircleX, Trash } from "lucide-react";

import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useRef } from "react";

interface AIChatBoxProps {
  open: boolean;
  onClose: () => void;
}

const ChatBox = ({ open, onClose }: AIChatBoxProps) => {
  const {
    messages, //chat messages
    input, // what the user enters
    handleInputChange, // updates input
    handleSubmit, // send msgs
    setMessages, // make them empty or not
    isLoading,
    error,
  } = useChat(); // makes a request to /api/chat by default so it sends the chat messages there..

  const inputRef = useRef<HTMLInputElement>(null); // we want to focus the input
  const scrollRef = useRef<HTMLDivElement>(null); // we want to to auto scroll to the view port

  // auto scrolling when text is long
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // focus when the chat is open
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  });

  // this will help us with the loading state
  const lastMessageIsUser = messages[messages.length - 1]?.role === "user";
  return (
    <div
      className={cn(
        "bottom-0 right-0 z-70 w-full max-w-[500px] p-1 xl:right-36",
        open ? "fixed" : "hidden"
      )}
    >
      <button onClick={onClose} className="mb-1 ms-auto block">
        <CircleX size={30} />
      </button>
      {/* chatbox   */}
      <div className="flex h-[600px] flex-col rounded bg-background border shadow-xl">
        <div className="h-full mt-3 px-3 overflow-y-auto" ref={scrollRef}>
          {messages.map((message) => (
            <ChatMessage message={message} key={message.id} />
          ))}
          {isLoading && lastMessageIsUser && (
            <ChatMessage
              message={{ role: "assistant", content: "Thinking.." }}
            />
          )}
          {error && (
            <ChatMessage
              message={{
                role: "assistant",
                content: "Something went wrong. Please try again.",
              }}
            />
          )}
          {!error && messages.length === 0 && (
            <div className="flex h-full items-center justify-center gap-3">
              <Bot />
              Ask me questions about your notes
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="m-3 flex gap-1 rounded">
          <Button
            title="Clear chat"
            variant="outline"
            size="icon"
            className="shrink-0"
            type="button"
            onClick={() => {
              setMessages([]);
            }}
          >
            <Trash />
          </Button>
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="say something..."
            ref={inputRef}
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
};

// need to render the messages in the ui

interface ChatMessageProps {
  message: Pick<Message, "role" | "content">; // we only want the role and the content from the Message type
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const { role, content } = message;
  const { user } = useUser();
  const isAIMessage = role === "assistant";

  return (
    <div
      className={cn(
        "mb-3 flex items-center",
        isAIMessage ? "me-5 justify-start " : "ms-5 justify-end"
      )}
    >
      {/* if it's an ai message then we want to render the bot icon and not shrink it */}
      {isAIMessage && <Bot className="mr-2 shrink-0" />}
      <p
        className={cn(
          "whitespace-pre-line rounded-md border px-3 py-2",
          isAIMessage ? "bg-background" : "bg-primary text-primary-foreground"
        )}
      >
        {content}
      </p>
      {!isAIMessage && user?.imageUrl && (
        <Image
          src={user.imageUrl}
          alt="User Image"
          width={100}
          height={100}
          className="ml-2 rounded-full w-10 h-10 object-cover"
        />
      )}
    </div>
  );
};
export default ChatBox;
