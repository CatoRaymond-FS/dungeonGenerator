import React, { useState } from 'react';
import './App.css';
import DungeonPreview from './backend/DungeonPreview.js'

function App() {
  const [partyLevel, setPartyLevel] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [traps, setTraps] = useState('');
  const [boss, setBoss] = useState('');
  const [dungeonData, setDungeonData] = useState([]);

  // Handlers for input changes
  const handlePartyLevelChange = (e) => setPartyLevel(e.target.value);
  const handleRoomNumberChange = (e) => setRoomNumber(e.target.value);
  const handleTrapsChange = (e) => setTraps(e.target.value);
  const handleBossChange = (e) => setBoss(e.target.value);

  // Basic procedural generation logic for grid-based dungeon
  const generateDungeon = () => {
    const gridSize = 10; // Fixed grid size (10x10)
    const dungeon = Array.from({ length: gridSize }, () => Array(gridSize).fill(null)); // Initialize empty grid

    // Randomize room placement based on the number of rooms
    const roomCount = parseInt(roomNumber, 10) || 5; // Default to 5 rooms if no input
    let roomsPlaced = 0;

    while (roomsPlaced < roomCount) {
      const roomWidth = Math.floor(Math.random() * 3) + 1; // Random width (1-3)
      const roomHeight = Math.floor(Math.random() * 3) + 1; // Random height (1-3)
      const startX = Math.floor(Math.random() * (gridSize - roomWidth));
      const startY = Math.floor(Math.random() * (gridSize - roomHeight));

      // Ensure space is available for the room
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

      // Place the room if space is available
      if (canPlace) {
        for (let x = startX; x < startX + roomWidth; x++) {
          for (let y = startY; y < startY + roomHeight; y++) {
            dungeon[x][y] = 'R'; // Room
          }
        }

        // Add trap or boss
        if (traps === 'yes' && Math.random() < 0.2) {
          dungeon[startX][startY] = 'T'; // Trap
        }
        if (boss === 'yes' && roomsPlaced === roomCount - 1) {
          dungeon[startX][startY] = 'B'; // Boss
        }

        roomsPlaced++;
      }
    }

    setDungeonData(dungeon); // Pass grid data to state
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateDungeon();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Procedural Dungeon Generator</h1>
        <form onSubmit={handleSubmit}>
          <label className='label'>
            Party Level:
            <input
              type="number"
              min="1"
              max="20"
              required
              name="partyLevel"
              id="partyLevel"
              className="textBox"
              value={partyLevel}
              onChange={handlePartyLevelChange}
            />
          </label>
          <label className='label'>
            Room Number:
            <input
              type="number"
              min="5"
              max="50"
              required
              name="roomNumber"
              id="roomNumber"
              className="textBox"
              value={roomNumber}
              onChange={handleRoomNumberChange}
            />
          </label>
          <label className='label'>
            Traps:
            <input
              type="radio"
              name="traps"
              value="yes"
              id="trapsYes"
              checked={traps === 'yes'}
              onChange={handleTrapsChange}
            />
            <label htmlFor="trapsYes" className='label'>Yes</label>
            <input
              type="radio"
              name="traps"
              value="no"
              id="trapsNo"
              checked={traps === 'no'}
              onChange={handleTrapsChange}
            />
            <label htmlFor="trapsNo" className='label'>No</label>
          </label>
          <label className='label'>
            Boss:
            <input
              type="radio"
              name="boss"
              value="yes"
              id="bossYes"
              checked={boss === 'yes'}
              onChange={handleBossChange}
            />
            <label htmlFor="bossYes" className='label'>Yes</label>
            <input
              type="radio"
              name="boss"
              value="no"
              id="bossNo"
              checked={boss === 'no'}
              onChange={handleBossChange}
            />
            <label htmlFor="bossNo" className='label'>No</label>
          </label>
          <button type="submit" className="mainButton">Generate Dungeon</button>
        </form>

        <DungeonPreview dungeonData={dungeonData} />
      </header>
    </div>
  );
}

export default App;
