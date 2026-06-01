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

  // 이 Teams 워크플로 웹후크는 요청 본문 자체를 Adaptive Card로 취급한다.
  // (message/attachments 래퍼로 보내면 "Attachments is null" 분기로 빠져
  //  InvalidBotAdaptiveCard - Property 'type' must be 'AdaptiveCard' 오류 발생)
  const payload = {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: message,
        wrap: true,
      },
    ],
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
