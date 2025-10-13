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
      `ws://127.0.0.1:8000/ws/generate_dungeon?rows=${rows}&cols=${cols}`
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
            {loading ? "Generating…" : "Generate Dungeon"}
          </button>
        </form>

        <div style={{ marginTop: "10px", marginBottom: "18px" }}>
          <button onClick={saveDungeon} disabled={!dungeonData.length}>
            Save Dungeon
          </button>
          <button onClick={loadDungeon} style={{ marginLeft: "10px" }}>
            Load Dungeon
          </button>

          <button
            onClick={() => setShowAiInfo((s) => !s)}
            style={{ marginLeft: "12px" }}
            disabled={!aiInfo}
          >
            {showAiInfo ? "Hide AI Info" : "Show AI Info"}
          </button>
        </div>

        <div style={{ position: "relative", width: "100%" }}>
          <DungeonPreview dungeonData={dungeonData} onTileClick={handleTileClick} />

          {/* Legend and Controls */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              background: "rgba(10,10,20,0.9)",
              color: "#f0e6d2",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "14px",
              maxWidth: "300px",
              fontFamily: "fantasy",
              lineHeight: 1.4,
              border: "2px solid #8b5e3c",
            }}
          >
            <h4 style={{ margin: "0 0 6px 0", color: "#f3c88e" }}>Controls</h4>
            <ul style={{ paddingLeft: "1em", marginTop: 4 }}>
              <li>Left-click + drag: Rotate camera</li>
              <li>Right-click + drag: Pan view</li>
              <li>Scroll: Zoom in/out</li>
              <li>Click a tile: Cycle tile type</li>
              <li>Right-click tile: Clear</li>
            </ul>

            <h4 style={{ marginTop: 8, color: "#f3c88e" }}>Legend</h4>
            <ul style={{ paddingLeft: "1em", marginTop: 6, listStyle: "none" }}>
              <li>
                <span
                  style={{
                    background: "#00000000",
                    width: 15,
                    height: 15,
                    display: "inline-block",
                    marginRight: 8,
                    border: "1px solid #555",
                  }}
                />
                Empty
              </li>
              <li>
                <span
                  style={{
                    background: "#001f3f",
                    width: 15,
                    height: 15,
                    display: "inline-block",
                    marginRight: 8,
                  }}
                />
                Room (R)
              </li>
              <li>
                <span
                  style={{
                    background: "#9e2a2b",
                    width: 15,
                    height: 15,
                    display: "inline-block",
                    marginRight: 8,
                  }}
                />
                Trap (T)
              </li>
              <li>
                <span
                  style={{
                    background: "#ffa500",
                    width: 15,
                    height: 15,
                    display: "inline-block",
                    marginRight: 8,
                  }}
                />
                Boss (B)
              </li>
              <li>
                <span
                  style={{
                    background: "#4b0082",
                    width: 15,
                    height: 15,
                    display: "inline-block",
                    marginRight: 8,
                  }}
                />
                Door (D)
              </li>
              <li>
                <span
                  style={{
                    background: "#555555",
                    width: 15,
                    height: 15,
                    display: "inline-block",
                    marginRight: 8,
                  }}
                />
                Hallway (H)
              </li>
            </ul>
          </div>

          {/* AI Debug Panel */}
          {showAiInfo && aiInfo && (
            <div
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                background: "rgba(10,10,20,0.9)",
                color: "#f0e6d2",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "13px",
                width: 320,
                maxHeight: "60vh",
                overflowY: "auto",
                textAlign: "left",
                fontFamily: "fantasy",
                lineHeight: 1.4,
                border: "2px solid #8b5e3c",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#f3c88e" }}>AI Debug Info</h3>
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
                      background: "#021205",
                      color: "#7fffb3",
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
