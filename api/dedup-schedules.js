// [일회성 유지보수 엔드포인트] 중복 일정 정리.
// 동일 일정(이름·종류·세부유형·장소·기간 일치)이 여러 건이면 가장 오래된 1건만 남기고 삭제.
// 정확히 동일한 중복만 제거하므로 실데이터는 손상되지 않음.
// 사용 후 이 파일은 삭제할 것.
//
//   GET /api/dedup-schedules?token=...            → dry-run(삭제 안 함, 목록만)
//   GET /api/dedup-schedules?token=...&apply=true → 실제 삭제

const TOKEN = 'f9d82c9799b43669373be0a78ffe2f65';

module.exports = async function handler(req, res) {
  if ((req.query && req.query.token) !== TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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

  const apply = req.query.apply === 'true';

  try {
    const listRes = await fetch(`${SUPABASE_URL}/rest/v1/schedules?select=*&order=id.asc`, { headers });
    if (!listRes.ok) {
      return res.status(500).json({ error: 'fetch failed', detail: await listRes.text() });
    }
    const rows = await listRes.json();

    const keyOf = (r) =>
      [r.name, r.type, r.sub_type || '', r.location || '', r.start_date, r.end_date].join('||');

    const groups = new Map();
    for (const r of rows) {
      const k = keyOf(r);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    }

    const dupGroups = [];
    const toDelete = [];
    for (const [, list] of groups) {
      if (list.length > 1) {
        const sorted = [...list].sort((a, b) => (a.id > b.id ? 1 : -1));
        const keep = sorted[0];
        const dups = sorted.slice(1);
        dupGroups.push({
          name: keep.name,
          type: keep.type,
          subType: keep.sub_type,
          location: keep.location,
          startDate: keep.start_date,
          endDate: keep.end_date,
          count: list.length,
          keepId: keep.id,
          deleteIds: dups.map((d) => d.id),
        });
        toDelete.push(...dups.map((d) => d.id));
      }
    }

    let deleted = 0;
    let failed = 0;
    if (apply && toDelete.length > 0) {
      for (const id of toDelete) {
        const dRes = await fetch(`${SUPABASE_URL}/rest/v1/schedules?id=eq.${id}`, {
          method: 'DELETE',
          headers,
        });
        if (dRes.ok) deleted++;
        else failed++;
      }
    }

    return res.status(200).json({
      mode: apply ? 'apply' : 'dryrun',
      totalRows: rows.length,
      duplicateGroups: dupGroups.length,
      toDeleteCount: toDelete.length,
      deleted,
      failed,
      groups: dupGroups,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
