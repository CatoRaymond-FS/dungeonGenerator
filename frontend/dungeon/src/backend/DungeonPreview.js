import React, { useEffect, useRef } from 'react';
import jsPDF from 'jspdf';

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

  // Function to Export Canvas as PNG
  const exportToPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'dungeon.png';
    link.click();
  };

  // Function to Export Canvas as PDF
  const exportToPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape'); // Landscape mode
    pdf.addImage(image, 'PNG', 10, 10, 280, 150); // Adjust size
    pdf.save('dungeon.pdf');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <canvas ref={canvasRef} style={{ border: '1px solid black' }} />
      <div style={{ marginTop: '10px' }}>
        <button onClick={exportToPNG} style={{ marginRight: '10px' }}>Export as PNG</button>
        <button onClick={exportToPDF}>Export as PDF</button>
      </div>
    </div>
  );
}

export default DungeonPreview;
