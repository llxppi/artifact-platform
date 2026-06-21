"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getArtifactById, SCENE_TEMPLATES, STYLE_OPTIONS } from "@/data/artifacts";
import TopNav from "@/components/TopNav";
import SideNavNew from "@/components/SideNavNew";

interface Branch {
  choice1: string;
  choice2: string;
  direction1: string;
  direction2: string;
}

interface SceneAct {
  act_number: number;
  act_title: string;
  content: string;
  branch?: Branch;
}

interface FactCheck {
  verified_elements: string[];
  fictional_elements: string[];
  inferred_elements: string[];
}

interface GeneratedScene {
  title: string;
  share_text?: string;
  acts: SceneAct[];
  fact_check: FactCheck;
  learn_more: string[];
}

const IDENTITY_OPTIONS = ["学生", "历史爱好者", "创作者"];
const RELATION_OPTIONS = ["朋友", "守护者", "穿越者", "工匠后人"];

export default function ScenePage() {
  const params = useParams();
  const artifactId = params.id as string;
  const artifact = getArtifactById(artifactId);

  function getBranchLabel(direction: string, actContent: string, artifactName: string): string {
    const isPlaceholder = !direction || /^(选[AB一二]|具体行动|方向)/.test(direction.trim());
    const dir = isPlaceholder ? "温情治愈" : direction;
    const templates: Record<string, string[]> = {
      "温情治愈": [`轻抚${artifactName}，感受温度`, "静静倾听它的故事", "向它诉说心中感受"],
      "历史推理": [`追问${artifactName}的来历`, "探寻它背后的秘密", "深入了解它的历史"],
      "轻悬疑":   [`察觉${artifactName}的异常`, "追查隐藏的线索", "揭开神秘的谜团"],
      "历史正剧": [`还原${artifactName}的历史`, "重现那段历史时刻", "探究历史真相"],
    };
    const list = templates[dir] || [`与${artifactName}深入交流`];
    // 根据内容哈希选一个，保持稳定
    const hash = actContent.length % list.length;
    return list[hash];
  }

  const [selectedTemplate, setSelectedTemplate] = useState(SCENE_TEMPLATES[0]?.id || "");
  const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0]?.id || "");
  const [selectedLength, setSelectedLength] = useState<"短篇" | "中篇" | "长篇">("中篇");
  const [nickname, setNickname] = useState("");
  const [identity, setIdentity] = useState(IDENTITY_OPTIONS[0]);
  const [relation, setRelation] = useState(RELATION_OPTIONS[0]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScene, setGeneratedScene] = useState<GeneratedScene | null>(null);
  const [displayedActs, setDisplayedActs] = useState<string[]>([]);
  const [typingDone, setTypingDone] = useState<boolean[]>([]);
  const [showFactCheck, setShowFactCheck] = useState(false);
  const [dynamicBranches, setDynamicBranches] = useState<Record<number, Branch | null>>({});
  const [loadingBranch, setLoadingBranch] = useState<Record<number, boolean>>({});
  const [selectedBranches, setSelectedBranches] = useState<Record<number, boolean>>({});
  const [visibleActCount, setVisibleActCount] = useState(1);
  const [storyEnded, setStoryEnded] = useState(false);
  const [showLoadingNext, setShowLoadingNext] = useState(false);

  const fetchBranchForAct = async (actIdx: number, acts: SceneAct[]) => {
    const act = acts[actIdx];
    // 知识点段不生成分支
    if (!act || act.act_title === "知识点" || act.act_title === "结尾") return;
    setLoadingBranch((prev) => ({ ...prev, [actIdx]: true }));
    try {
      const res = await fetch("/api/scene/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifactId, currentAct: act, previousActs: acts.slice(0, actIdx), style: selectedStyle, nickname }),
      });
      const data = await res.json();
      if (data.choice1) setDynamicBranches((prev) => ({ ...prev, [actIdx]: data }));
    } catch {}
    setLoadingBranch((prev) => ({ ...prev, [actIdx]: false }));
  };

  const typewriterActs = (acts: SceneAct[], onActDone?: (idx: number) => void) => {
    const targets = acts.map((a) => a.content);
    const displayed = targets.map(() => "");
    const done = targets.map(() => false);
    setDisplayedActs([...displayed]);
    setTypingDone([...done]);
    let actIdx = 0;
    const charQueue: string[] = [];
    targets.forEach((content, i) => {
      charQueue.push(...String(content ?? "").split(""));
      if (i < targets.length - 1) charQueue.push("\x00");
    });
    const timer = setInterval(() => {
      if (charQueue.length === 0) {
        done[actIdx] = true;
        setTypingDone([...done]);
        onActDone?.(actIdx);
        clearInterval(timer);
        return;
      }
      const batch = charQueue.length > 20 ? 8 : 3;
      let actChanged = false;
      for (let i = 0; i < batch && charQueue.length > 0; i++) {
        const ch = charQueue.shift()!;
        if (ch === "\x00") {
          done[actIdx] = true;
          onActDone?.(actIdx);
          actIdx++;
          actChanged = true;
        } else {
          displayed[actIdx] = (displayed[actIdx] || "") + ch;
        }
      }
      setDisplayedActs([...displayed]);
      if (actChanged) setTypingDone([...done]);
    }, 18);
  };

  const streamAndParse = async (
    url: string,
    body: object,
    onDone: (parsed: GeneratedScene | { acts: SceneAct[] }) => void
  ) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`failed: ${res.status} ${errText.slice(0, 200)}`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error("no body");
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const d = JSON.parse(line.slice(6));
          if (d.type === "done") {
            console.log("[scene] parsed:", d.parsed ? "OK" : "null");
            if (d.parsed) onDone(d.parsed);
          }
        } catch {}
      }
    }
  };

  const generateScene = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGeneratedScene(null);
    setDisplayedActs([]);
    setTypingDone([]);
    setShowFactCheck(false);
    setDynamicBranches({});
    setLoadingBranch({});
    setSelectedBranches({});
    setVisibleActCount(1);
    setStoryEnded(false);
    try {
      await streamAndParse(
        "/api/scene",
        { artifactId, sceneTemplate: selectedTemplate, style: selectedStyle, nickname, identity, relation, length: selectedLength },
        (parsed) => {
          const scene = parsed as GeneratedScene;
          setGeneratedScene(scene);
          // 逐段打字，每段完成后显示该段自带的分支
          const typeNext = (idx: number, displayed: string[], done: boolean[]) => {
            const act = scene.acts[idx];
            if (!act) return;
            typewriterActsFrom([act], idx, displayed, done, () => {
              const updatedDisplayed = [...displayed];
              updatedDisplayed[idx] = act.content;
              const updatedDone = [...done];
              updatedDone[idx] = true;
              // 如果该段有分支，等用户选择（handleBranchSelect 会继续）
              // 如果没有分支，继续打下一段
              if (!act.branch) {
                typeNext(idx + 1, updatedDisplayed, updatedDone);
              }
            });
          };
          const initDisplayed = scene.acts.map(() => "");
          const initDone = scene.acts.map(() => false);
          setDisplayedActs(initDisplayed);
          setTypingDone(initDone);
          typeNext(0, initDisplayed, initDone);
        }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBranchSelect = async (actIdx: number, choice: string, direction: string) => {
    if (!generatedScene) return;
    setSelectedBranches((prev) => ({ ...prev, [actIdx]: true }));
    const previousActs = generatedScene.acts.slice(0, actIdx + 1);

    // 判断当前是否是高潮幕（下一步应生成结尾）
    const currentTitle = generatedScene.acts[actIdx]?.act_title;
    const isLast = currentTitle === "高潮";

    setShowLoadingNext(true);
    setIsGenerating(true);

    try {
      await streamAndParse(
        "/api/scene/continue",
        { artifactId, previousActs, selectedBranch: choice, direction, style: selectedStyle, nickname, identity, relation, isLast },
        (parsed) => {
          const cont = parsed as { acts: SceneAct[] };
          if (!cont.acts?.length) return;
          setShowLoadingNext(false);
          const newActs = [...previousActs, ...cont.acts];
          const newScene = { ...generatedScene, acts: newActs };
          setGeneratedScene(newScene);
          const newDisplayed = previousActs.map((a) => a.content);
          const newDone = previousActs.map(() => true);
          setDisplayedActs([...newDisplayed, ...cont.acts.map(() => "")]);
          setTypingDone([...newDone, ...cont.acts.map(() => false)]);

          const typeNextAct = (relOffset: number, curDisplayed: string[], curDone: boolean[]) => {
            const act = cont.acts[relOffset];
            if (!act) { setStoryEnded(true); return; }
            typewriterActsFrom([act], previousActs.length + relOffset, curDisplayed, curDone, () => {
              const updatedDisplayed = [...curDisplayed];
              updatedDisplayed[previousActs.length + relOffset] = act.content;
              const updatedDone = [...curDone];
              updatedDone[previousActs.length + relOffset] = true;
              const nextOffset = relOffset + 1;
              const nextAct = cont.acts[nextOffset];
              if (!nextAct) {
                // 如果当前幕有分支，等用户选择；否则结束
                if (act.branch) {
                  // 显示分支，等用户选（会触发新一轮 handleBranchSelect）
                } else {
                  setStoryEnded(true);
                }
              } else {
                // 结尾/知识点直接继续打字
                typeNextAct(nextOffset, updatedDisplayed, updatedDone);
              }
            });
          };
          typeNextAct(0, newDisplayed, newDone);
        }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const typewriterActsFrom = (acts: SceneAct[], startIdx: number, prevDisplayed: string[], prevDone: boolean[], onActDone?: (relIdx: number) => void) => {
    const targets = acts.map((a) => a.content);
    const displayed = [...prevDisplayed, ...targets.map(() => "")];
    const done = [...prevDone, ...targets.map(() => false)];
    setDisplayedActs([...displayed]);
    setTypingDone([...done]);
    let relIdx = 0;
    const charQueue: string[] = [];
    targets.forEach((content, i) => {
      charQueue.push(...String(content ?? "").split(""));
      if (i < targets.length - 1) charQueue.push("\x00");
    });
    const timer = setInterval(() => {
      if (charQueue.length === 0) {
        done[startIdx + relIdx] = true;
        setTypingDone([...done]);
        setVisibleActCount(startIdx + relIdx + 1);
        onActDone?.(relIdx);
        clearInterval(timer);
        return;
      }
      const batch = charQueue.length > 20 ? 8 : 3;
      for (let i = 0; i < batch && charQueue.length > 0; i++) {
        const ch = charQueue.shift()!;
        if (ch === "\x00") {
          done[startIdx + relIdx] = true;
          setVisibleActCount(startIdx + relIdx + 1);
          onActDone?.(relIdx);
          relIdx++;
        } else {
          displayed[startIdx + relIdx] = (displayed[startIdx + relIdx] || "") + ch;
        }
      }
      setDisplayedActs([...displayed]);
      setTypingDone([...done]);
    }, 18);
  };

  if (!artifact) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-secondary">文物不存在</p></div>;
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <SideNavNew />
      <div className="flex min-h-screen pt-20">
        <main className="flex-1 md:ml-64 flex flex-col items-center px-4 py-8">

          {/* Controls */}
          <section className="w-full max-w-4xl mb-12 flex flex-col gap-6">
            {/* Artifact info */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-2xl overflow-hidden">
                {artifact.image
                  ? <img src={artifact.image} alt={artifact.name} className="w-full h-full object-cover" />
                  : artifact.emoji}
              </div>
              <div>
                <div className="text-sm font-bold text-primary">{artifact.name}</div>
                <div className="text-xs text-secondary">{artifact.dynasty}</div>
              </div>
            </div>

            {/* Length selection */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-secondary tracking-widest uppercase px-1">故事长度</span>
              <div className="flex gap-2">
                {([
                  { key: "短篇", desc: "300-500字" },
                  { key: "中篇", desc: "800-1000字" },
                  { key: "长篇", desc: "1500字+" },
                ] as const).map(({ key, desc }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedLength(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                      selectedLength === key
                        ? "bg-primary text-on-primary border-primary"
                        : "border-outline-variant/30 text-secondary hover:text-primary"
                    }`}
                  >
                    {key} <span className="text-xs opacity-60">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Style selection */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-secondary tracking-widest uppercase px-1">艺术风格</span>
              <div className="flex flex-wrap gap-2 p-1.5 bg-surface-container-low rounded-xl w-full max-w-full">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStyle(s.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedStyle === s.id
                        ? "bg-surface-container-lowest text-on-surface shadow-sm"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Scene template tabs */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-secondary tracking-widest uppercase px-1">场景模版</span>
              <div className="flex gap-8 overflow-x-auto pb-2 border-b border-outline-variant/20">
                {SCENE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`pb-3 text-sm whitespace-nowrap transition-colors ${
                      selectedTemplate === t.id
                        ? "font-bold text-tertiary border-b-2 border-tertiary"
                        : "font-medium text-secondary hover:text-primary"
                    }`}
                  >
                    {t.icon} {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* User binding */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-secondary tracking-widest uppercase px-1">
                专属绑定 <span className="normal-case font-normal">（可选）</span>
              </span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="你的昵称（将出现在故事中）"
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/60"
              />
              <div className="flex gap-3 flex-wrap">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-secondary px-1">身份</span>
                  <div className="flex gap-2">
                    {IDENTITY_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setIdentity(opt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          identity === opt
                            ? "bg-primary text-on-primary border-primary"
                            : "border-outline-variant/30 text-secondary hover:text-primary"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-secondary px-1">与文物的关系</span>
                  <div className="flex gap-2 flex-wrap">
                    {RELATION_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setRelation(opt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                          relation === opt
                            ? "bg-tertiary text-on-tertiary border-tertiary"
                            : "border-outline-variant/30 text-secondary hover:text-primary"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={generateScene}
              disabled={isGenerating}
              className="w-full py-4 rounded-2xl bg-primary text-on-primary font-semibold hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  正在生成故事…
                </>
              ) : "✨ 生成专属情景故事"}
            </button>
          </section>

          {/* Story Canvas */}
          {generatedScene && (
            <>
              <article className="w-full max-w-[900px] bg-surface-container-lowest rounded-3xl p-5 md:p-12 shadow-[0_20px_50px_rgba(49,51,48,0.06)] paper-grain mb-12">
                {/* Story header */}
                <header className="text-center mb-8 md:mb-16">
                  <h1 className="text-3xl font-bold text-on-surface mb-4 tracking-tight">《{generatedScene.title}》</h1>
                  <div className="flex justify-center items-center gap-4 text-sm text-secondary">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">calendar_today</span>
                      {artifact.dynasty}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant" />
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">auto_stories</span>
                      {SCENE_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}
                    </span>
                    {nickname && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-outline-variant" />
                        <span>{nickname} · {relation}</span>
                      </>
                    )}
                  </div>
                </header>

                {/* Acts */}
                <div className="space-y-12">
                  {generatedScene.acts.slice(0, visibleActCount).map((act, idx) => {
                    const text = displayedActs[idx] ?? "";
                    const isDone = typingDone[idx] ?? false;
                    const isLast = idx === generatedScene.acts.length - 1;
                    const hasBranch = (act.branch || dynamicBranches[idx]) && isDone && !isGenerating;
                    const branchVisible = hasBranch && !selectedBranches[idx];
                    return (
                      <div key={idx}>
                        <div className="flex items-center gap-3 mb-6">
                          <span className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-xs font-bold">
                            {act.act_number}
                          </span>
                          <h2 className="text-base font-bold text-primary">{act.act_title}</h2>
                        </div>
                        <div className="space-y-5 text-on-surface leading-[1.9] text-base font-light">
                          {text.split("\n").filter(l => Boolean(l) && !l.includes("故事虚构") && !l.includes("知识点真实")).map((para, i) => (
                            <p key={`${idx}-${i}`}>{para}</p>
                          ))}
                          {act.act_title === "知识点" && isDone && (
                            <p className="text-xs text-secondary mt-4">故事虚构 · 知识点真实</p>
                          )}
                          {!isDone && (
                            <span className="inline-block w-0.5 h-5 bg-tertiary ml-0.5 animate-pulse" />
                          )}
                        </div>

                        {/* Branch choices — dynamic */}
                        {branchVisible && (() => {
                          const branch = dynamicBranches[idx] ?? act.branch;
                          const isLoading = loadingBranch[idx];
                          if (isLoading) return (
                            <div className="mt-6 flex items-center gap-2 text-xs text-secondary">
                              <span className="w-3 h-3 border border-secondary border-t-transparent rounded-full animate-spin" />
                              正在生成选择…
                            </div>
                          );
                          if (!branch) return null;
                          return (
                            <div className="mt-6 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
                              <p className="text-xs text-secondary mb-3">选择故事走向：</p>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={() => handleBranchSelect(idx, branch.choice1, branch.direction1)}
                                  className="flex-1 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 text-sm font-medium hover:bg-primary/20 transition-all text-left"
                                >
                                  <span className="text-xs text-secondary block mb-0.5">{branch.direction1}</span>
                                  {branch.choice1}
                                </button>
                                <button
                                  onClick={() => handleBranchSelect(idx, branch.choice2, branch.direction2)}
                                  className="flex-1 px-4 py-3 rounded-xl bg-tertiary/10 text-tertiary border border-tertiary/20 text-sm font-medium hover:bg-tertiary/20 transition-all text-left"
                                >
                                  <span className="text-xs text-secondary block mb-0.5">{branch.direction2}</span>
                                  {branch.choice2}
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {!isLast && !branchVisible && (
                          <div className="mt-10 flex items-center gap-4">
                            <div className="flex-1 h-px bg-outline-variant/20" />
                            <span className="text-outline-variant text-xs">❧</span>
                            <div className="flex-1 h-px bg-outline-variant/20" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* 加载骨架屏 */}
                  {showLoadingNext && (
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <span className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center text-xs font-bold">…</span>
                        <h2 className="text-base font-bold text-secondary">正在生成故事…</h2>
                      </div>
                      <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-outline-variant/20 rounded w-full" />
                        <div className="h-4 bg-outline-variant/20 rounded w-5/6" />
                        <div className="h-4 bg-outline-variant/20 rounded w-4/5" />
                        <div className="h-4 bg-outline-variant/20 rounded w-full" />
                        <div className="h-4 bg-outline-variant/20 rounded w-3/4" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Ending */}
                {storyEnded && (
                  <>
                    <div className="mt-20 pt-8 border-t border-outline-variant/10 text-center">
                      <span className="text-tertiary font-serif italic">—— 终 ——</span>
                    </div>

                    {/* Fact check */}
                    <div className="mt-10 rounded-2xl border border-outline-variant/20 overflow-hidden">
                  <button
                    onClick={() => setShowFactCheck(!showFactCheck)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-surface-container-low hover:bg-surface-container transition-colors"
                  >
                    <span className="text-sm font-semibold text-primary">🔍 史实核查报告</span>
                    <span className="text-secondary text-sm">{showFactCheck ? "收起 ↑" : "展开 ↓"}</span>
                  </button>
                  {showFactCheck && generatedScene.fact_check && (
                    <div className="px-6 py-5 space-y-4 border-t border-outline-variant/10">
                      {generatedScene.fact_check.verified_elements?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-emerald-500 mb-2">✓ 已核验史实</p>
                          <ul className="space-y-1">
                            {generatedScene.fact_check.verified_elements.map((e, i) => (
                              <li key={i} className="text-xs text-secondary flex gap-2"><span className="text-emerald-500">·</span>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {generatedScene.fact_check.inferred_elements?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-yellow-500 mb-2">~ 合理推测</p>
                          <ul className="space-y-1">
                            {generatedScene.fact_check.inferred_elements.map((e, i) => (
                              <li key={i} className="text-xs text-secondary flex gap-2"><span className="text-yellow-500">·</span>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {generatedScene.fact_check.fictional_elements?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-400 mb-2">✦ 艺术虚构</p>
                          <ul className="space-y-1">
                            {generatedScene.fact_check.fictional_elements.map((e, i) => (
                              <li key={i} className="text-xs text-secondary flex gap-2"><span className="text-red-400">·</span>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Learn more */}
                {generatedScene.learn_more?.length > 0 && (
                  <div className="mt-6 bg-surface-container-low rounded-2xl p-5">
                    <p className="text-xs font-semibold text-secondary mb-3">📚 深入探索</p>
                    <div className="space-y-2">
                      {generatedScene.learn_more.map((q, i) => (
                        <Link key={i} href={`/chat/${artifactId}?q=${encodeURIComponent(q)}`} className="block text-sm text-secondary hover:text-primary transition-colors">
                          → {q}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                  </>
                )}
              </article>

              {/* Bottom actions */}
              <section className="flex flex-wrap justify-center gap-4 mb-20">
                {generatedScene.share_text && (
                  <div className="w-full max-w-[900px] px-6 py-3 bg-surface-container-low rounded-2xl text-center text-sm text-secondary border border-outline-variant/20 mb-2">
                    {generatedScene.share_text}
                  </div>
                )}
                <button
                  onClick={() => { setGeneratedScene(null); }}
                  className="flex items-center gap-2 px-8 py-3 bg-surface-container-high text-secondary rounded-full font-bold hover:bg-primary-container hover:text-primary transition-all group"
                >
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">refresh</span>
                  重新生成
                </button>
                <Link
                  href={`/chat/${artifactId}`}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary rounded-full font-bold hover:bg-primary-dim shadow-lg transition-all group"
                >
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">chat_bubble</span>
                  与文物对话
                </Link>
              </section>
            </>
          )}

          {/* Footer */}
          <footer className="w-full py-12 mt-4 border-t border-outline-variant/10">
            <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
              <div className="flex gap-8">
                {["关于我们", "使用协议", "隐私政策", "联系馆长"].map((t) => (
                  <a key={t} href="#" className="text-secondary hover:text-primary text-xs tracking-wide transition-colors">{t}</a>
                ))}
              </div>
              <p className="text-secondary text-xs">© 2026 物语 ArtiFact | 让每件文物都开口说话</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
