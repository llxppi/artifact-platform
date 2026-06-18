"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function SideNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path);

  return (
    <nav className="hidden md:flex flex-col h-screen py-8 fixed left-0 top-0 w-64 border-r border-outline-variant/15 bg-surface-container-low z-40">
      <div className="px-8 mb-12">
        <Link href="/">
          <h1 className="text-xl font-black text-primary tracking-widest font-serif">物语 ArtiFact</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-outline mt-1">THE DIGITAL INKSTONE</p>
        </Link>
      </div>
      <div className="flex-1 space-y-1">
        <Link
          href="/"
          className={`flex items-center pl-8 py-3 transition-all duration-300 ${
            isActive('/') && pathname === '/'
              ? 'text-secondary font-bold bg-surface-container-lowest rounded-l-full ml-4 pl-4'
              : 'text-outline hover:text-primary hover:translate-x-1'
          }`}
        >
          <span className="material-symbols-outlined mr-3">explore</span>
          <span className="text-sm font-serif tracking-tight">探索广场</span>
        </Link>
        <Link
          href="/chat"
          className={`flex items-center pl-8 py-3 transition-all duration-300 ${
            isActive('/chat') || isActive('/scene')
              ? 'text-secondary font-bold bg-surface-container-lowest rounded-l-full ml-4 pl-4'
              : 'text-outline hover:text-primary hover:translate-x-1'
          }`}
        >
          <span className="material-symbols-outlined mr-3">chat_bubble</span>
          <span className="text-sm font-serif tracking-tight">互动体验</span>
        </Link>
        <a className="flex items-center text-outline pl-8 py-3 hover:text-primary hover:translate-x-1 transition-all duration-300" href="#">
          <span className="material-symbols-outlined mr-3">museum</span>
          <span className="text-sm font-serif tracking-tight">博古馆</span>
        </a>
        <Link
          href={mounted && user ? "/profile" : "/auth"}
          className="flex items-center text-outline pl-8 py-3 hover:text-primary hover:translate-x-1 transition-all duration-300"
        >
          <span className="material-symbols-outlined mr-3">person</span>
          <span className="text-sm font-serif tracking-tight">{mounted && user ? user.name : '登录'}</span>
        </Link>
      </div>
      <div className="px-8 pt-6 space-y-4">
        <button className="w-full py-3 bg-secondary text-on-secondary rounded-lg font-bold text-sm shadow-sm hover:opacity-90 transition-opacity">
          解锁文物
        </button>
        <div className="space-y-1 pt-4">
          <a className="flex items-center text-outline text-sm hover:text-primary py-2 transition-colors" href="#">
            <span className="material-symbols-outlined mr-3 text-lg">settings</span>
            设置
          </a>
          <a className="flex items-center text-outline text-sm hover:text-primary py-2 transition-colors" href="#">
            <span className="material-symbols-outlined mr-3 text-lg">help_outline</span>
            帮助
          </a>
        </div>
      </div>
    </nav>
  );
}
