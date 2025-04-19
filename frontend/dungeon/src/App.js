import React, { useState, useEffect } from 'react';
import './App.css';
import DungeonPreview from './backend/DungeonPreview';

function App() {
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(10);
  const [dungeonData, setDungeonData] = useState([]);

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

  // Generate dungeon from backend
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

  return (
    <div className="App">
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

        <DungeonPreview dungeonData={dungeonData} />
      </header>
    </div>
  );
}

export default App;