"use client";

import Image from "next/image";
import { useTypingAnimation } from "./hooks/useTypingAnimation";
import { useChat } from "./hooks/useChat";
import { HeroSection } from "./components/HeroSection";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import { RefiningMode } from "./components/RefiningMode";
import { ResultsView } from "./components/ResultsView";
import { LoadingTransition } from "./components/LoadingTransition";

export default function ChatPage() {
  const placeholder = useTypingAnimation(
    "How do you want to help? Tell us your idea...",
    100
  );
  const { messages, isLoading, chatMode, isTransitioning, sendMessage } = useChat();

  const showHero = messages.length === 0;
  const showRefiningBanner = chatMode === "refining" && messages.length > 0;
  const showResults = chatMode === "finished" && !isTransitioning;
  const showSplitView = showResults || isTransitioning;

  return (
    <div className="flex h-screen bg-[#1b98d5] transition-all duration-[2000ms]">
      {/* Results Section - Left Side */}
      <div 
        className={`transition-all duration-[2000ms] ease-in-out ${
          showSplitView ? 'w-[70%] opacity-100' : 'w-0 opacity-0'
        } overflow-hidden`}
      >
        {isTransitioning ? (
          <LoadingTransition />
        ) : showResults ? (
          <ResultsView />
        ) : null}
      </div>

      {/* Chat Section - Transitions from center to right */}
      <div 
        className={`flex flex-col transition-all duration-[2000ms] ease-in-out bg-[#1b98d5] ${
          showSplitView 
            ? 'w-[30%] border-l-2 border-white/30' 
            : 'w-full'
        }`}
      >
        {/* Main chat area */}
        <main className={`flex flex-1 items-center justify-center transition-all duration-[2000ms] ${
          showSplitView ? 'px-2 py-4' : 'px-4 py-8'
        }`}>
          <div 
            className={`flex flex-col w-full transition-all duration-[1500ms] ${
              showSplitView ? 'max-w-full' : 'max-w-4xl'
            } ${
              showHero ? "justify-center items-center" : "justify-end"
            }`}
          >
            {/* Hero Section - only show when no messages */}
            {showHero && !showSplitView && (
              <div className="animate-fadeIn">
                <HeroSection />
              </div>
            )}

            {/* Refining Mode Banner */}
            {showRefiningBanner && (
              <div className="animate-slideDown">
                <RefiningMode />
              </div>
            )}

            {/* Compact header for split view */}
            {showSplitView && (
              <div className="mb-4 px-2 animate-fadeIn">
                <h2 className="text-lg font-bold text-white mb-1">Chat</h2>
                <p className="text-sm text-white/90">
                  Ich habe deine Projektidee analysiert. Soll ich dir helfen, die offenen Fragen zu klären?
                </p>
              </div>
            )}

            {/* Chat Messages */}
            <div className={`w-full transition-all duration-[2000ms] ${
              showSplitView ? 'px-2' : 'px-4'
            } ${messages.length > 0 ? 'animate-fadeIn' : ''}`}>
              <ChatMessages messages={messages} isLoading={isLoading} />
            </div>

            {/* Input with Send Button */}
            <div className={`w-full transition-all duration-[2000ms] ${
              showSplitView ? 'px-2' : 'px-4'
            }`}>
              <ChatInput
                onSend={sendMessage}
                placeholder={placeholder}
                disabled={isLoading}
              />
            </div>
          </div>
        </main>

        {/* München Logo in lower left corner - only in full view */}
        {!showSplitView && (
          <div className="fixed bottom-6 left-6 z-10 transition-opacity duration-[2000ms]">
            <Image
              src="/logo.svg"
              alt="München Logo"
              width={200}
              height={40}
              priority
            />
          </div>
        )}
      </div>
    </div>
  );
}
