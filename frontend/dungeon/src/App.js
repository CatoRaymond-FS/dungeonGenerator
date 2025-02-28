import React, { useState, useEffect } from 'react';
import './App.css';
import DungeonPreview from './backend/DungeonPreview';

function App() {
  const [partyLevel, setPartyLevel] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [traps, setTraps] = useState('');
  const [boss, setBoss] = useState('');
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

  // Event Handlers for Form Inputs
  const handlePartyLevelChange = (e) => setPartyLevel(e.target.value);
  const handleRoomNumberChange = (e) => setRoomNumber(e.target.value);
  const handleTrapsChange = (e) => setTraps(e.target.value);
  const handleBossChange = (e) => setBoss(e.target.value);

  // Function to Generate Dungeon
  const generateDungeon = () => {
    const gridSize = 10; // Fixed grid size
    const dungeon = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
    const roomCount = parseInt(roomNumber, 10) || 5;
    let roomsPlaced = 0;

    while (roomsPlaced < roomCount) {
      const roomWidth = Math.floor(Math.random() * 3) + 1;
      const roomHeight = Math.floor(Math.random() * 3) + 1;
      const startX = Math.floor(Math.random() * (gridSize - roomWidth));
      const startY = Math.floor(Math.random() * (gridSize - roomHeight));

      let canPlace = true;
      for (let x = startX; x < startX + roomWidth; x++) {
        for (let y = startY; y < startY + roomHeight; y++) {
          if (dungeon[x][y] !== null) {
            canPlace = false;
            break;
          }
        }
        if (!canPlace) break;
      }

      if (canPlace) {
        for (let x = startX; x < startX + roomWidth; x++) {
          for (let y = startY; y < startY + roomHeight; y++) {
            dungeon[x][y] = 'R'; // Room
          }
        }

        // Place a door randomly
        const placeDoor = () => {
          const side = Math.floor(Math.random() * 4);
          if (side === 0 && startY > 0) dungeon[startX][startY - 1] = 'D'; // Top
          if (side === 1 && startY + roomHeight < gridSize) dungeon[startX][startY + roomHeight] = 'D'; // Bottom
          if (side === 2 && startX > 0) dungeon[startX - 1][startY] = 'D'; // Left
          if (side === 3 && startX + roomWidth < gridSize) dungeon[startX + roomWidth][startY] = 'D'; // Right
        };

        placeDoor();

        if (traps === 'yes' && Math.random() < 0.2) {
          dungeon[startX][startY] = 'T'; // Trap
        }
        if (boss === 'yes' && roomsPlaced === roomCount - 1) {
          dungeon[startX][startY] = 'B'; // Boss
        }

        roomsPlaced++;
      }
    }

    // Connect doors with hallways
    const connectDoors = (dungeon) => {
      const doors = [];
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          if (dungeon[x][y] === 'D') doors.push({ x, y });
        }
      }

      const connect = (x1, y1, x2, y2) => {
        if (x1 === x2) {
          for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            if (dungeon[x1][y] === null) dungeon[x1][y] = 'H'; // Hallway
          }
        } else if (y1 === y2) {
          for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            if (dungeon[x][y1] === null) dungeon[x][y1] = 'H'; // Hallway
          }
        }
      };

      for (let i = 1; i < doors.length; i++) {
        connect(doors[i - 1].x, doors[i - 1].y, doors[i].x, doors[i].y);
      }
    };

    connectDoors(dungeon);
    setDungeonData(dungeon);
  };

  // Check if all fields are filled
  const isFormValid = partyLevel && roomNumber && traps && boss;

  // Form Submission Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      generateDungeon();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Procedural Dungeon Generator</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Party Level:
            <input type="number" min={1} required value={partyLevel} onChange={handlePartyLevelChange} />
          </label>
          <label>
            Room Number:
            <input type="number" min={5} required value={roomNumber} onChange={handleRoomNumberChange} />
          </label>
          <label>
            Traps:
            <input type="radio" value="yes" checked={traps === 'yes'} onChange={handleTrapsChange} /> Yes
            <input type="radio" value="no" checked={traps === 'no'} onChange={handleTrapsChange} /> No
          </label>
          <label>
            Boss:
            <input type="radio" value="yes" checked={boss === 'yes'} onChange={handleBossChange} /> Yes
            <input type="radio" value="no" checked={boss === 'no'} onChange={handleBossChange} /> No
          </label>
          <button type="submit" disabled={!isFormValid}>Generate Dungeon</button>
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
