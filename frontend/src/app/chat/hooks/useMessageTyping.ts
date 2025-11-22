import { useState, useEffect } from "react";

export const useMessageTyping = (
  fullText: string,
  isNew: boolean,
  speed: number = 30
) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // If not a new message, show full text immediately
    if (!isNew) {
      setDisplayedText(fullText);
      return;
    }

    // Otherwise, type it out
    setIsTyping(true);
    setDisplayedText("");
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, speed);

    return () => {
      clearInterval(typingInterval);
      setIsTyping(false);
    };
  }, [fullText, isNew, speed]);

  return { displayedText, isTyping };
};


