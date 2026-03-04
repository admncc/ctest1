import React from 'react';

export function StarDisplay({ rating, count, size = 'sm' }) {
  const stars = Math.round(rating || 0);
  return (
    <span className="flex flex-center gap-2" style={{ fontSize: size === 'lg' ? '18px' : '14px' }}>
      <span className="stars">
        {[1,2,3,4,5].map(i => (
          <span key={i} className={i <= stars ? 'star-filled' : 'star-empty'}>★</span>
        ))}
      </span>
      {rating ? (
        <span className="text-muted">
          {Number(rating).toFixed(1)}{count !== undefined ? ` (${count})` : ''}
        </span>
      ) : (
        <span className="text-muted text-sm">Noch keine Bewertung</span>
      )}
    </span>
  );
}

export function StarPicker({ value, onChange }) {
  const [hover, setHover] = React.useState(0);
  return (
    <span className="stars" style={{ fontSize: '28px', cursor: 'pointer' }}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          className={(hover || value) >= i ? 'star-filled' : 'star-empty'}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        >★</span>
      ))}
    </span>
  );
}
