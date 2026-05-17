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
