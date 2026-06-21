"use client";

import Link from "next/link";
import Image from "next/image";
import { Artifact } from "@/data/artifacts";
import TopNav from "@/components/TopNav";
import SideNavNew from "@/components/SideNavNew";
import ArtifactBrowser from "@/components/ArtifactBrowser";

function ChatCard(artifact: Artifact) {
  return (
    <Link key={artifact.id} href={`/chat/${artifact.id}`}
      className="group bg-surface-container-low rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative h-60 bg-surface-container-high flex items-center justify-center overflow-hidden">
        {artifact.image ? (
          <Image src={artifact.image} alt={artifact.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span className="text-7xl">{artifact.emoji}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-white text-sm font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
            开始对话
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-base font-bold text-primary mb-1">{artifact.name}</h3>
        <p className="text-xs text-secondary">{artifact.dynasty} · {artifact.category}</p>
      </div>
    </Link>
  );
}

export default function ChatPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <SideNavNew />
      <main className="ml-0 md:ml-64 pt-20 pb-28 md:pb-20 max-w-[1200px] mx-auto px-6">
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold text-primary tracking-tighter mb-2">文物对话</h2>
          <p className="text-secondary text-sm">选择一件文物，开始对话探索</p>
        </div>
        <ArtifactBrowser renderCard={ChatCard} />
      </main>
    </div>
  );
}
