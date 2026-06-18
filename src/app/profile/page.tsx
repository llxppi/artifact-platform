"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import SideNavNew from "@/components/SideNavNew";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <TopNav />
      <SideNavNew />

      <main className="ml-0 lg:ml-64 pt-20 pb-20 max-w-[1200px] mx-auto px-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-80">
            <div className="bg-surface-container-low rounded-2xl p-8 space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center text-4xl font-bold text-primary mb-4">
                  {user.name?.[0] || '我'}
                </div>
                <h2 className="text-xl font-bold text-primary">{user.name || '数字馆长'}</h2>
                <p className="text-sm text-secondary">LV.4 博物学者</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">对话次数</span>
                  <span className="font-semibold text-primary">128</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">收藏文物</span>
                  <span className="font-semibold text-primary">24</span>
                </div>
              </div>

              <button onClick={logout} className="w-full py-3 bg-surface-container text-secondary rounded-xl font-semibold hover:bg-surface-container-high transition-all">
                退出登录
              </button>
            </div>
          </aside>
          <section className="flex-1">
            <div className="mb-6 flex gap-4 border-b border-outline-variant/10">
              {["overview", "favorites", "history"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-4 font-semibold transition-all ${
                    activeTab === tab
                      ? "text-primary border-b-2 border-tertiary"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  {tab === "overview" && "概览"}
                  {tab === "favorites" && "收藏"}
                  {tab === "history" && "历史"}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface-container-low rounded-xl p-6">
                    <h3 className="text-lg font-bold text-primary mb-4">最近活动</h3>
                    <p className="text-sm text-secondary">暂无活动记录</p>
                  </div>
                  <div className="bg-surface-container-low rounded-xl p-6">
                    <h3 className="text-lg font-bold text-primary mb-4">成就徽章</h3>
                    <p className="text-sm text-secondary">暂无徽章</p>
                  </div>
                </div>
              )}
              {activeTab === "favorites" && (
                <div className="bg-surface-container-low rounded-xl p-6">
                  <p className="text-sm text-secondary">暂无收藏</p>
                </div>
              )}
              {activeTab === "history" && (
                <div className="bg-surface-container-low rounded-xl p-6">
                  <p className="text-sm text-secondary">暂无历史记录</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
