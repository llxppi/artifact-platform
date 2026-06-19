"use client";

interface QuotaWarningProps {
  type: "chat" | "scene";
  remaining: number;
  limit: number;
  onShare?: () => void;
}

export default function QuotaWarning({ type, remaining, limit, onShare }: QuotaWarningProps) {
  const typeText = type === "chat" ? "对话" : "情景生成";

  if (remaining === 0) {
    return (
      <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-error">block</span>
          <div className="flex-1">
            <p className="font-bold text-error">今日{typeText}次数已用完</p>
            <p className="text-sm text-outline mt-1">明日再来，或分享解锁额外次数</p>
            {onShare && (
              <button
                onClick={onShare}
                className="mt-3 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm"
              >
                分享解锁 +3次
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (remaining <= 2) {
    return (
      <div className="bg-tertiary/10 border border-tertiary/20 rounded-lg p-3 mb-4">
        <p className="text-sm text-outline">
          今日还剩 <span className="font-bold text-primary">{remaining}</span> 次{typeText}机会
        </p>
      </div>
    );
  }

  return null;
}
