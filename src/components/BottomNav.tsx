"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path);

  const navItems = [
    { href: "/", icon: "account_balance", label: "文物馆" },
    { href: "/chat", icon: "chat_bubble", label: "文物对话" },
    { href: "/scene", icon: "auto_stories", label: "时光故事" },
    { href: "/profile", icon: "person", label: "个人中心" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe pt-3 md:hidden bg-surface/80 backdrop-blur-md shadow-[0_-4px_20px_rgba(27,29,14,0.06)] rounded-t-3xl" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      {navItems.map(({ href, icon, label }) => {
        const active = href === "/" ? pathname === "/" : isActive(href);
        return (
          <Link key={href} href={href} className={`flex flex-col items-center justify-center px-3 py-1 rounded-2xl transition-all ${active ? 'text-secondary bg-surface-container-lowest' : 'text-outline'}`}>
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-[10px] font-medium mt-1">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
