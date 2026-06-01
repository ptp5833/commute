module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Webhook URL not configured' });
  }

  // 워크플로가 "채팅 또는 채널에 메시지 게시" 액션으로 triggerBody()?['text']를
  // 텍스트 메시지로 게시한다. 텍스트 메시지여야 모바일 푸시에 내용이 노출됨
  // (Adaptive Card는 푸시에 "워크플로님이 게시했습니다"로만 표시됨).
  const payload = {
    text: message,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error('Teams webhook error:', response.status, text);
      return res.status(500).json({ error: 'Webhook failed', detail: text });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Webhook exception:', err);
    return res.status(500).json({ error: err.message });
  }
};
