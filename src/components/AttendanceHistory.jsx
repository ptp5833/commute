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

const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateKR = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}월 ${d}일 (${days[date.getDay()]})`;
};

const formatShortDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getDate()}\n${days[date.getDay()]}`;
};

const generateDateRange = () => {
  const dates = [];
  const today = new Date();
  for (let i = -14; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(toDateStr(d));
  }
  return dates;
};

const getWeekDates = (weekOffset = 0) => {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + weekOffset * 7);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateStr(d);
  });
};

export default function AttendanceHistory() {
  const todayStr = getTodayDateStr();
  const [viewMode, setViewMode] = useState('weekly');

  // daily state
  const dates = generateDateRange();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [status, setStatus] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const todayTabRef = useRef(null);

  // weekly state
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekMatrix, setWeekMatrix] = useState([]);
  const [weekDates, setWeekDates] = useState([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  // daily: scroll to today on mount
  useEffect(() => {
    if (viewMode === 'daily') {
      setTimeout(() => {
        todayTabRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 50);
    }
  }, [viewMode]);

  // daily: fetch on date change
  useEffect(() => {
    if (viewMode !== 'daily') return;
    setLoadingDaily(true);
    Promise.all([getRecordsForDate(selectedDate), getSchedulesForDate(selectedDate)])
      .then(([records, scheds]) => {
        setStatus(buildStatusFromRecords(records));
        setSchedules(scheds);
        setLoadingDaily(false);
      });
  }, [selectedDate, viewMode]);

  // weekly: fetch on weekOffset change
  useEffect(() => {
    if (viewMode !== 'weekly') return;
    const wd = getWeekDates(weekOffset);
    setWeekDates(wd);
    setLoadingWeekly(true);
    Promise.all(
      wd.map((date) =>
        Promise.all([getRecordsForDate(date), getSchedulesForDate(date)])
          .then(([records, scheds]) => ({ date, records, scheds }))
      )
    ).then((results) => {
      const namesSet = new Set();
      results.forEach(({ records, scheds }) => {
        records.forEach((r) => namesSet.add(r.name));
        scheds.forEach((s) => namesSet.add(s.name));
      });
      const names = [...namesSet].sort();
      const matrix = names.map((name) => ({
        name,
        days: results.map(({ date, records, scheds }) => {
          const sched = scheds.find((s) => s.name === name);
          if (sched) return SCHEDULE_CONFIG[sched.type]?.icon || '📅';
          if (records.some((r) => r.name === name && r.type === 'checkin')) return '✅';
          if (date > todayStr) return '';
          return '—';
        }),
      }));
      setWeekMatrix(matrix);
      setLoadingWeekly(false);
    });
  }, [weekOffset, viewMode]);

  const grouped = {
    business_trip: schedules.filter((s) => s.type === 'business_trip'),
    field_work: schedules.filter((s) => s.type === 'field_work'),
    education: schedules.filter((s) => s.type === 'education'),
    vacation: schedules.filter((s) => s.type === 'vacation'),
  };
  const hasAny = status.length > 0 || schedules.length > 0;
  const checkinCount = status.filter((p) => p.checkin).length;

  const weekLabel = weekDates.length === 5
    ? `${formatDateKR(weekDates[0]).replace(/\(.\)/, '')}~ ${formatDateKR(weekDates[4]).replace(/\(.\)/, '')}`
    : '';

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
        {/* 뷰 모드 탭 */}
        <div className="history-view-tabs">
          <button
            className={`history-view-tab${viewMode === 'weekly' ? ' active' : ''}`}
            onClick={() => setViewMode('weekly')}
          >
            주간 요약
          </button>
          <button
            className={`history-view-tab${viewMode === 'daily' ? ' active' : ''}`}
            onClick={() => setViewMode('daily')}
          >
            일별 상세
          </button>
        </div>

        {/* 주간 요약 뷰 */}
        {viewMode === 'weekly' && (
          <>
            <div className="week-nav">
              <button className="week-nav-btn" onClick={() => setWeekOffset((o) => o - 1)}>‹</button>
              <span className="week-nav-label">{weekLabel}</span>
              <button className="week-nav-btn" onClick={() => setWeekOffset((o) => o + 1)}>›</button>
            </div>
            {weekOffset !== 0 && (
              <button className="btn-this-week" onClick={() => setWeekOffset(0)}>이번주로</button>
            )}

            {loadingWeekly ? (
              <p className="empty-msg">불러오는 중...</p>
            ) : weekMatrix.length === 0 ? (
              <p className="empty-msg">이번 주 기록이 없습니다.</p>
            ) : (
              <div className="weekly-table-wrap">
                <table className="weekly-table">
                  <thead>
                    <tr>
                      <th className="wt-name-col">이름</th>
                      {weekDates.map((d) => (
                        <th key={d} className={`wt-day-col${d === todayStr ? ' wt-today' : ''}`}>
                          {formatShortDate(d).split('\n').map((line, i) => (
                            <span key={i} style={{ display: 'block' }}>{line}</span>
                          ))}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weekMatrix.map(({ name, days }) => (
                      <tr key={name}>
                        <td className="wt-name">{name}</td>
                        {days.map((icon, i) => (
                          <td key={i} className={`wt-cell${weekDates[i] === todayStr ? ' wt-today' : ''}`}>
                            {icon}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="weekly-legend">
              <span>✅ 출근</span>
              <span>🌴 휴가</span>
              <span>✈️ 출장</span>
              <span>🏃 외근</span>
              <span>📚 교육</span>
              <span>— 미출근</span>
            </div>
          </>
        )}

        {/* 일별 상세 뷰 */}
        {viewMode === 'daily' && (
          <>
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

            {loadingDaily ? (
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
          </>
        )}
      </div>
    </div>
  );
}
