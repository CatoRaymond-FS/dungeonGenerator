import React, { useState, useEffect } from "react";
import "./App.css";
import DungeonPreview from "./backend/DungeonPreview";

const TILE_TYPES = [" ", "R", "T", "B", "D", "H"];

function App() {
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(10);
  const [dungeonData, setDungeonData] = useState([]);
  const [aiInfo, setAiInfo] = useState(null);
  const [showAiInfo, setShowAiInfo] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedDungeon = localStorage.getItem("savedDungeon");
    if (savedDungeon) setDungeonData(JSON.parse(savedDungeon));
  }, []);

  const saveDungeon = () => {
    localStorage.setItem("savedDungeon", JSON.stringify(dungeonData));
    alert("Dungeon saved successfully!");
  };

  const loadDungeon = () => {
    const savedDungeon = localStorage.getItem("savedDungeon");
    if (savedDungeon) {
      setDungeonData(JSON.parse(savedDungeon));
      alert("Dungeon loaded successfully!");
    } else alert("No saved dungeon found.");
  };

  const generateDungeonLive = () => {
    setLoading(true);
    setAiInfo(null);

    const ws = new WebSocket(
  `wss://dungeongenerator-production.up.railway.app/ws/generate_dungeon?rows=${rows}&cols=${cols}`
);


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
      console.error("WebSocket error:", err);
      setLoading(false);
      ws.close();
    };

    ws.onclose = () => setLoading(false);
  };

  const handleTileClick = (x, y, button = 0) => {
    const updated = dungeonData.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (rowIndex === y && colIndex === x) {
          if (button === 2) return " ";
          const index = TILE_TYPES.indexOf(cell);
          return TILE_TYPES[(index + 1) % TILE_TYPES.length];
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

        {/* --- Dungeon Form --- */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generateDungeonLive();
          }}
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <label>
            Rows:
            <input
              type="number"
              min={5}
              max={50}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value) || 10)}
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
              onChange={(e) => setCols(Number(e.target.value) || 10)}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Generating…" : "Generate Dungeon"}
          </button>
        </form>

        {/* --- Utility Buttons --- */}
        <div style={{ marginBottom: "1rem" }}>
          <button onClick={saveDungeon} disabled={!dungeonData.length}>
            Save Dungeon
          </button>
          <button onClick={loadDungeon}>Load Dungeon</button>
          <button
            onClick={() => setShowAiInfo((s) => !s)}
            disabled={!aiInfo}
          >
            {showAiInfo ? "Hide AI Info" : "Show AI Info"}
          </button>
        </div>

        {/* --- Dungeon Preview --- */}
        <div style={{ position: "relative", width: "100%" }}>
          <DungeonPreview
            dungeonData={dungeonData}
            onTileClick={handleTileClick}
          />

          {/* --- Controls Panel --- */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              background: "rgba(30,30,30,0.95)",
              color: "#f0f0f0",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "14px",
              maxWidth: "300px",
              border: "1px solid #8b6f4e",
            }}
          >
            <h4 style={{ margin: "0 0 6px 0", color: "#e4b86f" }}>Controls</h4>
            <ul style={{ paddingLeft: "1em", marginTop: 4 }}>
              <li>Left-click + drag: Rotate camera</li>
              <li>Right-click + drag: Pan view</li>
              <li>Scroll: Zoom in/out</li>
              <li>Click a tile: Cycle tile type</li>
              <li>Right-click tile: Clear</li>
            </ul>

            <h4 style={{ marginTop: 8, color: "#e4b86f" }}>Legend</h4>
            <ul style={{ paddingLeft: "1em", listStyle: "none" }}>
              {[
                ["#00000000", "Empty"],
                ["#001f3f", "Room (R)"],
                ["#9e2a2b", "Trap (T)"],
                ["#ffa500", "Boss (B)"],
                ["#4b0082", "Door (D)"],
                ["#555555", "Hallway (H)"],
              ].map(([color, label], i) => (
                <li key={i}>
                  <span
                    style={{
                      background: color,
                      width: 15,
                      height: 15,
                      display: "inline-block",
                      marginRight: 8,
                      border: "1px solid #555",
                    }}
                  />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* --- AI Info Panel --- */}
          {showAiInfo && aiInfo && (
            <div
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                background: "rgba(30,30,30,0.95)",
                color: "#f0f0f0",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "13px",
                width: 320,
                maxHeight: "60vh",
                overflowY: "auto",
                border: "1px solid #8b6f4e",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#e4b86f" }}>AI Debug Info</h3>
              <p style={{ margin: "6px 0" }}>
                <strong>Entropy:</strong>{" "}
                {typeof aiInfo.entropy_estimate !== "undefined"
                  ? Number(aiInfo.entropy_estimate).toFixed(4)
                  : "N/A"}
              </p>

              {aiInfo.input_noise_sample && (
                <div style={{ marginTop: 6 }}>
                  <strong>Noise sample (first 10):</strong>
                  <pre
                    style={{
                      background: "#111",
                      color: "#90ffb0",
                      padding: 8,
                      borderRadius: 6,
                      fontSize: 12,
                      overflowX: "auto",
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
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
