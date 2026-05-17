import { useState } from 'react';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const toStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const todayStr = toStr(new Date());

export default function DateRangePicker({ startDate, endDate, onChange, minDate, maxDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [step, setStep] = useState('start');

  const getDays = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const days = Array(firstDay).fill(null);
    for (let d = 1; d <= total; d++) days.push(new Date(year, month, d));
    return days;
  };

  const handleDayClick = (date) => {
    const str = toStr(date);
    if (step === 'start') {
      onChange(str, str);
      setStep('end');
    } else {
      if (str < startDate) {
        onChange(str, str);
        setStep('end');
      } else {
        onChange(startDate, str);
        setStep('start');
      }
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const days = getDays(viewYear, viewMonth);

  return (
    <div className="drp-wrap">
      <div className="drp-hint">
        {step === 'start' ? '📅 시작일을 선택하세요' : '📅 종료일을 선택하세요'}
      </div>

      <div className="drp-header">
        <button className="drp-nav" onClick={prevMonth}>‹</button>
        <span className="drp-title">{viewYear}년 {viewMonth + 1}월</span>
        <button className="drp-nav" onClick={nextMonth}>›</button>
      </div>

      <div className="drp-weekdays">
        {WEEKDAYS.map((d, i) => (
          <span key={d} className={`drp-weekday${i === 0 ? ' drp-sun' : i === 6 ? ' drp-sat' : ''}`}>{d}</span>
        ))}
      </div>

      <div className="drp-grid">
        {days.map((date, i) => {
          if (!date) return <span key={`e${i}`} />;
          const str = toStr(date);
          const disabled = (minDate && str < minDate) || (maxDate && str > maxDate);
          const isStart = str === startDate;
          const isEnd = str === endDate && endDate !== startDate;
          const inRange = startDate && endDate && str > startDate && str < endDate;
          const isToday = str === todayStr;
          const isSun = date.getDay() === 0;
          const isSat = date.getDay() === 6;

          let cls = 'drp-day';
          if (isStart) cls += ' drp-selected drp-range-start';
          else if (isEnd) cls += ' drp-selected drp-range-end';
          else if (inRange) cls += ' drp-in-range';
          if (isToday && !isStart && !isEnd) cls += ' drp-today';
          if (disabled) cls += ' drp-disabled';
          if (isSun && !isStart && !isEnd) cls += ' drp-sun';
          if (isSat && !isStart && !isEnd) cls += ' drp-sat';

          return (
            <button
              key={str}
              className={cls}
              onClick={() => !disabled && handleDayClick(date)}
              disabled={disabled}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {startDate && (
        <div className="drp-result">
          {startDate === endDate ? startDate : `${startDate} ~ ${endDate}`}
        </div>
      )}
    </div>
  );
}
