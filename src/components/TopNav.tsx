"use client";

import Link from "next/link";

export default function TopNav() {
  return (
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 md:px-8 py-4 bg-[#fbf9f6]/80 backdrop-blur-md z-50 shadow-[0_10px_40px_rgba(49,51,48,0.05)]">
      <Link href="/" className="text-2xl font-bold text-primary tracking-tighter">
        物语 ArtiFact
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/login" className="px-6 py-2 bg-primary text-on-primary rounded-md font-medium hover:bg-primary-dim transition-all duration-300">
          登录
        </Link>
      </div>
    </header>
  );
}
