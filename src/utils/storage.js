const getDateKey = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `attendance_${y}-${m}-${d}`;
};

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

const buildStatusFromRecords = (records) => {
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

export const getTeamStatusForDate = (dateStr) => {
  try {
    const data = localStorage.getItem(`attendance_${dateStr}`);
    const records = data ? JSON.parse(data) : [];
    return buildStatusFromRecords(records);
  } catch {
    return [];
  }
};
