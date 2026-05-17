import { useState, useEffect, useRef } from 'react';
import { buildStatusFromRecords, getTodayDateStr } from '../utils/storage';
import { getRecordsForDate, getSchedulesForDate } from '../utils/api';
import PersonCard from './PersonCard';

const SCHEDULE_CONFIG = {
  business_trip: { icon: '✈️', label: '출장', color: '#6a1b9a', bg: '#f3e5f5' },
  field_work:    { icon: '🏃', label: '외근', color: '#e65100', bg: '#fff3e0' },
  education:     { icon: '📚', label: '교육', color: '#1565c0', bg: '#e3f2fd' },
  vacation:      { icon: '🌴', label: '휴가', color: '#00897b', bg: '#e0f2f1' },
};

const generateDateRange = () => {
  const dates = [];
  const today = new Date();
  for (let i = -14; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
};

const formatDateKR = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = days[date.getDay()];
  return `${m}월 ${d}일 (${day})`;
};

export default function AttendanceHistory({ onClose }) {
  const todayStr = getTodayDateStr();
  const dates = generateDateRange();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [status, setStatus] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const todayTabRef = useRef(null);

  useEffect(() => {
    todayTabRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getRecordsForDate(selectedDate),
      getSchedulesForDate(selectedDate),
    ]).then(([records, scheds]) => {
      setStatus(buildStatusFromRecords(records));
      setSchedules(scheds);
      setLoading(false);
    });
  }, [selectedDate]);

  const checkinCount = status.filter((p) => p.checkin).length;
  const grouped = {
    business_trip: schedules.filter((s) => s.type === 'business_trip'),
    field_work: schedules.filter((s) => s.type === 'field_work'),
    education: schedules.filter((s) => s.type === 'education'),
    vacation: schedules.filter((s) => s.type === 'vacation'),
  };
  const hasAny = status.length > 0 || schedules.length > 0;

  return (
    <div className="history-page">
      <div className="history-page-header">
        <div style={{ width: 40 }} />
        <h2>근태 History</h2>
        <button className="btn-close-page" onClick={() => window.history.back()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="history-page-body">
        <div className="date-tabs">
          {dates.map((d) => (
            <button
              key={d}
              ref={d === todayStr ? todayTabRef : null}
              className={`date-tab${selectedDate === d ? ' date-tab-active' : ''}${d === todayStr ? ' date-tab-today' : ''}`}
              onClick={() => setSelectedDate(d)}
            >
              {d === todayStr ? '오늘' : formatDateKR(d)}
            </button>
          ))}
        </div>

        <div className="history-date-label">
          {selectedDate && formatDateKR(selectedDate)}
          {selectedDate === todayStr && <span className="today-badge">오늘</span>}
          {checkinCount > 0 && (
            <span className="checkin-count" style={{ marginLeft: 'auto' }}>{checkinCount}명 출근</span>
          )}
        </div>

        {loading ? (
          <p className="empty-msg">불러오는 중...</p>
        ) : !hasAny ? (
          <p className="empty-msg">기록이 없습니다.</p>
        ) : (
          <>
            {status.length > 0 && (
              <div className="person-card-list">
                {status.map((person) => (
                  <PersonCard key={person.name} person={person} />
                ))}
              </div>
            )}

            {['business_trip', 'field_work', 'education', 'vacation'].map((type) => {
              const items = grouped[type];
              if (items.length === 0) return null;
              const { icon, label, color, bg } = SCHEDULE_CONFIG[type];
              return (
                <div key={type} className="schedule-section">
                  <div className="schedule-section-header" style={{ color, background: bg }}>
                    <span>{icon} {label}</span>
                    <span>{items.length}명</span>
                  </div>
                  <div className="schedule-list">
                    {items.map((s, i) => (
                      <div key={i} className="schedule-item">
                        <span className="schedule-name">{s.name}</span>
                        <span className="schedule-detail">
                          {s.type === 'vacation' ? s.subType : s.location}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
