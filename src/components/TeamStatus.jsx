import { getTeamStatus } from '../utils/storage';

export default function TeamStatus({ refreshKey }) {
  const status = getTeamStatus();

  return (
    <div className="team-status">
      <h2>오늘 팀 현황</h2>
      {status.length === 0 ? (
        <p className="empty-msg">아직 출퇴근 기록이 없습니다.</p>
      ) : (
        <div className="status-table-wrapper">
          <table className="status-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>지역</th>
                <th>출근</th>
                <th>퇴근</th>
                <th>근무시간</th>
              </tr>
            </thead>
            <tbody>
              {status.map((row) => (
                <tr key={row.name}>
                  <td className="td-name">{row.name}</td>
                  <td>{row.location}</td>
                  <td className="td-time">{row.checkin || '-'}</td>
                  <td className="td-time">{row.checkout || '-'}</td>
                  <td className="td-work">{row.workTime || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
