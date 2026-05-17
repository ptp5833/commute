module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const headers = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  if (req.method === 'POST') {
    const s = req.body;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/schedules`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({
        name: s.name,
        type: s.type,
        sub_type: s.subType || null,
        location: s.location || null,
        start_date: s.startDate,
        end_date: s.endDate,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }
    return res.status(200).json({ success: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id 파라미터가 필요합니다' });

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/schedules?id=eq.${id}`,
      { method: 'DELETE', headers }
    );
    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const { date, name, from } = req.query;

    if (name) {
      const fromDate = from || new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/schedules?name=eq.${encodeURIComponent(name)}&end_date=gte.${fromDate}&order=start_date.asc`,
        { headers }
      );
      if (!response.ok) return res.status(500).json({ error: 'Failed to fetch schedules' });

      const rows = await response.json();
      const schedules = rows.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        subType: s.sub_type,
        location: s.location,
        startDate: s.start_date,
        endDate: s.end_date,
      }));
      return res.status(200).json({ schedules });
    }

    if (date) {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/schedules?start_date=lte.${date}&end_date=gte.${date}&order=name.asc`,
        { headers }
      );
      if (!response.ok) return res.status(500).json({ error: 'Failed to fetch schedules' });

      const rows = await response.json();
      const schedules = rows.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        subType: s.sub_type,
        location: s.location,
        startDate: s.start_date,
        endDate: s.end_date,
      }));
      return res.status(200).json({ schedules });
    }

    return res.status(400).json({ error: 'date 또는 name 파라미터가 필요합니다' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
