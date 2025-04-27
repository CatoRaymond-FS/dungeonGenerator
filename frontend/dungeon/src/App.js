import React, { useState, useEffect } from 'react';
import './App.css';
import DungeonPreview from './backend/DungeonPreview';

const TILE_TYPES = [' ', 'R', 'T', 'B', 'D', 'H', 'W'];

function App() {
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(10);
  const [dungeonData, setDungeonData] = useState([]);

  useEffect(() => {
    const savedDungeon = localStorage.getItem('savedDungeon');
    if (savedDungeon) {
      setDungeonData(JSON.parse(savedDungeon));
    }
  }, []);

  const saveDungeon = () => {
    localStorage.setItem('savedDungeon', JSON.stringify(dungeonData));
    alert('Dungeon saved successfully!');
  };

  const loadDungeon = () => {
    const savedDungeon = localStorage.getItem('savedDungeon');
    if (savedDungeon) {
      setDungeonData(JSON.parse(savedDungeon));
      alert('Dungeon loaded successfully!');
    } else {
      alert('No saved dungeon found.');
    }
  };

  const generateDungeon = async () => {
    try {
      const params = new URLSearchParams({ rows, cols });
      const response = await fetch(`http://127.0.0.1:8000/generate_dungeon?${params}`);
      if (!response.ok) throw new Error("Failed to fetch dungeon");
      const data = await response.json();
      setDungeonData(data.dungeon);
    } catch (error) {
      console.error("Error generating dungeon:", error);
      alert("There was an error generating the dungeon.");
    }
  };

  // Handle tile click (left or right)
  const handleTileClick = (x, y, button = 0) => {
    const updated = dungeonData.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (rowIndex === y && colIndex === x) {
          if (button === 2) {
            // Right-click: clear to empty space
            return ' ';
          } else {
            // Left-click: cycle to next type
            const index = TILE_TYPES.indexOf(cell);
            const nextType = TILE_TYPES[(index + 1) % TILE_TYPES.length];
            return nextType;
          }
        }
        return cell;
      })
    );
    setDungeonData(updated);
  };

  return (
    <div className="App" onContextMenu={(e) => e.preventDefault()}>
      <header className="App-header">
        <h1>Procedural Dungeon Generator</h1>
  
        <form onSubmit={(e) => { e.preventDefault(); generateDungeon(); }}>
          <label>
            Rows:
            <input
              type="number"
              min={5}
              max={50}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              required
            />
          </label>
          <label>
            Columns:
            <input
              type="number"
              min={5}
              max={50}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              required
            />
          </label>
          <button type="submit">Generate Dungeon</button>
        </form>
  
        <div style={{ marginTop: '20px' }}>
          <button onClick={saveDungeon} disabled={!dungeonData.length}>Save Dungeon</button>
          <button onClick={loadDungeon} style={{ marginLeft: '10px' }}>Load Dungeon</button>
        </div>
  
        <div style={{ position: 'relative', width: '100%' }}>
          <DungeonPreview
            dungeonData={dungeonData}
            onTileClick={(x, y, button = 0) => handleTileClick(x, y, button)}
          />
  
          {/* Instructions and Legend */}
          <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '260px'
          }}>
            <h4>Controls</h4>
            <ul style={{ paddingLeft: '1em', marginTop: '5px' }}>
              <li>WASD: Move camera</li>
              <li>Q/E: Zoom in/out</li>
              <li>Click: Cycle tile type</li>
              <li>Right Click: Clear tile</li>
            </ul>
            <h4>Legend</h4>
  <ul style={{ paddingLeft: '1em', marginTop: '5px', listStyle: 'none' }}>
    <li><span style={{ background: '#f4f4f4', width: '15px', height: '15px', display: 'inline-block', marginRight: '8px' }}></span>Empty</li>
    <li><span style={{ background: '#a3d9a5', width: '15px', height: '15px', display: 'inline-block', marginRight: '8px' }}></span>Room (R)</li>
    <li><span style={{ background: '#f4b6c2', width: '15px', height: '15px', display: 'inline-block', marginRight: '8px' }}></span>Trap (T)</li>
    <li><span style={{ background: '#fab005', width: '15px', height: '15px', display: 'inline-block', marginRight: '8px' }}></span>Boss (B)</li>
    <li><span style={{ background: '#84c5f4', width: '15px', height: '15px', display: 'inline-block', marginRight: '8px' }}></span>Door (D)</li>
    <li><span style={{ background: '#c4c4c4', width: '15px', height: '15px', display: 'inline-block', marginRight: '8px' }}></span>Hallway (H)</li>
    <li><span style={{ background: '#222222', width: '15px', height: '15px', display: 'inline-block', marginRight: '8px' }}></span>Wall (W)</li>
  </ul>
          </div>
        </div>
  
      </header>
    </div>
  );
  
}

export default App;
