export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 处理Telegram webhook请求
    if (request.method === 'POST' && url.pathname === '/') {
      const update = await request.json();
      
      // 处理/chat_id命令
      if (update.message && update.message.text === '/chat_id') {
        const chatId = update.message.chat.id;
        await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, `Chat ID: ${chatId}`);
        return new Response('OK');
      }
      
      return new Response('OK');
    }
    
    // 处理发送消息的API
    if (request.method === 'POST' && url.pathname === '/api/send_message') {
      const { chat_id_list, message } = await request.json();
      
      if (!chat_id_list || !Array.isArray(chat_id_list) || chat_id_list.length === 0 || !message) {
        return new Response(JSON.stringify({ error: 'Missing chat_id_list or message, or chat_id_list is empty' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 向所有chat_id发送消息
      const results = await Promise.allSettled(
        chat_id_list.map(chatId => sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, message))
      );
      
      // 收集详细的发送结果
      const detailedResults = results.map((result, index) => {
        const chatId = chat_id_list[index];
        if (result.status === 'fulfilled') {
          return {
            chat_id: chatId,
            status: 'success',
            response: result.value
          };
        } else {
          return {
            chat_id: chatId,
            status: 'failed',
            error: result.reason.message
          };
        }
      });
      
      // 统计成功和失败的数量
      const successCount = detailedResults.filter(r => r.status === 'success').length;
      const failedCount = detailedResults.filter(r => r.status === 'failed').length;
      
      return new Response(JSON.stringify({ 
        success: failedCount === 0,
        stats: {
          total: chat_id_list.length,
          success: successCount,
          failed: failedCount
        },
        details: detailedResults
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

async function sendTelegramMessage(botToken, chatId, message) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });
  
  const responseData = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to send message to chat_id ${chatId}: ${JSON.stringify(responseData)}`);
  }
  
  return responseData;
} 