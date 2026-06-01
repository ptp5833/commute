export const getTodayDateStr = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDateKey = () => `attendance_${getTodayDateStr()}`;

export const getTodayRecords = () => {
  try {
    const data = localStorage.getItem(getDateKey());
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveRecord = (record) => {
  const records = getTodayRecords();
  records.push(record);
  localStorage.setItem(getDateKey(), JSON.stringify(records));
};

export const getUserTodayRecord = (name) => {
  const records = getTodayRecords();
  const checkin = records.find((r) => r.name === name && r.type === 'checkin');
  const checkout = records.find((r) => r.name === name && r.type === 'checkout');
  return { checkin, checkout };
};

// 오늘 기록 중 해당 사용자의 가장 마지막 위치(이동/출근 반영)를 반환.
// 앱 재마운트/새로고침 후에도 현재 지역을 복원하기 위함.
export const getUserCurrentLocation = (name) => {
  if (!name) return undefined;
  const records = getTodayRecords();
  let location;
  for (const r of records) {
    if (r.name === name && r.location) location = r.location;
  }
  return location;
};

export const buildStatusFromRecords = (records) => {
  const statusMap = {};
  for (const record of records) {
    if (!statusMap[record.name]) {
      statusMap[record.name] = { name: record.name, location: record.location, events: [] };
    }
    statusMap[record.name].location = record.location;
    statusMap[record.name].events.push(record);
    if (record.type === 'checkin') {
      statusMap[record.name].checkin = record.time;
    } else if (record.type === 'checkout') {
      statusMap[record.name].checkout = record.time;
      statusMap[record.name].workTime = record.workTime;
    }
  }
  return Object.values(statusMap).sort((a, b) => {
    if (a.checkin && b.checkin) return a.checkin.localeCompare(b.checkin);
    if (a.checkin) return -1;
    if (b.checkin) return 1;
    return a.name.localeCompare(b.name);
  });
};

export const getTeamStatus = () => buildStatusFromRecords(getTodayRecords());

export const getHistoryDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    if (localStorage.getItem(`attendance_${dateStr}`)) {
      dates.push(dateStr);
    }
  }
  return dates;
};

const MANUAL_USER_KEY = 'attendance_manual_user';
export const getManualUser = () => {
  try {
    const d = localStorage.getItem(MANUAL_USER_KEY);
    return d ? JSON.parse(d) : null;
  } catch { return null; }
};
export const saveManualUser = (name, location) => {
  localStorage.setItem(MANUAL_USER_KEY, JSON.stringify({ name, location }));
};
export const clearManualUser = () => {
  localStorage.removeItem(MANUAL_USER_KEY);
};

export const getTeamStatusForDate = (dateStr) => {
  try {
    const data = localStorage.getItem(`attendance_${dateStr}`);
    const records = data ? JSON.parse(data) : [];
    return buildStatusFromRecords(records);
  } catch {
    return [];
  }
};
