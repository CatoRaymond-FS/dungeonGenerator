import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function DungeonPreview({ dungeonData = [], onTileClick }) {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraPosition = useRef(new THREE.Vector3(0, 20, 0));

  // Save camera position to localStorage
  const saveCameraPosition = () => {
    const pos = cameraPosition.current;
    localStorage.setItem("cameraPosition", JSON.stringify({ x: pos.x, y: pos.y, z: pos.z }));
  };

  // Load camera position from localStorage
  const loadCameraPosition = () => {
    const saved = localStorage.getItem("cameraPosition");
    if (saved) {
      const { x, y, z } = JSON.parse(saved);
      return new THREE.Vector3(x, y, z);
    }
    return new THREE.Vector3(0, 20, 0);
  };

  useEffect(() => {
    if (!dungeonData || dungeonData.length === 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(ambientLight, directionalLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enableZoom = false; 
    controls.enablePan = true; 
    controls.enableRotate = false;
    controlsRef.current = controls;

    const cellSize = 4;
    const height = 2;

    const materials = {
      "R": new THREE.MeshStandardMaterial({ color: 0x0a3d62 }), // dark blue rooms
      "T": new THREE.MeshStandardMaterial({ color: 0xf4b6c2 }),
      "B": new THREE.MeshStandardMaterial({ color: 0xfab005 }),
      "D": new THREE.MeshStandardMaterial({ color: 0x84c5f4 }),
      "H": new THREE.MeshStandardMaterial({ color: 0xc4c4c4 }),
      "default": new THREE.MeshStandardMaterial({ color: 0xf4f4f4 }),
    };

    const dungeonGroup = new THREE.Group();

    dungeonData.forEach((row, y) => {
      row.forEach((cell, x) => {
        const geometry = new THREE.BoxGeometry(cellSize, height, cellSize);
        const material = (cell !== " ") ? (materials[cell] || materials["default"]) : new THREE.MeshBasicMaterial({ visible: false });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x * cellSize, height / 2, y * cellSize);
        cube.userData = { x, y };
        dungeonGroup.add(cube);
      });
    });

    scene.add(dungeonGroup);

    // Set camera initial position
    const initialCameraPosition = loadCameraPosition();
    camera.position.copy(initialCameraPosition);
    cameraPosition.current = initialCameraPosition;
    controls.target.copy(new THREE.Vector3(initialCameraPosition.x, 0, initialCameraPosition.z));

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(dungeonGroup.children);

      if (intersects.length > 0) {
        const clicked = intersects[0].object;
        if (onTileClick) onTileClick(clicked.userData.x, clicked.userData.y, event.button);
      }
    };

    renderer.domElement.addEventListener("mousedown", onClick);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      controls.dispose();
      renderer.domElement.removeEventListener("mousedown", onClick);
      if (mountRef.current.firstChild) mountRef.current.removeChild(renderer.domElement);
    };
  }, [dungeonData, onTileClick]);

  // Camera movement
  const moveCamera = (dx, dz) => {
    cameraPosition.current.x += dx;
    cameraPosition.current.z += dz;
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.copy(cameraPosition.current);
      controlsRef.current.target.copy(new THREE.Vector3(cameraPosition.current.x, 0, cameraPosition.current.z));
      saveCameraPosition();
    }
  };

  // Fixed zoom function
  const zoomCamera = (zoomIn) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const zoomSpeed = 1.5;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    if (!zoomIn) dir.multiplyScalar(-1);

    const newPos = camera.position.clone().add(dir.multiplyScalar(zoomSpeed));

    const distance = newPos.distanceTo(controls.target);
    if (distance < 5 || distance > 100) return;

    camera.position.copy(newPos);
    cameraPosition.current.copy(newPos);
    controls.update();
    saveCameraPosition();
  };

  useEffect(() => {
    const handleKeydown = (event) => {
      switch (event.key) {
        case "ArrowUp":
        case "w": moveCamera(0, -1); break;
        case "ArrowDown":
        case "s": moveCamera(0, 1); break;
        case "ArrowLeft":
        case "a": moveCamera(-1, 0); break;
        case "ArrowRight":
        case "d": moveCamera(1, 0); break;
        case "q": zoomCamera(false); break;
        case "e": zoomCamera(true); break;
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "80vh" }} />;
}

export default DungeonPreview;
