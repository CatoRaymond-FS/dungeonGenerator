import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function DungeonPreview({ dungeonData = [], onTileClick }) {
  const mountRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraPosition = useRef(new THREE.Vector3(0, 20, 20));

  const saveCameraPosition = () => {
    localStorage.setItem("cameraPosition", JSON.stringify(cameraPosition.current));
  };

  const loadCameraPosition = () => {
    const saved = localStorage.getItem("cameraPosition");
    if (saved) {
      const { x, y, z } = JSON.parse(saved);
      return new THREE.Vector3(x, y, z);
    }
    return new THREE.Vector3(0, 20, 20);
  };

  useEffect(() => {
    if (!dungeonData.length) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x111216, 0.02); // dark mystical fog

    // --- Background gradient / sky ---
    const topColor = new THREE.Color(0x3b0a3b);
    const bottomColor = new THREE.Color(0x0a0a1f);
    const skyGeo = new THREE.SphereGeometry(500, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: topColor },
        bottomColor: { value: bottomColor },
        offset: { value: 400 },
        exponent: { value: 0.7 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h,0.0), exponent),0.0)),1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // --- Lights ---
    const ambient = new THREE.AmbientLight(0xffe6cc, 0.5); // warm ambient
    const dirLight = new THREE.DirectionalLight(0xfff5dd, 0.9); // soft directional
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(ambient, dirLight);

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minDistance = 5;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2;
    controls.addEventListener("change", saveCameraPosition);
    controlsRef.current = controls;

    // --- Floor ---
    const rows = dungeonData.length;
    const cols = dungeonData[0].length;
    const cellSize = 3.5;
    const spacing = cellSize;

    const floorGeo = new THREE.PlaneGeometry(cols * spacing + 6, rows * spacing + 6);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x222629, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.position.set(((cols - 1) * spacing) / 2, 0, ((rows - 1) * spacing) / 2);
    scene.add(floor);

    // --- Tile materials (fantasy-themed) ---
    const materials = {
      R: new THREE.MeshStandardMaterial({ color: 0x001f3f, roughness: 0.6, metalness: 0.1 }), // dark blue rooms
      H: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 }), // stone hall
      T: new THREE.MeshStandardMaterial({ color: 0x9e2a2b, roughness: 0.7, emissive: 0x440000 }), // glowing trap
      B: new THREE.MeshStandardMaterial({ color: 0xffa500, roughness: 0.5, emissive: 0x552800 }), // boss room
      D: new THREE.MeshStandardMaterial({ color: 0x4b0082, roughness: 0.5, emissive: 0x220044 }), // magical door
      default: new THREE.MeshStandardMaterial({ color: 0xf4f4f4 }),
    };

    const tileHeight = { R: 2.4, H: 0.9, T: 0.5, B: 3.2, D: 0.8, " ": 0.05 };

    const group = new THREE.Group();
    dungeonData.forEach((row, y) => {
      row.forEach((cell, x) => {
        const type = cell || " ";
        const height = tileHeight[type];
        let mesh;

        if (type === " ") {
          const invisibleGeo = new THREE.PlaneGeometry(cellSize, cellSize);
          mesh = new THREE.Mesh(invisibleGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(x * spacing, 0.01, y * spacing);
        } else {
          const geometry = new THREE.BoxGeometry(cellSize * 0.95, height, cellSize * 0.95);
          mesh = new THREE.Mesh(geometry, materials[type] || materials.default);
          mesh.position.set(x * spacing, height / 2, y * spacing);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }

        mesh.userData = { x, y, type };
        group.add(mesh);
      });
    });
    scene.add(group);

    // --- Camera init ---
    const initial = loadCameraPosition();
    camera.position.copy(initial);
    controls.target.set(((cols - 1) * spacing) / 2, 0, ((rows - 1) * spacing) / 2);

    // --- Raycast ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(group.children);
      if (intersects.length && onTileClick) onTileClick(intersects[0].object.userData.x, intersects[0].object.userData.y, e.button);
    };
    renderer.domElement.addEventListener("mousedown", onClick);

    // --- Animate ---
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.domElement.removeEventListener("mousedown", onClick);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, [dungeonData, onTileClick]);

  return <div ref={mountRef} style={{ width: "100%", height: "80vh" }} />;
}

export default DungeonPreview;
