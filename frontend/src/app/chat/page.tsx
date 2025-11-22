import Image from "next/image";

export default function ChatPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#1b98d5]">
      {/* Main chat area */}
      <main className="flex-1 p-6">
        {/* Chat content will go here */}
      </main>

      {/* Logo in lower left corner */}
      <div className="fixed bottom-6 left-6">
        <Image
          src="/logo.svg"
          alt="München Logo"
          width={200}
          height={40}
          priority
        />
      </div>
    </div>
  );
}

