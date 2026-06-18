"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("两次密码不一致");
      return;
    }
    if (form.password.length < 6) {
      setError("密码至少6位");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "注册失败");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <main className="relative z-10 w-full max-w-[480px] bg-surface-container-lowest rounded-[20px] shadow-[0_10px_40px_rgba(49,51,48,0.05)] p-12 border border-outline-variant/10">
        <div className="flex flex-col items-center mb-10">
          <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-low text-tertiary">
            <span className="material-symbols-outlined text-3xl">account_balance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-on-surface">
            物语 <span className="text-primary/60 font-light ml-1">ArtiFact</span>
          </h1>
          <p className="text-secondary text-sm mt-2 tracking-wide font-light">创建你的数字馆藏账号</p>
        </div>

        <form className="w-full space-y-5" onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <input
              className="w-full h-11 pl-12 pr-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline-variant text-sm focus:ring-1 focus:ring-primary/20 focus:bg-surface-container transition-all"
              placeholder="昵称"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
            <input
              className="w-full h-11 pl-12 pr-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline-variant text-sm focus:ring-1 focus:ring-primary/20 focus:bg-surface-container transition-all"
              placeholder="电子邮箱"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <input
              className="w-full h-11 pl-12 pr-12 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline-variant text-sm focus:ring-1 focus:ring-primary/20 focus:bg-surface-container transition-all"
              placeholder="设置密码（至少6位）"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              className="absolute inset-y-0 right-4 flex items-center text-outline hover:text-primary transition-colors"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[20px]">lock_reset</span>
            </div>
            <input
              className="w-full h-11 pl-12 pr-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline-variant text-sm focus:ring-1 focus:ring-primary/20 focus:bg-surface-container transition-all"
              placeholder="确认密码"
              type={showPassword ? "text" : "password"}
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            className="w-full h-12 bg-[#9BA3AF] hover:bg-[#868e9a] disabled:opacity-60 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
            type="submit"
            disabled={loading}
          >
            <span>{loading ? "注册中..." : "立即注册"}</span>
            {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-secondary">
            已有账号？
            <Link className="text-tertiary hover:underline ml-1 font-medium" href="/login">
              立即登录
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
