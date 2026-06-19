"use client";

import { useState } from "react";
import { GLOSSARY } from "@/lib/glossary";

export default function GlossaryText({ text }: { text: string }) {
  const [tooltip, setTooltip] = useState<{ term: string; def: string; x: number; y: number } | null>(null);

  const terms = Object.keys(GLOSSARY);
  // 将文本按术语分割，高亮匹配词
  const regex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        GLOSSARY[part] ? (
          <span
            key={i}
            className="underline decoration-dotted decoration-primary/60 text-primary/90 cursor-help"
            onClick={e => {
              e.stopPropagation();
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setTooltip(tooltip?.term === part ? null : { term: part, def: GLOSSARY[part], x: rect.left, y: rect.bottom + window.scrollY });
            }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
      {tooltip && (
        <span
          className="fixed z-50 max-w-xs bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg p-3 text-xs text-on-surface"
          style={{ left: Math.min(tooltip.x, window.innerWidth - 280), top: tooltip.y + 6 }}
          onClick={() => setTooltip(null)}
        >
          <span className="font-bold text-primary">{tooltip.term}</span>
          <span className="mx-1 text-secondary">·</span>
          {tooltip.def}
        </span>
      )}
    </span>
  );
}
