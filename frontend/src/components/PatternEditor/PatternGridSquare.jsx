import React from 'react';

const PatternGridSquare = React.memo(({ square, viewMode }) => {
  return (
    <div
      className={`gridSquare ${square.isHashed ? 'hashed' : ''}`}
      style={{ backgroundColor: square.color }}
    >
      {viewMode === 'stitch_type' && square.marking !== 'none' && (
        <span className="marking">{square.marking}</span>
      )}
    </div>
  );
});

export default PatternGridSquare;