export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: unknown): string {
  if (error instanceof APIError) {
    return error.userMessage || '服务暂时不可用，请稍后再试';
  }

  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return 'API配置错误，请联系管理员';
    }
    if (error.message.includes('rate limit')) {
      return '请求过于频繁，请稍后再试';
    }
    if (error.message.includes('timeout')) {
      return '请求超时，请重试';
    }
  }

  return '发生未知错误，请重试';
}
