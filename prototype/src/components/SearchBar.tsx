"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setIsOpen(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
      <input
        type="text"
        placeholder="搜索文物、朝代、故事..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query && setIsOpen(true)}
        className="w-full pl-12 pr-4 py-3 bg-surface-container-highest border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-outline/60"
      />

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-surface_high rounded-lg shadow-lg border border-outline/20 max-h-96 overflow-y-auto z-50">
          {results.map((artifact) => (
            <Link
              key={artifact.id}
              href={`/artifact/${artifact.id}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 hover:bg-surface_low transition-colors"
            >
              <span className="text-2xl">{artifact.emoji}</span>
              <div>
                <div className="text-sm font-medium text-primary">{artifact.name}</div>
                <div className="text-xs text-on_surface/50">{artifact.dynasty}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
