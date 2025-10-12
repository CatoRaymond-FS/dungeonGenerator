// src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import DungeonPreview from './backend/DungeonPreview';

const TILE_TYPES = [' ', 'R', 'T', 'B', 'D', 'H', 'W'];

function App() {
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(10);
  const [dungeonData, setDungeonData] = useState([]);
  const [aiInfo, setAiInfo] = useState(null);
  const [showAiInfo, setShowAiInfo] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load dungeon from local storage on app start
  useEffect(() => {
    const savedDungeon = localStorage.getItem('savedDungeon');
    if (savedDungeon) {
      setDungeonData(JSON.parse(savedDungeon));
    }
  }, []);

  // Save dungeon to local storage
  const saveDungeon = () => {
    localStorage.setItem('savedDungeon', JSON.stringify(dungeonData));
    alert('Dungeon saved successfully!');
  };

  // Load dungeon from local storage
  const loadDungeon = () => {
    const savedDungeon = localStorage.getItem('savedDungeon');
    if (savedDungeon) {
      setDungeonData(JSON.parse(savedDungeon));
      alert('Dungeon loaded successfully!');
    } else {
      alert('No saved dungeon found.');
    }
  };

  // -------------------------------
  // Live AI dungeon generation via WebSocket
  // -------------------------------
  const generateDungeonLive = () => {
    setLoading(true);
    setAiInfo(null);

    const ws = new WebSocket('ws://127.0.0.1:8000/ws/generate_dungeon');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.done) {
        setLoading(false);
        ws.close();
        return;
      }

      if (data.dungeon && data.ai_info) {
        setDungeonData(data.dungeon);
        setAiInfo(data.ai_info);
        setShowAiInfo(true);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setLoading(false);
      ws.close();
    };

    ws.onclose = () => {
      setLoading(false);
    };
  };

  // Handle tile click (left or right)
  const handleTileClick = (x, y, button = 0) => {
    const updated = dungeonData.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (rowIndex === y && colIndex === x) {
          if (button === 2) {
            return ' ';
          } else {
            const index = TILE_TYPES.indexOf(cell);
            return TILE_TYPES[(index + 1) % TILE_TYPES.length];
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            generateDungeonLive();
          }}
          style={{ marginBottom: 12 }}
        >
          <label style={{ marginRight: 8 }}>
            Rows:
            <input
              type="number"
              min={5}
              max={50}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value) || 10)}
              style={{ width: 60, marginLeft: 6 }}
              required
            />
          </label>

          <label style={{ marginRight: 12 }}>
            Columns:
            <input
              type="number"
              min={5}
              max={50}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value) || 10)}
              style={{ width: 60, marginLeft: 6 }}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Generating…' : 'Generate Dungeon'}
          </button>
        </form>

        <div style={{ marginTop: '10px', marginBottom: '18px' }}>
          <button onClick={saveDungeon} disabled={!dungeonData.length}>
            Save Dungeon
          </button>
          <button onClick={loadDungeon} style={{ marginLeft: '10px' }}>
            Load Dungeon
          </button>

          <button
            onClick={() => setShowAiInfo((s) => !s)}
            style={{ marginLeft: '12px' }}
            disabled={!aiInfo}
            title="Toggle AI debug information (entropy, input noise, etc.)"
          >
            {showAiInfo ? 'Hide AI Info' : 'Show AI Info'}
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <DungeonPreview dungeonData={dungeonData} onTileClick={handleTileClick} />

          {/* Instructions and Legend */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              background: 'rgba(0,0,0,0.75)',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              maxWidth: '300px',
            }}
          >
            <h4 style={{ margin: '0 0 6px 0' }}>Controls</h4>
            <ul style={{ paddingLeft: '1em', marginTop: 4 }}>
              <li>WASD: Move camera</li>
              <li>Q / E: Zoom in / out</li>
              <li>Click (left): Cycle tile type</li>
              <li>Right Click: Clear tile</li>
            </ul>

            <h4 style={{ marginTop: 8 }}>Legend</h4>
            <ul style={{ paddingLeft: '1em', marginTop: 6, listStyle: 'none' }}>
              <li>
                <span style={{ background: '#f4f4f4', width: 15, height: 15, display: 'inline-block', marginRight: 8 }} />
                Empty
              </li>
              <li>
                <span style={{ background: '#a3d9a5', width: 15, height: 15, display: 'inline-block', marginRight: 8 }} />
                Room (R)
              </li>
              <li>
                <span style={{ background: '#f4b6c2', width: 15, height: 15, display: 'inline-block', marginRight: 8 }} />
                Trap (T)
              </li>
              <li>
                <span style={{ background: '#fab005', width: 15, height: 15, display: 'inline-block', marginRight: 8 }} />
                Boss (B)
              </li>
              <li>
                <span style={{ background: '#84c5f4', width: 15, height: 15, display: 'inline-block', marginRight: 8 }} />
                Door (D)
              </li>
              <li>
                <span style={{ background: '#c4c4c4', width: 15, height: 15, display: 'inline-block', marginRight: 8 }} />
                Hallway (H)
              </li>
              <li>
                <span style={{ background: '#222222', width: 15, height: 15, display: 'inline-block', marginRight: 8 }} />
                Wall (W)
              </li>
            </ul>
          </div>

          {/* AI Debug Panel */}
          {showAiInfo && aiInfo && (
            <div
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(0,0,0,0.85)',
                color: '#9cffb7',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                width: 320,
                maxHeight: '60vh',
                overflowY: 'auto',
                textAlign: 'left',
              }}
            >
              <h3 style={{ marginTop: 0, color: '#fff' }}>AI Debug Info</h3>
              <p style={{ margin: '6px 0' }}>
                <strong>Entropy:</strong>{' '}
                {typeof aiInfo.entropy !== 'undefined'
                  ? Number(aiInfo.entropy).toFixed(4)
                  : typeof aiInfo.entropy_estimate !== 'undefined'
                  ? Number(aiInfo.entropy_estimate).toFixed(4)
                  : 'N/A'}
              </p>
              {aiInfo.input_noise_sample && (
                <div style={{ marginTop: 6 }}>
                  <strong>Noise sample (first 10):</strong>
                  <pre
                    style={{
                      background: '#021205',
                      color: '#7fffb3',
                      padding: 8,
                      borderRadius: 6,
                      fontSize: 12,
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(aiInfo.input_noise_sample, null, 2)}
                  </pre>
                </div>
              )}

              {aiInfo.model && (
                <p style={{ marginTop: 6 }}>
                  <strong>Model:</strong> {aiInfo.model}
                </p>
              )}

              <p style={{ marginTop: 10, color: '#ddd', fontSize: 12 }}>
                Tip: press <strong>Show AI Info</strong> right after generating a dungeon to see the live
                model output and metrics.
              </p>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
