import React from 'react';

const PatternGridSquare = React.memo(({ square, viewMode }) => {
  return (
    <div
      className={`gridSquare`}
      style={{ backgroundColor: square.color, border: square.outline, }}
    >
      {viewMode === 'stitch_type' && square.marking !== 'none' && (
        <span className="marking">{square.marking}</span>
      )}
    </div>
  );
});

export default PatternGridSquare;