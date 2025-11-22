import Image from "next/image";

export const HeroSection = () => {
  return (
    <div className="flex flex-col items-end mb-12">
      <h1 className="text-8xl font-bold text-white tracking-tight mb-2">
        BE A CITY HERO
      </h1>

      {/* In cooperation with TUM - smaller and right-aligned below */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-white/80">in cooperation with</span>
        <Image
          src="/getThumb.gif"
          alt="TUM Logo"
          width={60}
          height={35}
          priority
        />
      </div>
    </div>
  );
};


