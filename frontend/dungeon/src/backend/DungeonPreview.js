import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function DungeonPreview({ dungeonData, onTileClick }) {

  const mountRef = useRef(null);

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

    const rows = dungeonData.length;
    const cols = dungeonData[0].length;
    const cellSize = 4;
    const height = 2;

    const gridHelper = new THREE.GridHelper(rows * cellSize, rows);
    gridHelper.position.set((cols * cellSize) / 2 - cellSize / 2, 0, (rows * cellSize) / 2 - cellSize / 2);
    scene.add(gridHelper);

    const materials = {
      "R": new THREE.MeshStandardMaterial({ color: 0xa3d9a5 }),
      "T": new THREE.MeshStandardMaterial({ color: 0xf4b6c2 }),
      "B": new THREE.MeshStandardMaterial({ color: 0xfab005 }),
      "D": new THREE.MeshStandardMaterial({ color: 0x84c5f4 }),
      "H": new THREE.MeshStandardMaterial({ color: 0xc4c4c4 }),
      "W": new THREE.MeshStandardMaterial({ color: 0x222222 }),
      "default": new THREE.MeshStandardMaterial({ color: 0xf4f4f4 })
    };

    const dungeon = new THREE.Group();
    dungeonData.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== " ") {
          const material = materials[cell] || materials["default"];
          const geometry = new THREE.BoxGeometry(cellSize, height, cellSize);
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(x * cellSize, height / 2, y * cellSize);
          dungeon.add(cube);

          // Store the grid coordinates
          cube.userData = { x, y };

          // Add interaction callback
          cube.cursor = 'pointer';
          cube.callback = () => {
            if (onTileClick) {
              onTileClick(x, y); // Pass the x, y of the clicked tile
            }
          };
        }
      });
    });

    scene.add(dungeon);
    camera.position.set((cols * cellSize) / 2, 20, (rows * cellSize) / 2);
    camera.lookAt(new THREE.Vector3((cols * cellSize) / 2, 0, (rows * cellSize) / 2));
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(dungeon.children);

      if (intersects.length > 0) {
        const clicked = intersects[0].object;
        if (clicked.callback) clicked.callback();
      }
    };

    renderer.domElement.addEventListener('click', onClick);

    const animate = function () {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      controls.dispose();
      if (mountRef.current.firstChild) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.domElement.removeEventListener('click', onClick);
    };
  }, [dungeonData]);

  return <div ref={mountRef} style={{ width: '100%', height: '80vh' }} />;
}

export default DungeonPreview;
