"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getArtifactById } from "@/data/artifacts";
import ReactMarkdown from "react-markdown";
import SideNavNew from "@/components/SideNavNew";
import TopNav from "@/components/TopNav";
import Toast from "@/components/Toast";
import ReportButton from "@/components/ReportButton";
import QuotaWarning from "@/components/QuotaWarning";
import { checkQuota, consumeQuota } from "@/lib/quota";
import GlossaryText from "@/components/GlossaryText";

type ChatMode = "artifact" | "historian" | "traveler";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const artifact = getArtifactById(params.id as string);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initSentRef = useRef(false);

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `你好！我是${artifact?.nickname}，很高兴与你对话。` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const [mode, setMode] = useState<ChatMode>("artifact");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState({ remaining: 10, limit: 10 });
  const [unlockedTags, setUnlockedTags] = useState<string[]>([]);

  const KNOWLEDGE_TAGS: Record<string, string[]> = {
    "材质": ["材质", "青铜", "玉", "陶", "瓷", "铜", "铁", "金", "银", "合金"],
    "纹饰": ["纹饰", "饕餮", "云纹", "龙纹", "凤纹", "纹样", "图案", "装饰"],
    "工艺": ["铸造", "范铸", "失蜡", "烧制", "窑", "釉", "工艺", "制作"],
    "考古": ["出土", "发掘", "考古", "遗址", "地层", "发现"],
    "历史": ["朝代", "历史", "年代", "时期", "王朝", "皇帝", "礼制"],
    "铭文": ["铭文", "文字", "刻字", "铭刻", "记载"],
    "修复": ["修复", "保护", "病害", "修缮", "保存"],
    "功用": ["功用", "用途", "祭祀", "礼器", "日用", "陪葬"],
  };

  const extractTags = (content: string) => {
    const newTags: string[] = [];
    for (const [tag, keywords] of Object.entries(KNOWLEDGE_TAGS)) {
      if (keywords.some(k => content.includes(k))) newTags.push(tag);
    }
    if (newTags.length) setUnlockedTags(prev => Array.from(new Set([...prev, ...newTags])));
  };

  const modeConfig = {
    artifact: { name: "文物模式", icon: "auto_awesome", desc: "情感互动和趣味了解", greeting: `你好！我是${artifact?.nickname}，很高兴与你对话。` },
    historian: { name: "专家视角", icon: "school", desc: "严谨专业，深度知识查询", greeting: `您好，我是文物专家，很高兴为您专业讲解${artifact?.name}。` },
    traveler: { name: "穿越旅行者", icon: "explore", desc: "沉浸体验和故事创作", greeting: `嘿！我刚穿越到${artifact?.dynasty}，正在体验${artifact?.name}的故事！` }
  };

  const quickQuestions = ["你是怎么被发现的？", "你见过哪些历史大事？", "你最引以为傲的是什么？", "你的制作工艺是怎样的？"];

  const getSuggestions = (mode: ChatMode): string[] => {
    const combined = [
      "你最难忘的一段记忆是什么？", "你见过哪些有趣的人？", "你最想告诉现代人什么？", "你是怎么被制作出来的？", "你经历过哪些朝代更迭？",
      "这件文物有哪些学术争议？", "同时期还有哪些重要文物？", "它的出土背景是怎样的？", "它对后世有什么影响？", "相关的考古发现有哪些？",
    ];
    const traveler = ["带我去看看当时的市井生活", "那个时代的人们怎么娱乐？", "我能亲眼见到它被制作吗？", "当时的皇宫是什么样的？", "普通百姓的一天是怎样的？"];
    const pool = mode === "traveler" ? traveler : combined;
    return pool.sort(() => Math.random() - 0.5).slice(0, 3);
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
    const userId = userData ? JSON.parse(userData).id : "guest";
    const check = checkQuota(userId, "chat");
    setQuotaInfo({ remaining: check.remaining, limit: check.limit });
    const question = searchParams.get("q");
    if (question && !initSentRef.current) {
      initSentRef.current = true;
      setInput(question);
      setTimeout(() => sendMessage(question), 500);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    setShowModeMenu(false);
    setMessages([{ role: "assistant", content: modeConfig[newMode].greeting }]);
    setToast({ message: `已切换到${modeConfig[newMode].name}`, type: "success" });
  };

  const sendMessage = async (text?: string) => {
    const userMsg = text || input;
    if (!userMsg.trim() || loading) return;
    const userId = user?.id || "guest";
    const quotaCheck = checkQuota(userId, "chat");
    if (!quotaCheck.allowed) { setToast({ message: "今日对话次数已用完，明日再来！", type: "error" }); return; }
    const newMessage: Message = { role: "user", content: userMsg };
    const currentMessages: Message[] = [...messages, newMessage];
    setInput("");
    setMessages(currentMessages);
    setLoading(true);
    try {
      consumeQuota(userId, "chat");
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifactId: artifact?.id, messages: currentMessages, mode }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      const queue: string[] = [];
      let displayed = "";
      let streamDone = false;

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      // 打字机：每帧消费队列，速度随积压自适应
      const tick = () => {
        if (queue.length > 0) {
          // 积压多时加速，保证不落后太多
          const batch = Math.min(queue.length, Math.max(3, Math.floor(queue.length / 8)));
          displayed += queue.splice(0, batch).join("");
          setMessages(prev => { const m = [...prev]; m[m.length - 1] = { ...m[m.length - 1], content: displayed }; return m; });
        }
        if (!streamDone || queue.length > 0) {
          requestAnimationFrame(tick);
        } else {
          extractTags(displayed);
          setLoading(false);
          fetch("/api/chat/suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: displayed, mode }),
          }).then(r => r.json()).then(({ suggestions: dynamic }) => {
            if (dynamic?.length) {
              setMessages(prev => { const m = [...prev]; m[m.length - 1] = { ...m[m.length - 1], suggestions: dynamic }; return m; });
            }
          }).catch(() => {});
        }
      };
      requestAnimationFrame(tick);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const content = JSON.parse(data).choices?.[0]?.delta?.content || "";
            if (content) queue.push(...content);
          } catch { /* ignore */ }
        }
      }
      streamDone = true;
      return;
    } catch {
      setToast({ message: "网络错误，请重试", type: "error" });
      setMessages(prev => { const m = [...prev]; if (m[m.length - 1]?.role === "assistant" && !m[m.length - 1].content) m.pop(); return m; });
    } finally {
      // 仅在异常时兜底
      if (loading) setLoading(false);
    }
  };

  if (!artifact) return null;

  return (
    <div className="flex h-screen overflow-hidden text-on-surface bg-surface">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar with artifact profile */}
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col py-8 bg-surface border-r-0 z-40 hidden lg:flex">
        <div className="px-8 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-xl">
            <span className="material-symbols-outlined text-on-primary text-xl">account_balance</span>
          </div>
          <h1 className="text-xl font-bold text-primary tracking-tighter">物语 ArtiFact</h1>
        </div>

        {/* Artifact profile card */}
        <div className="px-6 mb-6">
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10">
            <div className="w-full aspect-square rounded-xl mb-4 overflow-hidden bg-surface-container-high flex items-center justify-center">
              {artifact.image ? (
                <img src={artifact.image} alt={artifact.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">{artifact.emoji}</span>
              )}
            </div>
            <div className="space-y-1">
              <h2 className="font-semibold text-[19px] text-[#222222] tracking-[0.5px] leading-[1.3]" style={{ fontFamily: '"Noto Serif SC", serif' }}>{artifact.name}</h2>
              <p className="text-[13px] font-normal text-[#666666] leading-[1.4] mt-1">{artifact.dynasty} · {artifact.category}</p>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="px-2 py-1 bg-surface-container-high text-[10px] rounded text-on-surface-variant font-medium">{artifact.material}</span>
            </div>
          </div>
        </div>

        {/* 知识导航 */}
        {unlockedTags.length > 0 && (
          <div className="px-6 mb-4">
            <p className="text-[10px] text-secondary/50 font-medium tracking-widest uppercase mb-2">已解锁知识点</p>
            <div className="flex flex-wrap gap-1.5">
              {unlockedTags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-primary/10 text-primary text-[10px] rounded-full font-medium">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {[
            { icon: "home", label: "首页", href: "/" },
            { icon: "chat_bubble", label: "文物对话", href: "/chat", active: true },
            { icon: "history_edu", label: "文物档案", href: `/artifact/${artifact.id}` },
            { icon: "auto_stories", label: "时光故事", href: "/scene" },
            { icon: "person", label: "个人中心", href: "/profile" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-3 text-[14px] leading-[1.4] transition-all ${
                item.active ? "bg-surface-container-low text-[#222222] font-semibold rounded-r-full" : "text-[#444444] font-normal hover:translate-x-1"
              }`}
            >
              <span className="material-symbols-outlined" style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-6 pt-6 mt-6 border-t border-outline-variant/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary">
              {user?.name?.[0] || "我"}
            </div>
            <div>
              <div className="text-sm font-bold text-primary">{user?.name || "数字馆长"}</div>
              <div className="text-[10px] text-secondary">LV.4 博物学者</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main chat */}
      <main className="flex-1 lg:ml-64 h-full relative flex flex-col">
        {/* Chat header */}
        <header className="h-16 px-4 md:px-8 flex items-center justify-between bg-surface/80 backdrop-blur-md z-30 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-500/60" />
            <span className="text-sm font-medium text-secondary">正在与「{artifact.nickname}」对话中</span>
            <Link href={`/artifact/${artifact.id}`} className="lg:hidden flex items-center gap-1 text-xs text-outline hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[14px]">history_edu</span>
              文物档案
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
                <button
                onClick={() => setShowModeMenu(!showModeMenu)}
                className="px-3 md:px-4 py-2 text-sm bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">{modeConfig[mode].icon}</span>
                <span className="hidden md:inline">{modeConfig[mode].name}</span>
              </button>
              {showModeMenu && (
                <div className="absolute top-12 right-0 z-50 bg-surface-container-lowest rounded-2xl shadow-lg overflow-hidden w-64 border border-outline-variant/10">
                  {(Object.keys(modeConfig) as ChatMode[]).map((m) => (
                    <button key={m} onClick={() => handleModeChange(m)} className={`w-full px-5 py-4 text-left hover:bg-surface-container transition-colors ${mode === m ? "bg-primary/5" : ""}`}>
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-0.5 text-base">{modeConfig[m].icon}</span>
                        <div>
                          <div className="font-bold text-on-surface text-sm flex items-center gap-2">{modeConfig[m].name}{mode === m && <span className="text-xs text-primary">✓</span>}</div>
                          <div className="text-xs text-secondary mt-0.5">{modeConfig[m].desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="p-2 text-secondary hover:text-primary transition-colors" onClick={() => setToast({ message: "该功能还未实现", type: "info" })}>
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </header>

        {/* Messages */}
        <section className="flex-1 overflow-y-auto px-6 lg:px-10 pt-10 pb-52 md:pb-36 scroll-hidden">
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse max-w-[85%] ml-auto" : "max-w-[85%]"}`}>
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold overflow-hidden border ${
                  msg.role === "assistant" ? "bg-surface-container-high border-outline-variant/10 text-xl" : "bg-primary-container border-primary/10 text-primary"
                }`}>
                  {msg.role === "assistant" ? (
                    artifact.image ? <img src={artifact.image} alt={artifact.name} className="w-full h-full object-cover" /> : artifact.emoji
                  ) : (user?.name?.[0] || "我")}
                </div>
                <div className="space-y-2">
                  {(msg.content || (loading && i === messages.length - 1)) && <div className={`rounded-2xl text-[15px] shadow-sm ${
                    msg.role === "user"
                      ? "bg-[#9BA3AF25] text-[#222222] rounded-br-none"
                      : "bg-[#F0EDE8] text-[#333333] rounded-bl-none"
                  }`} style={{ padding: "14px 18px" }}>
                    {msg.role === "assistant" ? (
                      <div className="font-normal leading-[1.6] text-[#333333] tracking-[0.3px] [&_p:empty]:hidden [&_p]:mb-3 [&_p]:last:mb-0">
                        <ReactMarkdown components={{
                          p: ({ children }) => {
                            const text = Array.isArray(children)
                              ? children.map(c => (typeof c === "string" ? c : "")).join("")
                              : typeof children === "string" ? children : "";
                            return <p><GlossaryText text={text} /></p>;
                          }
                        }}>{msg.content || ""}</ReactMarkdown>
                        {loading && i === messages.length - 1 && (
                          <span className="inline-block w-0.5 h-5 bg-tertiary ml-0.5 animate-pulse" />
                        )}
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none font-medium leading-[1.6] text-[#222222] tracking-[0.3px]">
                        <ReactMarkdown components={{
                          p: ({ children }) => {
                            const text = Array.isArray(children)
                              ? children.map(c => (typeof c === "string" ? c : "")).join("")
                              : typeof children === "string" ? children : "";
                            return <p><GlossaryText text={text} /></p>;
                          }
                        }}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                    {msg.role === "assistant" && msg.content && (
                      <div className="mt-3 pt-3 border-t border-outline-variant/10 flex items-center justify-end">
                        <ReportButton artifactId={artifact.id} contentType="chat" content={msg.content} />
                      </div>
                    )}
                  </div>}
                  {msg.role === "assistant" && msg.suggestions && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.suggestions.map((q, j) => (
                        <button key={j} onClick={() => sendMessage(q)} className="px-3 py-1.5 text-[13px] font-normal leading-[1.4] text-[#555555] rounded-full bg-surface-container-low border border-outline-variant/20 hover:text-primary hover:bg-surface-container transition-all">
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* Input area */}
        <footer className="absolute bottom-0 left-0 w-full px-6 pt-6 pb-24 md:pb-6 lg:px-8 lg:pt-8 bg-gradient-to-t from-surface via-surface/95 to-transparent pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto space-y-3">
            <QuotaWarning type="chat" remaining={quotaInfo.remaining} limit={quotaInfo.limit} />
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)} className="px-4 py-2 text-[13px] font-normal leading-[1.4] text-[#555555] rounded-full bg-surface-container-low border border-outline-variant/20 hover:text-primary hover:bg-surface-container transition-all">
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 bg-surface-container-low/90 backdrop-blur-xl p-3 rounded-2xl shadow-[0_10px_40px_rgba(49,51,48,0.08)] border border-outline-variant/10">
              <div className="flex-1">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
                  placeholder={`输入你的问题，开启时光对话...`}
                  disabled={loading}
                  className="w-full h-12 bg-transparent border-none focus:ring-0 text-[#222222] placeholder:text-[#999999] placeholder:font-light text-[14px] font-normal outline-none"
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="bg-primary hover:bg-primary-dim text-on-primary w-12 h-12 flex items-center justify-center rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            <div className="flex justify-center gap-6">
              <span className="text-[10px] text-secondary/40 font-medium tracking-widest uppercase">Artifact Intelligence v2.0</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Right tools panel */}
      <aside className="fixed right-0 top-0 h-full w-12 flex-col items-center py-10 bg-surface/30 backdrop-blur-sm border-l border-outline-variant/5 z-20 hidden lg:flex">
        <div className="flex flex-col gap-8 text-secondary/60">
          <Link href={`/scene/${artifact.id}`} title="生成故事" className="hover:text-tertiary transition-colors">
            <span className="material-symbols-outlined text-xl">auto_stories</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}
