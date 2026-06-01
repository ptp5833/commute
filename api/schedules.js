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

    // 중복 방지: 동일 일정(이름·종류·기간 일치)이 이미 있으면 재삽입하지 않음.
    // 더블 탭/중복 제출로 같은 일정이 여러 건 쌓이는 것을 서버에서 차단(멱등성).
    const dupRes = await fetch(
      `${SUPABASE_URL}/rest/v1/schedules?name=eq.${encodeURIComponent(s.name)}` +
        `&type=eq.${encodeURIComponent(s.type)}` +
        `&start_date=eq.${s.startDate}&end_date=eq.${s.endDate}`,
      { headers }
    );
    if (dupRes.ok) {
      const existing = await dupRes.json();
      const dup = existing.some(
        (e) => (e.sub_type || null) === (s.subType || null) && (e.location || null) === (s.location || null)
      );
      if (dup) {
        return res.status(200).json({ success: true, deduped: true });
      }
    }

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
