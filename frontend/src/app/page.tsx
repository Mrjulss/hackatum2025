import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <main className="flex min-h-screen w-full flex-col items-center justify-center px-8">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center mb-16">
          <h1 className="text-8xl font-bold text-[#1b98d5] tracking-tight mb-8 text-center">
            BE A CITY HERO
          </h1>
          
          {/* In cooperation with TUM */}
          <div className="flex items-center gap-4 mb-12">
            <span className="text-xl text-gray-600">in cooperation with</span>
            <Image
              src="/tum-logo.svg"
              alt="TUM Logo"
              width={120}
              height={35}
              priority
            />
          </div>

          {/* Search Input */}
          <div className="w-full max-w-2xl">
            <Link href="/chat">
              <input
                type="text"
                placeholder="Start your search..."
                className="w-full px-6 py-4 text-lg border-2 border-[#1b98d5] rounded-full focus:outline-none focus:ring-2 focus:ring-[#1b98d5] focus:border-transparent transition-all cursor-pointer"
                readOnly
              />
            </Link>
          </div>
        </div>

        {/* München Logo in lower left */}
        <div className="fixed bottom-6 left-6">
          <Image
            src="/logo.svg"
            alt="München Logo"
            width={200}
            height={40}
            priority
          />
        </div>
      </main>
    </div>
  );
}
