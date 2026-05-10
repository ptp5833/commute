import { useState } from 'react';
import { locationOptions } from '../constants';

export default function LocationSelector({ location, onChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState(location);
  const [customInput, setCustomInput] = useState('');

  const handleSelect = (e) => {
    const val = e.target.value;
    setSelected(val);
    if (val !== '기타(직접입력)') {
      onChange(val);
      setIsEditing(false);
    }
  };

  const handleCustomSubmit = () => {
    const trimmed = customInput.trim();
    if (trimmed) {
      onChange(trimmed);
      setIsEditing(false);
      setCustomInput('');
    }
  };

  const startEdit = () => {
    setSelected(location);
    setIsEditing(true);
  };

  if (!isEditing) {
    return (
      <div className="location-display">
        <span className="location-value">{location}</span>
        <button className="btn-edit" onClick={startEdit} title="지역 변경" aria-label="지역 변경">
          ✏️
        </button>
      </div>
    );
  }

  return (
    <div className="location-editor">
      <div className="location-editor-row">
        <select value={selected} onChange={handleSelect} className="location-select">
          {locationOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <button className="btn-cancel-edit" onClick={() => setIsEditing(false)}>✕</button>
      </div>
      {selected === '기타(직접입력)' && (
        <div className="custom-input-row">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="지역명 입력"
            className="custom-input"
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
            autoFocus
          />
          <button className="btn-confirm-input" onClick={handleCustomSubmit}>확인</button>
        </div>
      )}
    </div>
  );
}
