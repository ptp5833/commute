import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../utils/msalConfig';

export default function Login() {
  const { instance } = useMsal();

  const handleLogin = async () => {
    try {
      await instance.loginPopup(loginRequest);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">🏢</div>
        <h1>근태 체크</h1>
        <p>Microsoft 계정으로 로그인하세요</p>
        <button className="btn-login" onClick={handleLogin}>
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign:'middle', marginRight:'8px'}}>
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Microsoft로 로그인
        </button>
      </div>
    </div>
  );
}
