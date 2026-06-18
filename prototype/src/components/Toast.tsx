"use client";

import { useEffect } from "react";

interface Props {
  message: string;
  type?: "error" | "success" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "error", onClose, duration = 3000 }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    error: "bg-red-500",
    success: "bg-green-500",
    info: "bg-blue-500",
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top">
      <div className={`${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3`}>
        <span className="material-symbols-outlined">
          {type === "error" ? "error" : type === "success" ? "check_circle" : "info"}
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
}
