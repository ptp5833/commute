import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import Login from './components/Login';
import AttendanceForm from './components/AttendanceForm';
import './App.css';

export default function App() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts, inProgress } = useMsal();

  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="splash">
        <div className="splash-spinner" />
        <p>로그인 중...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const account = accounts[0];
  const msalName = account?.name || '';

  return (
    <AttendanceForm
      msalName={msalName}
      onLogout={() => instance.logoutPopup()}
    />
  );
}
