// 用户配额管理
export interface UserQuota {
  userId: string;
  chatCount: number;
  sceneCount: number;
  lastResetDate: string;
}

// 获取用户配额
export function getUserQuota(userId: string): UserQuota {
  const key = `quota_${userId}`;
  const cached = localStorage.getItem(key);
  const today = new Date().toDateString();

  if (cached) {
    const quota: UserQuota = JSON.parse(cached);
    // 检查是否需要重置（新的一天）
    if (quota.lastResetDate !== today) {
      return resetQuota(userId);
    }
    return quota;
  }

  return resetQuota(userId);
}

// 重置配额
function resetQuota(userId: string): UserQuota {
  const quota: UserQuota = {
    userId,
    chatCount: 0,
    sceneCount: 0,
    lastResetDate: new Date().toDateString()
  };
  localStorage.setItem(`quota_${userId}`, JSON.stringify(quota));
  return quota;
}

// 检查配额
export function checkQuota(userId: string, type: 'chat' | 'scene'): {
  allowed: boolean;
  remaining: number;
  limit: number;
} {
  // 测试模式：无限制
  return {
    allowed: true,
    remaining: 999,
    limit: 999
  };
}

// 消耗配额
export function consumeQuota(userId: string, type: 'chat' | 'scene'): boolean {
  const check = checkQuota(userId, type);
  if (!check.allowed) return false;

  const quota = getUserQuota(userId);
  if (type === 'chat') {
    quota.chatCount++;
  } else {
    quota.sceneCount++;
  }
  localStorage.setItem(`quota_${userId}`, JSON.stringify(quota));
  return true;
}
