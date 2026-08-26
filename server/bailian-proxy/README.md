# 十一说百炼安全中转

这个服务把百炼长期 API Key 留在云端，只向手机 App 暴露可撤销、可限频的访问口令。它固定使用：

- 对话：`qwen3.7-plus`，关闭思考模式，使用严格 JSON Schema
- 动态语音：不经过中转；Android APK 使用内置 `Kokoro-82M INT8 / af_sky` 本地少女声

## 环境变量

复制 `.env.example` 中的变量到阿里云函数计算环境变量。真实值不要保存进 Git、网页或 APK。

- `DASHSCOPE_API_KEY`：北京地域百炼 API Key
- `DASHSCOPE_BASE_URL`：北京业务空间专属 OpenAI 兼容 Base URL
- `SAY01_ACCESS_TOKEN`：至少 24 位的随机口令；手机只保存这个可撤销口令
- `SAY01_ALLOWED_ORIGINS`：允许调用的网页/Android WebView Origin，以英文逗号分隔
- `SAY01_REQUESTS_PER_MINUTE`：单实例、单 IP 每分钟上限，默认 30

## 运行方式

该目录无第三方依赖，使用 Node.js 20 或更高版本：

```bash
npm start
```

默认监听 `PORT` 环境变量，未设置时为 `9000`。除 CORS 预检外，GET 健康检查和 POST 对话请求都必须携带 `Authorization: Bearer <SAY01_ACCESS_TOKEN>`；健康响应不包含密钥或用户内容。

阿里云函数计算可采用 Web 函数或自定义运行时，启动命令为：

```text
node server/bailian-proxy/server.mjs
```

部署完成后，把函数的 HTTPS 公网地址和 `SAY01_ACCESS_TOKEN` 填入十一说的“AI 陪练连接”。不要把 `DASHSCOPE_API_KEY` 填进手机。`SAY01_` 环境变量前缀作为内部兼容标识暂时保留，避免现有部署配置失效。

## 已有保护

- 文字模型固定，客户端不能自行改成其他模型
- 对话、历史和记忆条数均有长度上限
- 严格来源检查、Bearer 口令、请求体上限、单 IP 限频和无缓存响应
- 日志只记录模型、Token 数量和错误码，不记录用户对话原文
- 服务端不接收语音合成请求；英文回复只在 Android 本机离线朗读

当前限频是单实例内存保护，不等同于全局网关。正式多人使用前仍应在阿里云 API 网关或函数层增加总配额、每日预算和费用告警。
