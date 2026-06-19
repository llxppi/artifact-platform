"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SideNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: "home", label: "首页", href: "/" },
    { icon: "chat_bubble", label: "AI 助手", href: "/chat" },
    { icon: "auto_stories", label: "时光故事", href: "/scene" },
{ icon: "person", label: "个人中心", href: "/profile" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col py-8 bg-surface border-r-0 pt-24 hidden lg:flex">
      <div className="px-6 mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold">
            我
          </div>
          <div>
            <div className="text-sm font-bold text-primary">我的物语</div>
            <div className="text-xs text-secondary">数字馆长</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href) && item.href !== "/" || pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-all ${
                isActive
                  ? "bg-surface-container-low text-tertiary font-semibold rounded-r-full"
                  : "text-secondary hover:translate-x-1"
              }`}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
