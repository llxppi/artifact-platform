"use client";

import Link from "next/link";
import Image from "next/image";
import { ARTIFACTS } from "@/data/artifacts";
import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import SideNavNew from "@/components/SideNavNew";

const DYNASTY_MAP: Record<string, string[]> = {
  "新石器": ["新石器时代"],
  "商周": ["商朝", "商代", "商周", "西周", "春秋", "战国", "先秦"],
  "秦汉": ["秦朝", "战国", "西汉", "东汉"],
  "隋唐": ["东晋", "晋代", "北魏", "隋朝", "唐代", "唐朝", "五代", "金朝"],
  "宋元": ["北宋", "元朝", "元末明初"],
  "明清": ["明代", "明朝", "清朝", "清代"],
};

const MATERIAL_MAP: Record<string, string[]> = {
  "青铜器": ["青铜", "铜"],
  "玉石器": ["玉", "石"],
  "瓷器": ["瓷", "陶"],
  "书画": ["画", "书法", "简", "丝织", "地图", "壁画", "漆"],
  "金银器": ["金", "银"],
};

export default function HomePage() {
  const [selectedDynasty, setSelectedDynasty] = useState("全部");
  const [selectedMaterial, setSelectedMaterial] = useState("");

  const dynasties = ["全部", "新石器", "商周", "秦汉", "隋唐", "宋元", "明清"];
  const materials = ["青铜器", "玉石器", "瓷器", "书画", "金银器"];

  const filtered = ARTIFACTS.filter((a) => {
    const dynastyOk = selectedDynasty === "全部" ||
      DYNASTY_MAP[selectedDynasty]?.some((d) => a.dynasty.includes(d));
    const materialOk = !selectedMaterial ||
      MATERIAL_MAP[selectedMaterial]?.some((m) => a.category.includes(m));
    return dynastyOk && materialOk;
  });

  const dynastyCount = (d: string) => d === "全部" ? ARTIFACTS.length :
    ARTIFACTS.filter((a) => DYNASTY_MAP[d]?.some((x) => a.dynasty.includes(x))).length;

  const materialCount = (m: string) =>
    ARTIFACTS.filter((a) => {
      const dynastyOk = selectedDynasty === "全部" ||
        DYNASTY_MAP[selectedDynasty]?.some((d) => a.dynasty.includes(d));
      return dynastyOk && MATERIAL_MAP[m]?.some((x) => a.category.includes(x));
    }).length;

  return (
    <div className="min-h-screen">
      <TopNav />
      <SideNavNew />

      <main className="ml-0 lg:ml-64 pt-20 pb-20 max-w-[1200px] mx-auto px-6">
        {/* Filter Header */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-4xl font-extrabold text-primary tracking-tighter">发现广场</h2>
            <div className="flex gap-2">
              <button className="px-5 py-2 bg-primary text-on-primary rounded-full text-sm font-medium hover:shadow-lg transition-all">
                最新收录
              </button>
              <button className="px-5 py-2 bg-surface-container-low text-secondary hover:bg-surface-container-high rounded-full text-sm font-medium transition-all">
                热门推荐
              </button>
            </div>
          </div>

          {/* Dynasty & Material Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              <span className="text-xs font-bold text-outline-variant uppercase tracking-widest whitespace-nowrap">朝代 Dynasty</span>
              <div className="flex gap-2">
                {dynasties.map((dynasty) => {
                  const count = dynastyCount(dynasty);
                  return (
                    <button
                      key={dynasty}
                      onClick={() => { setSelectedDynasty(dynasty); setSelectedMaterial(""); }}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        selectedDynasty === dynasty
                          ? "bg-[#9BA3AF] text-white"
                          : "bg-surface-container-low text-secondary hover:bg-surface-container-high"
                      }`}
                    >
                      {dynasty}
                      {dynasty !== "全部" && <span className="ml-1 opacity-60">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              <span className="text-xs font-bold text-outline-variant uppercase tracking-widest whitespace-nowrap">材质 Material</span>
              <div className="flex gap-2">
                {materials.map((material) => {
                  const count = materialCount(material);
                  return (
                    <button
                      key={material}
                      onClick={() => setSelectedMaterial(selectedMaterial === material ? "" : material)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        selectedMaterial === material
                          ? "bg-[#9BA3AF] text-white"
                          : count === 0
                          ? "bg-surface-container-low text-outline opacity-40 cursor-not-allowed"
                          : "bg-surface-container-low text-secondary hover:bg-surface-container-high"
                      }`}
                      disabled={count === 0}
                    >
                      {material}
                      {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Artifacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.length === 0 && (
            <p className="col-span-3 text-center text-secondary py-20">暂无符合条件的文物</p>
          )}
          {filtered.map((artifact) => (
            <Link
              key={artifact.id}
              href={`/artifact/${artifact.id}`}
              className="group bg-surface-container-low rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="relative h-80 bg-surface-container-high flex items-center justify-center overflow-hidden">
                {artifact.image ? (
                  <Image
                    src={artifact.image}
                    alt={artifact.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <span className="text-8xl">{artifact.emoji}</span>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-primary mb-2">{artifact.name}</h3>
                <p className="text-sm text-secondary mb-4">{artifact.dynasty}</p>
                <div className="flex items-center justify-between text-outline">
                  <span className="text-xs">{artifact.category}</span>
                  <span className="material-symbols-outlined text-lg hover:text-tertiary transition-colors">
                    arrow_forward
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
