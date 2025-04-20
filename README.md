# ViperRTPBot Telegram Bot

这是一个运行在Cloudflare Workers上的Telegram Bot后端服务。

## 功能

1. `/chat_id` 命令：返回当前聊天的chat_id
2. 消息发送API：通过HTTP POST请求向多个chat_id发送消息

## 配置步骤

1. 安装Wrangler CLI：
```bash
npm install -g wrangler
```

2. 配置Telegram Bot Token：
   - 在 `wrangler.toml` 文件中设置 `TELEGRAM_BOT_TOKEN` 变量
   - 或者使用Wrangler CLI设置：
```bash
wrangler secret put TELEGRAM_BOT_TOKEN
```

3. 部署到Cloudflare Workers：
```bash
wrangler deploy
```

4. 设置Telegram Webhook：
```bash
curl -F "url=https://XXX.viperrtp.workers.dev" https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
```

## API使用说明

### 发送消息

发送POST请求到 `https://XXX.viperrtp.workers.dev/api/send_message`

请求体格式：
```json
{
  "chat_id_list": ["123456789", "987654321"],
  "message": "要发送的消息内容"
}
```

响应格式：
```json
{
  "success": true,
  "stats": {
    "total": 2,
    "success": 2,
    "failed": 0
  },
  "details": [
    {
      "chat_id": "123456789",
      "status": "success",
      "response": {
        "ok": true,
        "result": {
          "message_id": 123,
          "chat": {
            "id": 123456789
          }
        }
      }
    },
    {
      "chat_id": "987654321",
      "status": "failed",
      "error": "Failed to send message to chat_id 987654321: {\"ok\":false,\"error_code\":400,\"description\":\"Bad Request: chat not found\"}"
    }
  ]
}
```

## 错误处理

如果请求缺少必要参数，将返回400错误：
```json
{
  "error": "Missing chat_id_list or message, or chat_id_list is empty"
}
```

如果消息发送失败，响应中的 `details` 字段会包含每个chat_id的详细发送状态和错误信息。 