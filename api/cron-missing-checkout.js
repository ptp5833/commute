// 매일 오전 9시(KST) 실행되는 Cron.
// 직전 근무일(주말 제외)에 출근은 찍었으나 퇴근을 안 찍은 팀원을 찾아,
// 그날 일정(휴가/출장/외근/교육)이 등록된 사람은 제외한 뒤,
// 멘션용 워크플로 웹후크(REMINDER_WEBHOOK_URL)로 명단을 보낸다.

// 팀원 이름 → 회사 이메일(Teams 로그인 계정/UPN). @멘션 토큰 생성에 사용.
// 이메일이 비어 있으면 멘션 대상에서 제외된다.
const ROSTER = {
  '김기헌': '',
  '이석주': '',
  '신영수': '',
  '이윤열': '',
  '천상호': '',
  '주용현': '',
  '나재호': '',
  '권철': '',
  '권병철': '',
  '김영범': '',
  '김진구': '',
  '황혜미': 'hyemi.hwang@ligmirae.com',
  '서윤경': '',
  '김화성': '',
  '이주연': '',
  '표정호': '',
};

// KST(UTC+9) 기준 현재 시각. getUTC* 메서드로 읽으면 KST 벽시계가 된다.
function kstNow() {
  return new Date(Date.now() + 9 * 3600 * 1000);
}

function fmtDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 직전 근무일(토·일 제외)의 날짜 문자열
function prevWorkingDayStr(kst) {
  const d = new Date(kst);
  do {
    d.setUTCDate(d.getUTCDate() - 1);
  } while (d.getUTCDay() === 0 || d.getUTCDay() === 6); // 0=일, 6=토
  return fmtDate(d);
}

module.exports = async function handler(req, res) {
  // Vercel Cron 호출 검증 (CRON_SECRET 설정 시). 수동 테스트는 ?date=YYYY-MM-DD 허용.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  // RLS 활성화 후에는 service_role 키가 필요(서버 전용, RLS 우회). 미설정 시 anon 키 폴백.
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const REMINDER_WEBHOOK_URL = process.env.REMINDER_WEBHOOK_URL;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  if (!REMINDER_WEBHOOK_URL) {
    return res.status(500).json({ error: 'REMINDER_WEBHOOK_URL not configured' });
  }

  const sbHeaders = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  // 대상 날짜: 수동 override(?date=) 우선, 없으면 직전 근무일
  const targetDate = (req.query && req.query.date) || prevWorkingDayStr(kstNow());

  try {
    // 1) 대상일 출퇴근 기록
    const recRes = await fetch(
      `${SUPABASE_URL}/rest/v1/attendance_records?date=eq.${targetDate}&order=timestamp.asc`,
      { headers: sbHeaders }
    );
    if (!recRes.ok) {
      return res.status(500).json({ error: 'Failed to fetch records', detail: await recRes.text() });
    }
    const records = await recRes.json();

    // 2) 대상일 일정(해당일 포함 기간) — 이 사람들은 제외
    const schRes = await fetch(
      `${SUPABASE_URL}/rest/v1/schedules?start_date=lte.${targetDate}&end_date=gte.${targetDate}`,
      { headers: sbHeaders }
    );
    if (!schRes.ok) {
      return res.status(500).json({ error: 'Failed to fetch schedules', detail: await schRes.text() });
    }
    const schedules = await schRes.json();
    const scheduledNames = new Set(schedules.map((s) => s.name));

    // 3) 출근O & 퇴근X 인 사람 추출
    const hasCheckin = new Set();
    const hasCheckout = new Set();
    for (const r of records) {
      if (r.type === 'checkin') hasCheckin.add(r.name);
      if (r.type === 'checkout') hasCheckout.add(r.name);
    }

    const missing = [];
    for (const name of hasCheckin) {
      if (hasCheckout.has(name)) continue;     // 퇴근 찍음 → 제외
      if (scheduledNames.has(name)) continue;  // 그날 일정 있음 → 제외
      const email = ROSTER[name];
      missing.push({ name, email: email || null });
    }

    // 멘션 가능한(이메일 있는) 사람만 워크플로로 전송
    const mentionable = missing.filter((m) => m.email);

    if (mentionable.length === 0) {
      return res.status(200).json({
        date: targetDate,
        sent: false,
        reason: 'no mentionable missing-checkout members',
        missingAll: missing, // 이메일 없는 사람 포함(디버깅용)
      });
    }

    // 4) 멘션용 웹후크로 전송
    const payload = {
      date: targetDate,
      emails: mentionable.map((m) => m.email),
      names: mentionable.map((m) => m.name),
    };

    const hookRes = await fetch(REMINDER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const hookText = await hookRes.text();
    if (!hookRes.ok) {
      return res.status(500).json({ error: 'Reminder webhook failed', detail: hookText });
    }

    return res.status(200).json({ date: targetDate, sent: true, ...payload, missingAll: missing });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
