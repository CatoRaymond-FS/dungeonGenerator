import React, { useEffect, useRef } from 'react';

function DungeonPreview({ dungeonData }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!dungeonData || dungeonData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const cellSize = 40;

    canvas.width = dungeonData[0].length * cellSize;
    canvas.height = dungeonData.length * cellSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    dungeonData.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 'R') ctx.fillStyle = '#a3d9a5';
        else if (cell === 'T') ctx.fillStyle = '#f4b6c2';
        else if (cell === 'B') ctx.fillStyle = '#fab005';
        else if (cell === 'D') ctx.fillStyle = '#84c5f4';
        else if (cell === 'H') ctx.fillStyle = '#c4c4c4';
        else ctx.fillStyle = '#f4f4f4';

        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        if (cell === 'R') ctx.fillText('Room', x * cellSize + 5, y * cellSize + 15);
        if (cell === 'T') ctx.fillText('Trap', x * cellSize + 5, y * cellSize + 15);
        if (cell === 'B') ctx.fillText('Boss', x * cellSize + 5, y * cellSize + 15);
        if (cell === 'D') ctx.fillText('Door', x * cellSize + 5, y * cellSize + 15);
        if (cell === 'H') ctx.fillText('Hallway', x * cellSize + 5, y * cellSize + 15);
      });
    });
  }, [dungeonData]);

  return <canvas ref={canvasRef} style={{ border: '1px solid black', marginTop: '20px' }} />;
}

export default DungeonPreview;
