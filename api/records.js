module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  // RLS 활성화 후에는 service_role 키가 필요(서버 전용, RLS 우회). 미설정 시 anon 키 폴백.
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
  };

  if (req.method === 'POST') {
    const r = req.body;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/attendance_records`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        name: r.name,
        location: r.location,
        type: r.type,
        time: r.time,
        date: r.date,
        work_time: r.workTime || null,
        previous_location: r.previousLocation || null,
        timestamp: r.timestamp,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const { date, dates } = req.query;

    if (dates === 'true') {
      const today = new Date();
      const dateList = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateList.push(`${y}-${m}-${day}`);
      }
      const from = dateList[dateList.length - 1];
      const to = dateList[0];

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/attendance_records?select=date&date=gte.${from}&date=lte.${to}`,
        { headers }
      );
      if (!response.ok) return res.status(500).json({ error: 'Failed to fetch dates' });

      const records = await response.json();
      const uniqueDates = [...new Set(records.map((r) => r.date))].sort((a, b) => b.localeCompare(a));
      return res.status(200).json({ dates: uniqueDates });
    }

    if (date) {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/attendance_records?date=eq.${date}&order=timestamp.asc`,
        { headers }
      );
      if (!response.ok) return res.status(500).json({ error: 'Failed to fetch records' });

      const records = await response.json();
      const converted = records.map((r) => ({
        name: r.name,
        location: r.location,
        type: r.type,
        time: r.time,
        date: r.date,
        workTime: r.work_time,
        previousLocation: r.previous_location,
        timestamp: r.timestamp,
      }));
      return res.status(200).json({ records: converted });
    }

    return res.status(400).json({ error: 'date 또는 dates 파라미터가 필요합니다' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
