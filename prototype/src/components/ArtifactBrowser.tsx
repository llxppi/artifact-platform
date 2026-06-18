"use client";

import { useMemo, useState } from "react";
import { ARTIFACTS, Artifact } from "@/data/artifacts";
import { DYNASTY_MAP, MATERIAL_MAP, PERIODS } from "@/lib/dynasty";

interface Props {
  renderCard: (artifact: Artifact) => React.ReactNode;
}

export default function ArtifactBrowser({ renderCard }: Props) {
  const [selectedDynasty, setSelectedDynasty] = useState("全部");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [search, setSearch] = useState("");

  const dynasties = ["全部", ...PERIODS];
  const materials = ["青铜器", "玉石器", "陶器", "瓷器", "书画", "金银器"];

  const filtered = useMemo(() => ARTIFACTS.filter((a) => {
    const dynastyOk = selectedDynasty === "全部" || DYNASTY_MAP[selectedDynasty]?.some(d => a.dynasty === d);
    const materialOk = !selectedMaterial || MATERIAL_MAP[selectedMaterial]?.some(m => a.category.includes(m));
    const searchOk = !search || [a.name, a.dynasty, a.category].some(s => s.includes(search));
    return dynastyOk && materialOk && searchOk;
  }), [selectedDynasty, selectedMaterial, search]);

  const grouped = useMemo(() => {
    if (selectedDynasty !== "全部") return [{ period: selectedDynasty, artifacts: filtered }];
    return PERIODS.map(period => ({
      period,
      artifacts: filtered.filter(a => DYNASTY_MAP[period]?.some(d => a.dynasty === d))
    })).filter(g => g.artifacts.length > 0);
  }, [filtered, selectedDynasty]);

  const dynastyCount = (d: string) => d === "全部" ? ARTIFACTS.length :
    ARTIFACTS.filter(a => DYNASTY_MAP[d]?.some(x => a.dynasty === x)).length;

  const materialCount = (m: string) => ARTIFACTS.filter(a => {
    const dynastyOk = selectedDynasty === "全部" || DYNASTY_MAP[selectedDynasty]?.some(d => a.dynasty === d);
    return dynastyOk && MATERIAL_MAP[m]?.some(x => a.category.includes(x));
  }).length;

  return (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">search</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索文物名称、朝代、类别..."
          className="w-full pl-10 pr-4 h-11 bg-surface-container-low rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary/30 text-on-surface placeholder:text-secondary"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-12">
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          <span className="text-xs font-bold text-outline-variant uppercase tracking-widest whitespace-nowrap">朝代 Dynasty</span>
          <div className="flex gap-2">
            {dynasties.map(dynasty => (
              <button key={dynasty}
                onClick={() => { setSelectedDynasty(dynasty); setSelectedMaterial(""); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedDynasty === dynasty ? "bg-[#9BA3AF] text-white" : "bg-surface-container-low text-secondary hover:bg-surface-container-high"}`}>
                {dynasty}
                {dynasty !== "全部" && <span className="ml-1 opacity-60">{dynastyCount(dynasty)}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          <span className="text-xs font-bold text-outline-variant uppercase tracking-widest whitespace-nowrap">材质 Material</span>
          <div className="flex gap-2">
            {materials.map(material => {
              const count = materialCount(material);
              return (
                <button key={material}
                  onClick={() => setSelectedMaterial(selectedMaterial === material ? "" : material)}
                  disabled={count === 0}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedMaterial === material ? "bg-[#9BA3AF] text-white" : count === 0 ? "bg-surface-container-low text-outline opacity-40 cursor-not-allowed" : "bg-surface-container-low text-secondary hover:bg-surface-container-high"}`}>
                  {material}
                  {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grouped results */}
      {grouped.length === 0 ? (
        <p className="text-center text-secondary py-20">暂无符合条件的文物</p>
      ) : (
        <div className="space-y-12">
          {grouped.map(({ period, artifacts }) => (
            <section key={period}>
              <div className="flex items-center gap-4 mb-5">
                <h3 className="text-base font-bold text-primary">{period}</h3>
                <div className="flex-1 h-px bg-outline-variant/20" />
                <span className="text-xs text-secondary">{artifacts.length} 件</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {artifacts.map(artifact => renderCard(artifact))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
