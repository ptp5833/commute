import { useState } from 'react';
import { getManualUser, saveManualUser } from './utils/storage';
import AttendanceForm from './components/AttendanceForm';
import './App.css';

export default function App() {
  const [manualUser, setManualUser] = useState(() => getManualUser());

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
