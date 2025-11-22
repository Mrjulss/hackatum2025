import Image from "next/image";
import { Message } from "../types";
import { useMessageTyping } from "../hooks/useMessageTyping";

type ChatMessageProps = {
  message: Message;
};

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const shouldAnimate = !isUser && message.isNew;
  
  const { displayedText, isTyping } = useMessageTyping(
    message.content,
    shouldAnimate || false,
    30
  );

  return (
    <div className={`mb-4 flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}>
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white p-1 mb-1">
          <Image
            src="/hero-avatar.svg"
            alt="City Hero"
            width={40}
            height={40}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`max-w-[70%] px-5 py-3 shadow-md ${
          isUser
            ? "bg-white text-[#1b98d5] rounded-3xl rounded-br-md"
            : "bg-white/95 text-gray-800 rounded-3xl rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed">
          {shouldAnimate ? displayedText : message.content}
          {isTyping && (
            <span className="inline-block w-1 h-4 ml-1 bg-gray-600 animate-pulse"></span>
          )}
        </p>
        {message.timestamp && (
          <span className="text-xs opacity-60 mt-1 block">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};

