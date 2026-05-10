import { useState } from 'react';
import { getHistoryDates, getTeamStatusForDate } from '../utils/storage';
import PersonCard from './PersonCard';

const formatDateKR = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = days[date.getDay()];
  return `${m}월 ${d}일 (${day})`;
};

const getTodayStr = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function AttendanceHistory({ onClose }) {
  const dates = getHistoryDates();
  const todayStr = getTodayStr();
  const [selectedDate, setSelectedDate] = useState(dates[0] || '');

  const status = selectedDate ? getTeamStatusForDate(selectedDate) : [];
  const checkinCount = status.filter((p) => p.checkin).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>근태 History</h2>
          <button className="btn-modal-close" onClick={onClose}>✕</button>
        </div>

        {dates.length === 0 ? (
          <p className="empty-msg" style={{ padding: '2rem 0' }}>최근 2주간 기록이 없습니다.</p>
        ) : (
          <>
            <div className="date-tabs">
              {dates.map((d) => (
                <button
                  key={d}
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

            {status.length === 0 ? (
              <p className="empty-msg">기록이 없습니다.</p>
            ) : (
              <div className="person-card-list">
                {status.map((person) => (
                  <PersonCard key={person.name} person={person} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
