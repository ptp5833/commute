import { useState, useEffect } from 'react';
import { defaultLocations } from '../constants';
import LocationSelector from './LocationSelector';
import TeamStatus from './TeamStatus';
import AttendanceHistory from './AttendanceHistory';
import { getUserTodayRecord, saveRecord, getTodayDateStr } from '../utils/storage';
import { saveRecordToServer, saveSchedule } from '../utils/api';
import { getCurrentTime, calcWorkTime } from '../utils/timeUtils';
import { sendAttendance, buildCheckinMessage, buildCheckoutMessage, buildMoveMessage } from '../utils/webhook';
import { locationOptions } from '../constants';

export default function AttendanceForm({ msalName, onLogout, initialNameConfirmed, defaultLocation, onNameConfirmed }) {
  const isKnownName = msalName in defaultLocations || !!initialNameConfirmed;

  const [name, setName] = useState(isKnownName ? msalName : '');
  const [nameConfirmed, setNameConfirmed] = useState(isKnownName);
  const [location, setLocation] = useState(defaultLocation || defaultLocations[msalName] || '2판연');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [flashMsg, setFlashMsg] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showMovePanel, setShowMovePanel] = useState(false);
  const [moveLocation, setMoveLocation] = useState('');
  const [moveCustom, setMoveCustom] = useState('');
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [scheduleType, setScheduleType] = useState('vacation');
  const [scheduleSubType, setScheduleSubType] = useState('연차');
  const [scheduleStartDate, setScheduleStartDate] = useState(getTodayDateStr());
  const [scheduleEndDate, setScheduleEndDate] = useState(getTodayDateStr());
  const [scheduleLocation, setScheduleLocation] = useState('');

  const { checkin, checkout } = nameConfirmed
    ? getUserTodayRecord(name)
    : { checkin: undefined, checkout: undefined };

  const openHistory = () => {
    window.history.pushState({ page: 'history' }, '');
    setShowHistory(true);
  };

  const closeHistory = () => {
    setShowHistory(false);
  };

  useEffect(() => {
    if (!showHistory) return;
    const handlePopState = () => setShowHistory(false);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showHistory]);

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
      const record = { name, location, type: 'checkin', time, date: getTodayDateStr(), timestamp: Date.now() };
      saveRecord(record);
      saveRecordToServer(record);
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
      const record = { name, location, type: 'checkout', time, workTime, date: getTodayDateStr(), timestamp: Date.now() };
      saveRecord(record);
      saveRecordToServer(record);
      setRefreshKey((k) => k + 1);
      showFlash(`🏁 퇴근 완료! 근무 ${workTime}`);
    } catch (err) {
      showFlash(`전송 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openMovePanel = () => {
    setMoveLocation(location);
    setMoveCustom('');
    setShowMovePanel(true);
  };

  const handleMove = async () => {
    const dest = moveLocation === '기타(직접입력)' ? moveCustom.trim() : moveLocation;
    if (!dest) return showFlash('이동할 지역을 선택해주세요.');
    if (dest === location) return showFlash('현재 지역과 동일합니다.');
    const fromLocation = location;
    setLoading(true);
    try {
      const time = getCurrentTime();
      const msg = buildMoveMessage(name, fromLocation, dest, time);
      await sendAttendance(msg);
      const record = { name, location: dest, previousLocation: fromLocation, type: 'move', time, date: getTodayDateStr(), timestamp: Date.now() };
      saveRecord(record);
      saveRecordToServer(record);
      setLocation(dest);
      setShowMovePanel(false);
      setRefreshKey((k) => k + 1);
      showFlash(`🚗 이동 완료! ${fromLocation} → ${dest}`);
    } catch (err) {
      showFlash(`전송 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getOneMonthLater = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleScheduleSave = async () => {
    if (scheduleEndDate < scheduleStartDate) return showFlash('종료일이 시작일보다 빠릅니다.');
    if (scheduleType !== 'vacation' && !scheduleLocation.trim()) return showFlash('장소를 입력해주세요.');
    setLoading(true);
    try {
      await saveSchedule({
        name,
        type: scheduleType,
        subType: scheduleType === 'vacation' ? scheduleSubType : null,
        location: scheduleType !== 'vacation' ? scheduleLocation.trim() : null,
        startDate: scheduleStartDate,
        endDate: scheduleEndDate,
      });
      setShowSchedulePanel(false);
      setRefreshKey((k) => k + 1);
      const label = { vacation: '휴가', business_trip: '출장', field_work: '외근' }[scheduleType];
      showFlash(`📋 ${label} 일정이 등록되었습니다.`);
    } catch (err) {
      showFlash(`등록 실패: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setName(trimmed);
    setNameConfirmed(true);
    onNameConfirmed?.(trimmed, location);
  };

  if (showHistory) {
    return <AttendanceHistory onClose={closeHistory} />;
  }

  if (!nameConfirmed) {
    return (
      <div className="app-container">
        <div className="card name-setup-card">
          <div className="name-setup-icon">👤</div>
          <h2>이름 입력</h2>
          <p>이름을 입력해주세요</p>
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
        {onLogout && (
          <button className="btn-logout" onClick={onLogout}>로그아웃</button>
        )}
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
            className="btn-attendance btn-move"
            onClick={openMovePanel}
            disabled={loading || !checkin}
          >
            🚗 이동
          </button>
          <button
            className={`btn-attendance btn-checkout${checkout ? ' btn-done' : ''}`}
            onClick={handleCheckout}
            disabled={loading || !checkin || !!checkout}
          >
            {loading && checkin && !checkout ? '⏳' : checkout ? '🏁 퇴근완료' : '퇴근'}
          </button>
        </div>

        {showMovePanel && (
          <div className="move-panel">
            <p className="move-panel-label">이동할 지역 선택</p>
            <select
              value={moveLocation}
              onChange={(e) => setMoveLocation(e.target.value)}
              className="location-select"
            >
              {locationOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {moveLocation === '기타(직접입력)' && (
              <input
                type="text"
                value={moveCustom}
                onChange={(e) => setMoveCustom(e.target.value)}
                placeholder="지역명 입력"
                className="custom-input"
                onKeyDown={(e) => e.key === 'Enter' && handleMove()}
                autoFocus
              />
            )}
            <div className="move-panel-actions">
              <button className="btn-move-confirm" onClick={handleMove} disabled={loading}>
                {loading ? '⏳' : '확인'}
              </button>
              <button className="btn-move-cancel" onClick={() => setShowMovePanel(false)}>
                취소
              </button>
            </div>
          </div>
        )}

        <div className="schedule-btn-wrap">
          <button
            className={`btn-schedule${showSchedulePanel ? ' btn-schedule-active' : ''}`}
            onClick={() => setShowSchedulePanel((v) => !v)}
          >
            📋 일정 등록
          </button>
        </div>

        {showSchedulePanel && (
          <div className="schedule-panel">
            <p className="schedule-panel-title">일정 등록</p>

            <div className="schedule-form-row">
              <label className="schedule-label">종류</label>
              <select
                className="location-select"
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value)}
              >
                <option value="vacation">🌴 휴가</option>
                <option value="business_trip">✈️ 출장</option>
                <option value="field_work">🏃 외근</option>
              </select>
            </div>

            <div className="schedule-form-row">
              <label className="schedule-label">시작일</label>
              <input
                type="date"
                className="schedule-date-input"
                value={scheduleStartDate}
                min={getTodayDateStr()}
                max={getOneMonthLater()}
                onChange={(e) => {
                  setScheduleStartDate(e.target.value);
                  if (scheduleEndDate < e.target.value) setScheduleEndDate(e.target.value);
                }}
              />
            </div>

            <div className="schedule-form-row">
              <label className="schedule-label">종료일</label>
              <input
                type="date"
                className="schedule-date-input"
                value={scheduleEndDate}
                min={scheduleStartDate}
                max={getOneMonthLater()}
                onChange={(e) => setScheduleEndDate(e.target.value)}
              />
            </div>

            {scheduleType === 'vacation' && (
              <div className="schedule-form-row">
                <label className="schedule-label">유형</label>
                <select
                  className="location-select"
                  value={scheduleSubType}
                  onChange={(e) => setScheduleSubType(e.target.value)}
                >
                  <option>연차</option>
                  <option>오전반차</option>
                  <option>오후반차</option>
                  <option>오전반반차</option>
                  <option>오후반반차</option>
                  <option>리프레쉬</option>
                  <option>해외문화체험</option>
                  <option>건강검진</option>
                </select>
              </div>
            )}

            {scheduleType !== 'vacation' && (
              <div className="schedule-form-row">
                <label className="schedule-label">장소</label>
                <input
                  type="text"
                  className="custom-input"
                  value={scheduleLocation}
                  onChange={(e) => setScheduleLocation(e.target.value)}
                  placeholder="장소를 입력하세요"
                  onKeyDown={(e) => e.key === 'Enter' && handleScheduleSave()}
                />
              </div>
            )}

            <div className="move-panel-actions">
              <button className="btn-move-confirm" onClick={handleScheduleSave} disabled={loading}>
                {loading ? '⏳' : '등록'}
              </button>
              <button className="btn-move-cancel" onClick={() => setShowSchedulePanel(false)}>
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="history-btn-wrap">
        <button className="btn-history" onClick={openHistory}>
          📅 근태 History
        </button>
      </div>

      <TeamStatus refreshKey={refreshKey} />
    </div>
  );
}
