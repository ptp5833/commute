import { useState, useEffect } from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { initTeams, isInTeams, getTeamsUser } from './utils/teamsUtils';
import { getManualUser, saveManualUser } from './utils/storage';
import Login from './components/Login';
import AttendanceForm from './components/AttendanceForm';
import './App.css';

export default function App() {
  const [teamsUser, setTeamsUser] = useState(null);
  const [teamsReady, setTeamsReady] = useState(false);
  const [manualUser, setManualUser] = useState(null);
  const [manualMode, setManualMode] = useState(false);

  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts, inProgress } = useMsal();

  useEffect(() => {
    const saved = getManualUser();
    if (saved) setManualUser(saved);

    initTeams().then(async (inTeams) => {
      if (inTeams) {
        const user = await getTeamsUser();
        setTeamsUser(user);
      }
      setTeamsReady(true);
    });
  }, []);

  const isLoading = !teamsReady || inProgress !== InteractionStatus.None;

  if (isLoading) {
    return (
      <div className="splash">
        <div className="splash-spinner" />
        <p>로딩 중...</p>
      </div>
    );
  }

  // Teams 환경 — 팝업 없이 Teams 컨텍스트 사용
  if (isInTeams()) {
    const name = teamsUser?.name || teamsUser?.email || '';
    return <AttendanceForm msalName={name} onLogout={null} />;
  }

  // 저장된 수동 사용자 또는 수동 모드 (Teams 모바일 폴백)
  if (manualUser || manualMode) {
    return (
      <AttendanceForm
        msalName={manualUser?.name || ''}
        defaultLocation={manualUser?.location}
        initialNameConfirmed={!!(manualUser?.name)}
        onLogout={null}
        onNameConfirmed={(name, location) => {
          saveManualUser(name, location);
          setManualUser({ name, location });
        }}
      />
    );
  }

  // 브라우저 환경 — MSAL 로그인
  if (!isAuthenticated) {
    return <Login onManualMode={() => setManualMode(true)} />;
  }

  const account = accounts[0];
  return (
    <AttendanceForm
      msalName={account?.name || ''}
      onLogout={() => instance.logoutPopup()}
    />
  );
}
