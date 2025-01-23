# Procedural Dungeon Generator

The Procedural Dungeon Generator is a React-based web application designed to create grid-based dungeon layouts for tabletop role-playing games (TTRPGs). It generates rooms, traps, bosses, hallways, and doors procedurally and displays them in an interactive preview using an HTML Canvas.

## Features

- **Customizable Parameters**: Specify the party level, number of rooms, traps, and boss presence.
- **Procedural Generation**:
  - Randomly generates rooms, hallways, doors, traps, and a boss.
  - Ensures rooms are non-overlapping and connected by hallways.
- **Visual Dungeon Preview**:
  - Interactive grid rendered using HTML Canvas.
  - Distinct labels and colors for rooms, traps, bosses, doors, and hallways.
- **Dynamic Canvas Scaling**: Adjusts automatically based on dungeon size.

## Technical Specifications

### Frontend
- **Framework**: React.js
- **Canvas Rendering**: HTML Canvas API
- **Styling**: CSS

### Procedural Generation
- **Grid-Based Algorithm**:
  - Rooms are randomly placed within a 10x10 grid.
  - Doors are randomly placed on room edges.
  - Hallways connect doors to ensure a fully navigable dungeon.
- **Cell Types**:
  - `R`: Room
  - `T`: Trap
  - `B`: Boss
  - `D`: Door
  - `H`: Hallway
  - `null`: Empty

### Tools and Libraries
- **JavaScript Framework**: React.js
- **CSS Styling**: Custom CSS
- **Git**: Version control for collaboration and tracking changes.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/CatoRaymond-FS/dungeonGenerator.git
   cd dungeonGenerator
   npm install
   npm start
   ```

## Known Issues and Future Enhancements

### Known Issues
**Hallway Overlaps**: Some hallways may cross over traps or doors unintentionally.
**Scalability**: Currently supports only a 10x10 grid.

### Future Enhancements

**Dynamic Grid Resizing**: Allow users to define the grid size.
**Interactive Editing**: Enable users to manually adjust room placements and labels.
**Export Functionality**: Allow users to save dungeon layouts as images or PDFs.
**Expanded Features**: Add environmental details like treasure, monsters, or secret doors
