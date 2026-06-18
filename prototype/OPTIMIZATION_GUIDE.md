# 优化说明

## 已完成的优化

### 1. 情景生成速度优化
- 默认模型从 `gpt-3.5-turbo` 升级到 `gpt-4o-mini`（更快的响应速度）
- 添加 `max_tokens: 1500` 限制，避免过长输出
- 降低 `temperature` 从 0.8 到 0.7，提高生成稳定性
- 保持流式输出，用户可实时看到生成进度

### 2. 视频播放功能
- 集成视频生成API接口（支持可图Kling等服务）
- 添加HTML5视频播放器，直接在网页中播放
- 显示视频生成提示词
- 未配置API时使用示例视频演示

## 配置方法

### 加速生成（推荐）
在 `.env.local` 中配置：
```bash
OPENAI_API_KEY=your_key
OPENAI_BASE_URL=https://api.openai.com/v1
MODEL=gpt-4o-mini
```

### 启用视频生成（可选）
```bash
KLING_API_KEY=your_kling_key
```

## 使用说明
1. 选择场景类型和风格
2. 点击"生成专属情景故事"
3. 等待流式生成完成（约10-20秒）
4. 点击"生成短视频"按钮
5. 视频生成后自动显示播放器
