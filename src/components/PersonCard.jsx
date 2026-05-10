const EVENT_ICON = { checkin: '✅', move: '🚗', checkout: '🏁' };

const eventDetail = (event) => {
  if (event.type === 'checkin')  return `출근 · ${event.location}`;
  if (event.type === 'move')     return `이동 · ${event.previousLocation} → ${event.location}`;
  if (event.type === 'checkout') return `퇴근 · 근무 ${event.workTime}`;
  return '';
};

export default function PersonCard({ person }) {
  return (
    <div className="person-card">
      <div className="person-card-header">
        <span className="person-name">{person.name}</span>
        <div className="person-badges">
          <span className="badge-location">📍 {person.location}</span>
          {person.workTime && (
            <span className="badge-worktime">⏱ {person.workTime}</span>
          )}
        </div>
      </div>
      <div className="person-timeline">
        {person.events.map((event, i) => (
          <div key={i} className={`tl-event tl-${event.type}`}>
            <span className="tl-icon">{EVENT_ICON[event.type]}</span>
            <span className="tl-time">{event.time}</span>
            <span className="tl-detail">{eventDetail(event)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
