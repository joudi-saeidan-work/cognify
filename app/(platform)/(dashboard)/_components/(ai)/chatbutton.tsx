import { useState } from "react";
import { Bot } from "lucide-react";
import ChatBox from "./chatbox";
import { Button } from "@/components/ui/button";

const ChatButton = () => {
  const [chatBoxOpen, setChatBoxOpen] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setChatBoxOpen(true);
        }}
        className="font-semibold"
      >
        {/* ToDo make this a drop down with all the ai tool kit you want to have */}
        <Bot size={20} className="mr-2 " />
        Get assistance
      </Button>
      <ChatBox open={chatBoxOpen} onClose={() => setChatBoxOpen(false)} />
    </>
  );
};

export default ChatButton;
