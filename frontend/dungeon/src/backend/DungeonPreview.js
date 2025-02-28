import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function DungeonPreview() {
  const mountRef = useRef(null);
  const [dungeonData, setDungeonData] = useState([]);

  // Function to fetch AI-generated dungeon
  const fetchDungeon = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/generate_dungeon");
      if (!response.ok) throw new Error("Failed to fetch dungeon");
      const data = await response.json();
      setDungeonData(data.dungeon);
    } catch (error) {
      console.error("Error fetching AI dungeon:", error);
    }
  };

  // Fetch dungeon on load
  useEffect(() => {
    fetchDungeon();
  }, []);

  useEffect(() => {
    if (!dungeonData.length) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Camera Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.8;

    // Dungeon Layout Variables
    const rows = dungeonData.length;
    const cols = dungeonData[0].length;
    const cellSize = 4;
    const height = 2;

    // Dungeon Grid Helper
    const gridHelper = new THREE.GridHelper(rows * cellSize, rows);
    gridHelper.position.set((cols * cellSize) / 2 - cellSize / 2, 0, (rows * cellSize) / 2 - cellSize / 2);
    scene.add(gridHelper);

    // Materials for Different Dungeon Elements
    const materials = {
      'R': new THREE.MeshStandardMaterial({ color: 0xa3d9a5 }), // Room
      'T': new THREE.MeshStandardMaterial({ color: 0xf4b6c2 }), // Trap
      'B': new THREE.MeshStandardMaterial({ color: 0xfab005 }), // Boss
      'D': new THREE.MeshStandardMaterial({ color: 0x84c5f4 }), // Door
      'H': new THREE.MeshStandardMaterial({ color: 0xc4c4c4 }), // Hallway
      'W': new THREE.MeshStandardMaterial({ color: 0x222222 }), // Walls
      'default': new THREE.MeshStandardMaterial({ color: 0xf4f4f4 }) // Empty space
    };

    // Generate Dungeon Layout
    const dungeon = new THREE.Group();
    dungeonData.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== ' ') {
          const material = materials[cell] || materials['default'];
          const geometry = new THREE.BoxGeometry(cellSize, height, cellSize);
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(x * cellSize, height / 2, y * cellSize);
          dungeon.add(cube);
        }
      });
    });

    scene.add(dungeon);

    // Center Camera
    camera.position.set((cols * cellSize) / 2, 20, (rows * cellSize) / 2);
    camera.lookAt(new THREE.Vector3((cols * cellSize) / 2, 0, (rows * cellSize) / 2));

    // Render Loop
    const animate = function () {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      controls.dispose();
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [dungeonData]);

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <button onClick={fetchDungeon} style={{ padding: '10px 20px', fontSize: '16px', marginBottom: '10px' }}>
        Generate New Dungeon
      </button>
      <div ref={mountRef} />
    </div>
  );
}

export default DungeonPreview;
