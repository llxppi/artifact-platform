"use client";

export default function FictionWarning() {
  return (
    <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-error text-xl">warning</span>
        <div>
          <p className="font-bold text-error text-sm">本故事为艺术创作，非史实</p>
          <p className="text-xs text-outline mt-1">
            以下内容基于历史背景进行合理想象，仅供娱乐参考，不代表真实历史事件。
          </p>
        </div>
      </div>
    </div>
  );
}
