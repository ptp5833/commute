import { useState } from 'react';
import { defaultLocations } from '../constants';
import LocationSelector from './LocationSelector';
import TeamStatus from './TeamStatus';
import { getUserTodayRecord, saveRecord } from '../utils/storage';
import { getCurrentTime, calcWorkTime } from '../utils/timeUtils';
import { sendAttendance, buildCheckinMessage, buildCheckoutMessage } from '../utils/webhook';

export default function AttendanceForm({ msalName, onLogout }) {
  const isKnownName = msalName in defaultLocations;

  const [name, setName] = useState(isKnownName ? msalName : '');
  const [nameConfirmed, setNameConfirmed] = useState(isKnownName);
  const [location, setLocation] = useState(defaultLocations[msalName] || '2판연');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [flashMsg, setFlashMsg] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const { checkin, checkout } = nameConfirmed
    ? getUserTodayRecord(name)
    : { checkin: undefined, checkout: undefined };

  const showFlash = (msg) => {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(''), 3500);
  };

  const handleCheckin = async () => {
    if (checkin) return showFlash('이미 출근 기록이 있습니다.');
    setLoading(true);
    try {
      const time = getCurrentTime();
      const msg = buildCheckinMessage(name, location, time);
      await sendAttendance(msg);
      saveRecord({ name, location, type: 'checkin', time, timestamp: Date.now() });
      setRefreshKey((k) => k + 1);
      showFlash(`✅ 출근 완료! (${time})`);
    } catch (err) {
      showFlash(`전송 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!checkin) return showFlash('먼저 출근 체크를 해주세요.');
    if (checkout) return showFlash('이미 퇴근 기록이 있습니다.');
    setLoading(true);
    try {
      const time = getCurrentTime();
      const workTime = calcWorkTime(checkin.time, time);
      const msg = buildCheckoutMessage(name, location, time, workTime);
      await sendAttendance(msg);
      saveRecord({ name, location, type: 'checkout', time, workTime, timestamp: Date.now() });
      setRefreshKey((k) => k + 1);
      showFlash(`🏁 퇴근 완료! 근무 ${workTime}`);
    } catch (err) {
      showFlash(`전송 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setName(trimmed);
    setNameConfirmed(true);
  };

  if (!nameConfirmed) {
    return (
      <div className="app-container">
        <div className="card name-setup-card">
          <div className="name-setup-icon">👤</div>
          <h2>이름 확인</h2>
          <p>
            Microsoft 계정 이름(<strong>{msalName || '알 수 없음'}</strong>)이<br />
            팀원 목록에 없습니다. 이름을 직접 입력해주세요.
          </p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="예: 홍길동"
            className="name-input"
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmName()}
            autoFocus
          />
          <div className="name-setup-location">
            <span className="info-label">지역</span>
            <LocationSelector location={location} onChange={setLocation} />
          </div>
          <button
            className="btn-confirm-name"
            disabled={!nameInput.trim()}
            onClick={handleConfirmName}
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <span className="header-title">근태 체크</span>
        <button className="btn-logout" onClick={onLogout}>로그아웃</button>
      </header>

      <div className="card attendance-card">
        <div className="user-info">
          <div className="info-row">
            <span className="info-label">이름</span>
            <span className="info-value">{name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">지역</span>
            <LocationSelector location={location} onChange={setLocation} />
          </div>
        </div>

        {checkin && (
          <div className="record-info">
            <div className="record-item">
              <span className="record-label">출근</span>
              <span className="record-val">{checkin.time}</span>
            </div>
            {checkout && (
              <>
                <div className="record-divider" />
                <div className="record-item">
                  <span className="record-label">퇴근</span>
                  <span className="record-val">{checkout.time}</span>
                </div>
                <div className="record-divider" />
                <div className="record-item">
                  <span className="record-label">근무</span>
                  <span className="record-val record-work">{checkout.workTime}</span>
                </div>
              </>
            )}
          </div>
        )}

        {flashMsg && <div className="flash-message">{flashMsg}</div>}

        <div className="button-group">
          <button
            className={`btn-attendance btn-checkin${checkin ? ' btn-done' : ''}`}
            onClick={handleCheckin}
            disabled={loading || !!checkin}
          >
            {loading && !checkin ? '⏳' : checkin ? '✅ 출근완료' : '출근'}
          </button>
          <button
            className={`btn-attendance btn-checkout${checkout ? ' btn-done' : ''}`}
            onClick={handleCheckout}
            disabled={loading || !checkin || !!checkout}
          >
            {loading && checkin && !checkout ? '⏳' : checkout ? '🏁 퇴근완료' : '퇴근'}
          </button>
        </div>
      </div>

      <TeamStatus refreshKey={refreshKey} />
    </div>
  );
}
