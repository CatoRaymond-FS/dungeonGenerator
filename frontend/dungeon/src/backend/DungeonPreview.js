import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function DungeonPreview({ dungeonData = [], onTileClick }) {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraPosition = useRef(new THREE.Vector3(0, 20, 0));  // Track camera position

  // Function to save camera position to localStorage
  const saveCameraPosition = () => {
    const position = {
      x: cameraPosition.current.x,
      y: cameraPosition.current.y,
      z: cameraPosition.current.z
    };
    localStorage.setItem("cameraPosition", JSON.stringify(position));
  };

  // Function to load camera position from localStorage
  const loadCameraPosition = () => {
    const savedPosition = localStorage.getItem("cameraPosition");
    if (savedPosition) {
      const { x, y, z } = JSON.parse(savedPosition);
      return new THREE.Vector3(x, y, z);
    }
    return new THREE.Vector3(0, 20, 0); // Default position if nothing is saved
  };

  useEffect(() => {
    if (!dungeonData || dungeonData.length === 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.8;
    controls.enableZoom = false;  // Disable zoom from controls
    controls.enablePan = true;    // Allow panning
    controls.enableRotate = false; // Disable rotating

    controlsRef.current = controls;

    const rows = dungeonData.length;
    const cols = dungeonData[0].length;
    const cellSize = 4;
    const height = 2;

    const materials = {
      "R": new THREE.MeshStandardMaterial({ color: 0xa3d9a5 }),
      "T": new THREE.MeshStandardMaterial({ color: 0xf4b6c2 }),
      "B": new THREE.MeshStandardMaterial({ color: 0xfab005 }),
      "D": new THREE.MeshStandardMaterial({ color: 0x84c5f4 }),
      "H": new THREE.MeshStandardMaterial({ color: 0xc4c4c4 }),
      "W": new THREE.MeshStandardMaterial({ color: 0x222222 }),
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

    // Set initial camera position from localStorage or default position
    const initialCameraPosition = loadCameraPosition();
    console.log("Initial Camera Position:", initialCameraPosition);
    camera.position.copy(initialCameraPosition);
    cameraPosition.current = initialCameraPosition;  // Set the reference

    // Set initial target for controls to avoid snapping
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
        const { x, y } = clicked.userData;
        console.log(`Tile clicked at: (${x}, ${y})`);
        if (onTileClick) {
          onTileClick(x, y, event.button);
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', onClick);

    const animate = function () {
      requestAnimationFrame(animate);
      controls.update(); // Keep the control's state updated
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      controls.dispose();
      if (mountRef.current.firstChild) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.domElement.removeEventListener('mousedown', onClick);
    };
  }, [dungeonData, onTileClick]);

  // Function to move the camera manually and save the new position
  const moveCamera = (deltaX, deltaY) => {
    console.log(`Moving camera by: X: ${deltaX}, Y: ${deltaY}`);
    cameraPosition.current.x += deltaX;
    cameraPosition.current.z += deltaY;
    if (cameraRef.current) {
      console.log("New camera position:", cameraPosition.current);
      cameraRef.current.position.copy(cameraPosition.current);
      cameraRef.current.lookAt(new THREE.Vector3(cameraPosition.current.x, 0, cameraPosition.current.z));
      controlsRef.current.target.copy(new THREE.Vector3(cameraPosition.current.x, 0, cameraPosition.current.z)); // Update target
      saveCameraPosition(); // Save updated position to localStorage
    }
  };

  // Function to zoom the camera in and out using q and e
  const zoomCamera = (zoomIn) => {
    const zoomSpeed = 2;
    if (cameraRef.current && controlsRef.current) {
      const direction = new THREE.Vector3();
      cameraRef.current.getWorldDirection(direction); // Get the forward vector
      if (!zoomIn) {
        direction.multiplyScalar(-1); // Invert direction if zooming out
      }
      direction.multiplyScalar(zoomSpeed);
      cameraPosition.current.add(direction);
      cameraRef.current.position.copy(cameraPosition.current);
      cameraRef.current.lookAt(controlsRef.current.target);
      saveCameraPosition();
    }
  };
  

  useEffect(() => {
    const handleKeydown = (event) => {
      console.log(`Key pressed: ${event.key}`);
      if (event.key === "ArrowUp" || event.key === "w") {
        moveCamera(0, -1);
      }
      if (event.key === "ArrowDown" || event.key === "s") {
        moveCamera(0, 1);
      }
      if (event.key === "ArrowLeft" || event.key === "a") {
        moveCamera(-1, 0);
      }
      if (event.key === "ArrowRight" || event.key === "d") {
        moveCamera(1, 0);
      }
      if (event.key === "q") {
        zoomCamera(false); // Zoom out
      }
      if (event.key === "e") {
        zoomCamera(true); // Zoom in
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '80vh' }} />;
}

export default DungeonPreview;
