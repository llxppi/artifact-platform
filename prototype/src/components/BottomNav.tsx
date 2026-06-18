"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 md:hidden bg-surface/80 backdrop-blur-md shadow-[0_-4px_20px_rgba(27,29,14,0.06)] rounded-t-3xl">
      <Link href="/" className={`flex flex-col items-center justify-center ${isActive('/') && pathname === '/' ? 'text-secondary' : 'text-outline'}`}>
        <span className="material-symbols-outlined">account_balance</span>
        <span className="text-[10px] font-medium mt-1">探索</span>
      </Link>
      <Link href="/chat" className={`flex flex-col items-center justify-center ${isActive('/chat') || isActive('/scene') ? 'text-secondary bg-surface-container-lowest rounded-2xl px-4 py-1' : 'text-outline'}`}>
        <span className="material-symbols-outlined">chat_bubble</span>
        <span className="text-[10px] font-medium mt-1">互动</span>
      </Link>
      <a className="flex flex-col items-center justify-center text-outline" href="#">
        <span className="material-symbols-outlined">stars</span>
        <span className="text-[10px] font-medium mt-1">广场</span>
      </a>
      <Link href="/profile" className="flex flex-col items-center justify-center text-outline">
        <span className="material-symbols-outlined">person</span>
        <span className="text-[10px] font-medium mt-1">我的</span>
      </Link>
    </nav>
  );
}
