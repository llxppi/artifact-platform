"use client";

import Link from "next/link";
import Image from "next/image";
import { Artifact } from "@/data/artifacts";
import TopNav from "@/components/TopNav";
import SideNavNew from "@/components/SideNavNew";
import ArtifactBrowser from "@/components/ArtifactBrowser";

function MuseumCard(artifact: Artifact) {
  return (
    <Link key={artifact.id} href={`/artifact/${artifact.id}`}
      className="group bg-surface-container-low rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative h-80 bg-surface-container-high flex items-center justify-center overflow-hidden">
        {artifact.image ? (
          <Image src={artifact.image} alt={artifact.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span className="text-8xl">{artifact.emoji}</span>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold text-primary mb-2">{artifact.name}</h3>
        <p className="text-sm text-secondary mb-4">{artifact.dynasty}</p>
        <div className="flex items-center justify-between text-outline">
          <span className="text-xs">{artifact.category}</span>
          <span className="material-symbols-outlined text-lg hover:text-tertiary transition-colors">arrow_forward</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <SideNavNew />
      <main className="ml-0 lg:ml-64 pt-20 pb-20 max-w-[1200px] mx-auto px-6">
        <div className="mb-8">
          <h2 className="text-2xl md:text-4xl font-extrabold text-primary tracking-tighter mb-1">文物馆</h2>
          <p className="text-sm text-secondary">完整馆藏 · 按历史时期浏览</p>
        </div>
        <ArtifactBrowser renderCard={MuseumCard} />
      </main>
    </div>
  );
}
