import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArtifactById, ARTIFACTS } from "@/data/artifacts";
import TopNav from "@/components/TopNav";
import SideNavNew from "@/components/SideNavNew";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return ARTIFACTS.map((a) => ({ id: a.id }));
}

export default async function ArtifactDetailPage({ params }: Props) {
  const { id } = await params;
  const artifact = getArtifactById(id);
  if (!artifact) notFound();

  return (
    <div className="min-h-screen">
      <TopNav />
      <SideNavNew />

      <main className="ml-0 lg:ml-64 pt-32 pb-20 flex justify-center">
        <div className="w-full max-w-[1200px] px-4 md:px-8 flex flex-col md:flex-row gap-8 md:gap-12 items-start">
          <section className="w-full md:w-[45%] md:sticky md:top-32">
            <div className="bg-[#F9F7F4] rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(49,51,48,0.05)] relative group">
              {artifact.image ? (
                <Image src={artifact.image} alt={artifact.name} width={600} height={800} className="w-full aspect-[3/4] object-contain p-12 transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="w-full aspect-[3/4] flex items-center justify-center"><span className="text-9xl">{artifact.emoji}</span></div>
              )}
            </div>
          </section>

          <section className="w-full md:w-[55%] space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight">{artifact.name}</h1>
              <div className="flex flex-wrap gap-3">
                <span className="bg-primary-container text-on-primary-fixed-variant px-4 py-1.5 rounded-lg text-xs font-semibold">{artifact.dynasty}</span>
                <span className="bg-surface-container-high text-secondary px-4 py-1.5 rounded-lg text-xs font-semibold">{artifact.category}</span>
                <span className="bg-surface-container-high text-secondary px-4 py-1.5 rounded-lg text-xs font-semibold">{artifact.material}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 border-l-4 border-tertiary pl-4">
                <h2 className="text-sm font-bold tracking-widest text-secondary uppercase">文物简介</h2>
              </div>
              <p className="text-lg leading-[1.8] text-on-surface-variant font-light tracking-wide">{artifact.description}</p>
            </div>

            <div className="flex gap-4">
              <Link href={`/chat/${artifact.id}`} className="flex-1 py-4 bg-primary text-on-primary rounded-xl text-center font-semibold hover:bg-primary-dim transition-all">💬 与我对话</Link>
              <Link href={`/scene/${artifact.id}`} className="flex-1 py-4 bg-tertiary-container text-on-tertiary-container rounded-xl text-center font-semibold hover:bg-tertiary-fixed transition-all">🎬 生成故事</Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-tertiary pl-4">
                <h2 className="text-sm font-bold tracking-widest text-secondary uppercase">知识要点</h2>
              </div>
              <div className="space-y-3">
                {artifact.knowledge.slice(0, 5).map((k, i) => (
                  <div key={i} className="p-4 bg-surface-container-low rounded-xl">
                    <p className="text-sm text-on-surface">{k.content}</p>
                    <p className="text-xs text-secondary mt-2">来源：{k.source}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
