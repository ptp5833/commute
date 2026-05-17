import { useState, useEffect } from 'react';
import { buildStatusFromRecords, getTodayDateStr } from '../utils/storage';
import { getRecordsForDate, getSchedulesForDate } from '../utils/api';
import PersonCard from './PersonCard';

const SCHEDULE_CONFIG = {
  business_trip: { icon: '✈️', label: '출장', color: '#6a1b9a', bg: '#f3e5f5' },
  field_work:    { icon: '🏃', label: '외근', color: '#e65100', bg: '#fff3e0' },
  vacation:      { icon: '🌴', label: '휴가', color: '#00897b', bg: '#e0f2f1' },
};

export default function TeamStatus({ refreshKey }) {
  const [status, setStatus] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const today = getTodayDateStr();

  useEffect(() => {
    getRecordsForDate(today).then((records) => setStatus(buildStatusFromRecords(records)));
    getSchedulesForDate(today).then(setSchedules);
  }, [refreshKey]);

  const checkinCount = status.filter((p) => p.checkin).length;

  const grouped = {
    business_trip: schedules.filter((s) => s.type === 'business_trip'),
    field_work: schedules.filter((s) => s.type === 'field_work'),
    vacation: schedules.filter((s) => s.type === 'vacation'),
  };

  const hasAny = status.length > 0 || schedules.length > 0;

  return (
    <div className="team-status">
      <div className="team-status-header">
        <h2>오늘 팀 현황</h2>
        {checkinCount > 0 && (
          <span className="checkin-count">{checkinCount}명 출근</span>
        )}
      </div>

      {!hasAny ? (
        <p className="empty-msg">아직 기록이 없습니다.</p>
      ) : (
        <>
          {status.length > 0 && (
            <div className="person-card-list">
              {status.map((person) => (
                <PersonCard key={person.name} person={person} />
              ))}
            </div>
          )}

          {['business_trip', 'field_work', 'vacation'].map((type) => {
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
  );
}
