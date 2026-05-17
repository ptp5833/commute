export const sendAttendance = async (message) => {
  const response = await fetch('/api/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || '웹훅 전송 실패');
  }

  return response.json();
};

export const buildCheckinMessage = (name, location, time) =>
  `✅ 출근 | ${name} | ${location} | ${time}`;

export const buildCheckoutMessage = (name, location, time, workTime) =>
  `🏁 퇴근 | ${name} | ${location} | ${time} | 근무 ${workTime}`;

export const buildMoveMessage = (name, fromLocation, toLocation, time) =>
  `🚗 이동 | ${name} | ${fromLocation} → ${toLocation} | ${time}`;

export const buildScheduleMessage = (name, type, detail, startDate, endDate) => {
  const icon = { vacation: '🌴', business_trip: '✈️', field_work: '🏃' }[type];
  const label = { vacation: '휴가', business_trip: '출장', field_work: '외근' }[type];
  const period = startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;
  return `${icon} ${label} | ${name} | ${detail} | ${period}`;
};
