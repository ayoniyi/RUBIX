import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import SceneInit from './lib/SceneInit';
import RubiksCube from './lib/RubiksCube';

function App() {
  const cubeRef = useRef(null);
  const sceneInitRef = useRef(null);
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState({ x: 0, y: 1, z: 0 });
  const [isScrambling, setIsScrambling] = useState(false);

  useEffect(() => {
    const test = new SceneInit('myThreeJsCanvas');
    test.initScene();
    test.animate();
    sceneInitRef.current = test;

    const r = new RubiksCube();
    test.scene.add(r.rubiksCubeGroup);
    cubeRef.current = r;

    // Track active selected cubie
    const updateSelectedState = () => {
      if (r.selectedCube) {
        setSelectedCoords({
          x: r.selectedCube.xOffset,
          y: r.selectedCube.yOffset,
          z: r.selectedCube.zOffset,
        });
      }
    };
    r.onStateChange = updateSelectedState;
    updateSelectedState();

    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let mouseDownPos = { x: 0, y: 0 };

    function onPointerDown(event) {
      mouseDownPos = { x: event.clientX, y: event.clientY };
    }

    function onPointerUp(event) {
      // Only select if user clicked without dragging orbit controls
      const dist = Math.hypot(
        event.clientX - mouseDownPos.x,
        event.clientY - mouseDownPos.y
      );
      if (dist > 5) return;

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, test.camera);
      // Intersect children recursively to hit stickers and body meshes
      const objects = raycaster.intersectObjects(
        r.rubiksCubeGroup.children,
        true
      );
      const cubeMeshes = objects.filter(
        (c) => c.object.type === 'Mesh' && c.object.userData?.cube
      );

      if (cubeMeshes.length > 0) {
        r.highlightCubes(cubeMeshes[0].object);
      }
    }

    const onKeyDown = (event) => {
      if (event.repeat) return;
      r.onKeyDown(event);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  // Orbit controls auto-rotate turntable mode
  useEffect(() => {
    if (sceneInitRef.current && sceneInitRef.current.controls) {
      sceneInitRef.current.controls.autoRotate = isAutoRotate;
      sceneInitRef.current.controls.autoRotateSpeed = 2.0;
    }
  }, [isAutoRotate]);

  const handleMove = (key) => {
    if (cubeRef.current) {
      cubeRef.current.displayKey(key);
      cubeRef.current.rotateMove(key);
    }
  };

  const handleScramble = () => {
    if (!cubeRef.current || isScrambling) return;
    setIsScrambling(true);
    cubeRef.current.scramble(14, () => {
      setIsScrambling(false);
    });
  };

  const handleReset = () => {
    if (!cubeRef.current || isScrambling) return;
    cubeRef.current.reset();
  };

  const handleResetCamera = () => {
    if (sceneInitRef.current) {
      sceneInitRef.current.camera.position.set(130, 110, 160);
      sceneInitRef.current.controls.target.set(0, 0, 0);
      sceneInitRef.current.controls.update();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-neutral-950 font-sans">
      {/* Three.js Canvas */}
      <canvas
        id="myThreeJsCanvas"
        className="absolute inset-0 w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Top Header Glassmorphic Bar */}
      <header className="absolute top-5 left-6 right-6 flex items-center justify-between pointer-events-none z-10">
        {/* <div className="pointer-events-auto flex items-center gap-3.5 bg-neutral-900/70 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-2xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 via-amber-500 to-sky-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <span className="text-white text-xs font-black tracking-tighter">
              3×3
            </span>
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
              RUBIK'S CUBE
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PBR Photoreal
              </span>
            </h1>
            <p className="text-xs text-neutral-400">
              Physical lacquer clearcoat & studio reflections
            </p>
          </div>
        </div> */}

        {/* Selected Cubie Coordinate Indicator */}
        <div className="pointer-events-auto hidden md:flex items-center gap-3 bg-neutral-900/70 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-xl text-xs text-neutral-300">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
          <span>Selected Cubie:</span>
          <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white font-medium">
            [{selectedCoords.x}, {selectedCoords.y}, {selectedCoords.z}]
          </span>
        </div>
      </header>

      {/* Bottom Action Bar */}
      <footer className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-none z-10">
        {/* Left Side: Actions */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
          <button
            onClick={handleScramble}
            disabled={isScrambling}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs tracking-wider uppercase transition-all duration-200 flex items-center gap-2 ${
              isScrambling
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-wait'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-105 active:scale-95'
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isScrambling ? 'Scrambling...' : 'Scramble'}
          </button>

          <button
            onClick={handleReset}
            disabled={isScrambling}
            className="px-4 py-2.5 rounded-xl font-medium text-xs tracking-wider uppercase transition-all duration-200 bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Reset
          </button>

          <button
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`px-4 py-2.5 rounded-xl font-medium text-xs tracking-wider uppercase transition-all duration-200 flex items-center gap-2 ${
              isAutoRotate
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-lg shadow-sky-500/20'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:scale-105 active:scale-95'
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {isAutoRotate ? 'Showcase ON' : 'Turntable'}
          </button>

          <button
            onClick={handleResetCamera}
            title="Reset Camera View"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 transition-all hover:scale-105 active:scale-95"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>

        {/* Center / Right: Interactive Rotation Controls */}
        <div className="pointer-events-auto bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex flex-col items-center gap-2">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest flex items-center justify-between w-full px-1">
            <span>Layer Rotations</span>
            <span className="text-[10px] text-neutral-500 font-mono">
              Click or Press Keys
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleMove('w')}
              className="group flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-sky-500/20 active:bg-sky-500/40 border border-white/10 hover:border-sky-500/40 transition-all hover:scale-105"
            >
              <span className="text-xs font-bold text-white group-hover:text-sky-300">
                W
              </span>
              <span className="text-[9px] text-neutral-400">▲ Col</span>
            </button>

            <button
              onClick={() => handleMove('s')}
              className="group flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-sky-500/20 active:bg-sky-500/40 border border-white/10 hover:border-sky-500/40 transition-all hover:scale-105"
            >
              <span className="text-xs font-bold text-white group-hover:text-sky-300">
                S
              </span>
              <span className="text-[9px] text-neutral-400">▼ Col</span>
            </button>

            <button
              onClick={() => handleMove('a')}
              className="group flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-sky-500/20 active:bg-sky-500/40 border border-white/10 hover:border-sky-500/40 transition-all hover:scale-105"
            >
              <span className="text-xs font-bold text-white group-hover:text-sky-300">
                A
              </span>
              <span className="text-[9px] text-neutral-400">◄ Row</span>
            </button>

            <button
              onClick={() => handleMove('d')}
              className="group flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-sky-500/20 active:bg-sky-500/40 border border-white/10 hover:border-sky-500/40 transition-all hover:scale-105"
            >
              <span className="text-xs font-bold text-white group-hover:text-sky-300">
                D
              </span>
              <span className="text-[9px] text-neutral-400">► Row</span>
            </button>

            <div className="w-[1px] h-7 bg-white/15 mx-1" />

            <button
              onClick={() => handleMove('q')}
              className="group flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-amber-500/20 active:bg-amber-500/40 border border-white/10 hover:border-amber-500/40 transition-all hover:scale-105"
            >
              <span className="text-xs font-bold text-white group-hover:text-amber-300">
                Q
              </span>
              <span className="text-[9px] text-neutral-400">↺ Face</span>
            </button>

            <button
              onClick={() => handleMove('e')}
              className="group flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-amber-500/20 active:bg-amber-500/40 border border-white/10 hover:border-amber-500/40 transition-all hover:scale-105"
            >
              <span className="text-xs font-bold text-white group-hover:text-amber-300">
                E
              </span>
              <span className="text-[9px] text-neutral-400">↻ Face</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Instructions Helper */}
      <div className="absolute top-24 right-6 pointer-events-none hidden lg:block z-10">
        <div className="bg-neutral-900/60 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl shadow-xl text-xs text-neutral-300 space-y-1.5 max-w-[220px]">
          <div className="font-semibold text-white/90 text-[11px] uppercase tracking-wider mb-1">
            Controls Guide
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Click Cubie:</span>
            <span className="text-white font-medium">Select Layer</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Left Drag:</span>
            <span className="text-white font-medium">Orbit View</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Right Drag:</span>
            <span className="text-white font-medium">Pan View</span>
          </div>
          <div className="flex justify-between text-neutral-400">
            <span>Scroll:</span>
            <span className="text-white font-medium">Zoom In/Out</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
