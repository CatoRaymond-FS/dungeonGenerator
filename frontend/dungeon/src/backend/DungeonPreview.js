import React from 'react';
import './DungeonPreview.css'; // Grid styles

function DungeonPreview({ dungeonData }) {
  return (
    <div className="dungeon-preview">
      <h2>Dungeon Preview</h2>
      <div className="dungeon-grid">
        {dungeonData.map((row, rowIndex) => (
          <div className="grid-row" key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <div
                className={`grid-cell ${cell === 'R' ? 'room' : cell === 'T' ? 'trap' : cell === 'B' ? 'boss' : ''}`}
                key={cellIndex}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DungeonPreview;
