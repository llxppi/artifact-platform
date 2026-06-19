"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-xl">
        <span className="material-symbols-outlined text-5xl text-secondary/40 mb-4 block">construction</span>
        <h2 className="text-xl font-bold text-primary mb-2">功能尚未开发</h2>
        <p className="text-secondary text-sm mb-6">登录功能正在建设中，敬请期待</p>
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-primary text-on-primary rounded-full text-sm font-semibold hover:bg-primary/90 transition"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
