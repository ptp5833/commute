export const getCurrentTime = () => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const LUNCH_CUTOFF_MIN = 13 * 60 + 30; // 13:30
const LUNCH_DEDUCTION_MIN = 60; // 점심시간 1시간

export const calcWorkTime = (checkinTime, checkoutTime) => {
  const [ch, cm] = checkinTime.split(':').map(Number);
  const [oh, om] = checkoutTime.split(':').map(Number);
  const checkoutMin = oh * 60 + om;
  let totalMin = checkoutMin - (ch * 60 + cm);
  // 퇴근이 13:30 이후이면 점심시간(1시간)을 근무시간에서 제외
  if (checkoutMin >= LUNCH_CUTOFF_MIN) {
    totalMin -= LUNCH_DEDUCTION_MIN;
  }
  if (totalMin <= 0) return '0분';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
};
