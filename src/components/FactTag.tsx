"use client";

interface FactTagProps {
  type: "verified" | "mainstream" | "minority" | "speculation" | "fiction";
  text: string;
}

export default function FactTag({ type, text }: FactTagProps) {
  const config = {
    verified: {
      icon: "verified",
      label: "已验证史实",
      color: "text-primary bg-primary/10",
      border: "border-primary/20"
    },
    mainstream: {
      icon: "school",
      label: "学界主流观点",
      color: "text-secondary bg-secondary/10",
      border: "border-secondary/20"
    },
    minority: {
      icon: "psychology",
      label: "少数派观点",
      color: "text-tertiary bg-tertiary/10",
      border: "border-tertiary/20"
    },
    speculation: {
      icon: "help",
      label: "合理推测",
      color: "text-outline bg-surface-container",
      border: "border-outline/20"
    },
    fiction: {
      icon: "auto_stories",
      label: "艺术创作",
      color: "text-error bg-error/10",
      border: "border-error/20"
    }
  };

  const { icon, label, color, border } = config[type];

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${color} border ${border}`}>
      <span className="material-symbols-outlined text-sm">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
