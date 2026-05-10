import { getTeamStatus } from '../utils/storage';
import PersonCard from './PersonCard';

export default function TeamStatus({ refreshKey }) {
  const status = getTeamStatus();
  const checkinCount = status.filter((p) => p.checkin).length;

  return (
    <div className="team-status">
      <div className="team-status-header">
        <h2>오늘 팀 현황</h2>
        {checkinCount > 0 && (
          <span className="checkin-count">{checkinCount}명 출근</span>
        )}
      </div>
      {status.length === 0 ? (
        <p className="empty-msg">아직 출퇴근 기록이 없습니다.</p>
      ) : (
        <div className="person-card-list">
          {status.map((person) => (
            <PersonCard key={person.name} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
