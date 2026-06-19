// 敏感词库配置
export const sensitiveWords = {
  // 历史敏感话题
  historical: [
    "文革", "大跃进", "反右", "六四", "天安门事件",
    "政治运动", "阶级斗争"
  ],

  // 民族问题
  ethnic: [
    "民族分裂", "独立运动", "种族歧视"
  ],

  // 宗教问题
  religious: [
    "宗教冲突", "邪教", "法轮功"
  ],

  // 政治敏感
  political: [
    "政变", "革命", "起义", "造反"
  ]
};

// 检查文本是否包含敏感词
export function containsSensitiveWords(text: string): {
  hasSensitive: boolean;
  words: string[]
} {
  const foundWords: string[] = [];
  const allWords = [
    ...sensitiveWords.historical,
    ...sensitiveWords.ethnic,
    ...sensitiveWords.religious,
    ...sensitiveWords.political
  ];

  for (const word of allWords) {
    if (text.includes(word)) {
      foundWords.push(word);
    }
  }

  return {
    hasSensitive: foundWords.length > 0,
    words: foundWords
  };
}

// 替换敏感词
export function filterSensitiveWords(text: string): string {
  let filtered = text;
  const allWords = [
    ...sensitiveWords.historical,
    ...sensitiveWords.ethnic,
    ...sensitiveWords.religious,
    ...sensitiveWords.political
  ];

  for (const word of allWords) {
    const regex = new RegExp(word, 'g');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  }

  return filtered;
}
