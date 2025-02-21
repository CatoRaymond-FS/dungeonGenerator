import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function DungeonPreview({ dungeonData }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!dungeonData || dungeonData.length === 0) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight * 0.8);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const light = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    const cellSize = 4;
    const geometry = new THREE.BoxGeometry(cellSize, cellSize, cellSize);
    
    // Colors for different dungeon elements
    const materials = {
      'R': new THREE.MeshStandardMaterial({ color: 0xa3d9a5 }), // Room
      'T': new THREE.MeshStandardMaterial({ color: 0xf4b6c2 }), // Trap
      'B': new THREE.MeshStandardMaterial({ color: 0xfab005 }), // Boss
      'D': new THREE.MeshStandardMaterial({ color: 0x84c5f4 }), // Door
      'H': new THREE.MeshStandardMaterial({ color: 0xc4c4c4 }), // Hallway
      'default': new THREE.MeshStandardMaterial({ color: 0xf4f4f4 }) // Empty space
    };

    dungeonData.forEach((row, y) => {
      row.forEach((cell, x) => {
        const material = materials[cell] || materials['default'];
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x * cellSize, 0, y * cellSize);
        scene.add(cube);
      });
    });

    camera.position.set(10, 15, 20);
    camera.lookAt(new THREE.Vector3(10, 0, 10));

    const animate = function () {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [dungeonData]);

  return <div ref={mountRef} style={{ textAlign: 'center', marginTop: '20px' }} />;
}

export default DungeonPreview;
