import { NEOLITHIC_ARTIFACTS } from "./neolithic";
import { SHANG_ZHOU_ARTIFACTS } from "./shang-zhou";
import { QIN_HAN_ARTIFACTS } from "./qin-han";
import { WEI_TANG_ARTIFACTS } from "./wei-tang";
import { SONG_YUAN_ARTIFACTS } from "./song-yuan";
import { MING_QING_ARTIFACTS } from "./ming-qing";

export * from "./types";

export const ARTIFACTS = [
  ...NEOLITHIC_ARTIFACTS,
  ...SHANG_ZHOU_ARTIFACTS,
  ...QIN_HAN_ARTIFACTS,
  ...WEI_TANG_ARTIFACTS,
  ...SONG_YUAN_ARTIFACTS,
  ...MING_QING_ARTIFACTS,
];

export function getArtifactById(id: string) {
  return ARTIFACTS.find((a) => a.id === id);
}

export const SCENE_TEMPLATES = [
  { id: "court-ceremony", name: "宫廷祭祀", description: "在皇家祭祀仪式中，你将见证文物最辉煌的时刻", icon: "🏛️" },
  { id: "time-travel", name: "穿越相遇", description: "现代的你穿越到文物所在的朝代，与它邂逅", icon: "⏳" },
  { id: "discovery", name: "考古发掘", description: "文物在沉睡千年后被重新发现的那个瞬间", icon: "🔍" },
  { id: "daily-life", name: "市井日常", description: "探索文物所处时代普通人的日常生活", icon: "🏘️" },
];

export const STYLE_OPTIONS = [
  { id: "q_version", name: "Q版萌化", description: "可爱卡通风格，文物化身萌萌哒小角色", icon: "🌸" },
  { id: "realistic", name: "历史写实", description: "尊重史实，沉浸式历史正剧体验", icon: "📜" },
  { id: "mystery", name: "悬疑探索", description: "围绕文物未解之谜，带入悬疑推理氛围", icon: "🔮" },
  { id: "healing", name: "温情治愈", description: "温暖治愈的情感故事，感受文物背后的人情温度", icon: "🌿" },
  { id: "historical", name: "历史正剧", description: "严肃厚重的历史叙事，还原真实历史场景", icon: "🏯" },
  { id: "craftsman", name: "工匠传承", description: "聚焦工艺与匠人精神，探索文物的诞生之旅", icon: "🔨" },
  { id: "timetravel", name: "穿越对话", description: "跨越时空与文物对话，古今碰撞奇妙火花", icon: "⚡" },
];
