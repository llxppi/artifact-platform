"use client";

import { useState } from "react";

interface ReportButtonProps {
  artifactId: string;
  contentType: "chat" | "story";
  content: string;
}

export default function ReportButton({ artifactId, contentType, content }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [errorPosition, setErrorPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifactId,
          contentType,
          content,
          errorPosition,
          reason,
          userId: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!).id : null
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          setShowModal(false);
          setSuccess(false);
          setReason("");
          setErrorPosition("");
        }, 2000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-xs text-outline hover:text-error transition-colors flex items-center gap-1"
        title="举报史实错误"
      >
        <span className="material-symbols-outlined text-sm">flag</span>
        <span>举报错误</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6">
            {success ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-6xl text-primary mb-4">check_circle</span>
                <p className="text-lg font-bold">感谢您的反馈！</p>
                <p className="text-sm text-outline mt-2">我们将在24小时内审核处理</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-4">举报史实错误</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">错误位置（可选）</label>
                  <input
                    value={errorPosition}
                    onChange={(e) => setErrorPosition(e.target.value)}
                    placeholder="例如：第二段第三句"
                    className="w-full px-4 py-2 rounded-lg bg-surface-container text-on-surface"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">错误描述 *</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="请描述具体的史实错误..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg bg-surface-container text-on-surface resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 rounded-lg bg-surface-container hover:bg-surface-container-highest transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !reason.trim()}
                    className="flex-1 px-4 py-3 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors disabled:opacity-50"
                  >
                    {loading ? "提交中..." : "提交举报"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
