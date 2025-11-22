import Image from "next/image";

export const ThinkingIndicator = () => {
  return (
    <div className="flex items-end gap-2 mb-4 animate-fadeIn">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white p-1">
        <Image
          src="/hero-avatar.svg"
          alt="City Hero"
          width={40}
          height={40}
          className="w-full h-full"
        />
      </div>
      <div className="bg-white/95 text-gray-800 px-5 py-4 rounded-3xl rounded-bl-md shadow-md">
        <div className="flex gap-1.5 items-center">
          <span 
            className="w-2.5 h-2.5 bg-[#1b98d5] rounded-full animate-bounce" 
            style={{ animationDelay: '0ms', animationDuration: '1s' }}
          ></span>
          <span 
            className="w-2.5 h-2.5 bg-[#1b98d5] rounded-full animate-bounce" 
            style={{ animationDelay: '200ms', animationDuration: '1s' }}
          ></span>
          <span 
            className="w-2.5 h-2.5 bg-[#1b98d5] rounded-full animate-bounce" 
            style={{ animationDelay: '400ms', animationDuration: '1s' }}
          ></span>
        </div>
      </div>
    </div>
  );
};


