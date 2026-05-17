export const saveRecordToServer = async (record) => {
  try {
    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch (err) {
    console.error('서버 저장 실패:', err);
  }
};

export const getRecordsForDate = async (dateStr) => {
  try {
    const res = await fetch(`/api/records?date=${dateStr}`);
    if (!res.ok) return [];
    const { records } = await res.json();
    return records || [];
  } catch {
    return [];
  }
};

export const getHistoryDatesFromServer = async () => {
  try {
    const res = await fetch('/api/records?dates=true');
    if (!res.ok) return [];
    const { dates } = await res.json();
    return dates || [];
  } catch {
    return [];
  }
};

export const saveSchedule = async (schedule) => {
  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '등록 실패');
  }
};

export const getSchedulesForDate = async (dateStr) => {
  try {
    const res = await fetch(`/api/schedules?date=${dateStr}`);
    if (!res.ok) return [];
    const { schedules } = await res.json();
    return schedules || [];
  } catch {
    return [];
  }
};

export const getMySchedules = async (name, fromDate) => {
  try {
    const res = await fetch(`/api/schedules?name=${encodeURIComponent(name)}&from=${fromDate}`);
    if (!res.ok) return [];
    const { schedules } = await res.json();
    return schedules || [];
  } catch {
    return [];
  }
};

export const deleteSchedule = async (id) => {
  const res = await fetch(`/api/schedules?id=${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '삭제 실패');
  }
};
