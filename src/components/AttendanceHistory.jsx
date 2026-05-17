import { useState, useEffect } from 'react';
import { buildStatusFromRecords, getTodayDateStr } from '../utils/storage';
import { getHistoryDatesFromServer, getRecordsForDate } from '../utils/api';
import PersonCard from './PersonCard';

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
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [status, setStatus] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    getHistoryDatesFromServer().then((d) => {
      setDates(d);
      if (d.length > 0) setSelectedDate(d[0]);
      setLoadingDates(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingRecords(true);
    getRecordsForDate(selectedDate).then((records) => {
      setStatus(buildStatusFromRecords(records));
      setLoadingRecords(false);
    });
  }, [selectedDate]);

  const checkinCount = status.filter((p) => p.checkin).length;

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
        {loadingDates ? (
          <p className="empty-msg" style={{ padding: '2rem 0' }}>불러오는 중...</p>
        ) : dates.length === 0 ? (
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

            {loadingRecords ? (
              <p className="empty-msg">불러오는 중...</p>
            ) : status.length === 0 ? (
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
