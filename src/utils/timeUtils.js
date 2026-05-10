export const getCurrentTime = () => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export const calcWorkTime = (checkinTime, checkoutTime) => {
  const [ch, cm] = checkinTime.split(':').map(Number);
  const [oh, om] = checkoutTime.split(':').map(Number);
  const totalMin = oh * 60 + om - (ch * 60 + cm);
  if (totalMin <= 0) return '0분';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
};
