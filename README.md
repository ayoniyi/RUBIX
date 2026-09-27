# 🧊 Rubix — Photorealistic 3D Rubik's Cube

A high-performance, studio-grade 3D Rubik's Cube simulation built with **React**, **Three.js**, **Tween.js**, and **Vite**. Features physically-based rendering (PBR), procedural vinyl textures, realistic clearcoat lacquer, 5-point studio lighting, quaternion precision snapping, and an intuitive dual-input control system (keyboard + glassmorphic HUD).

---

## 🌟 Highlights

- **Photorealistic PBR Materials**: Dual-layer car-lacquer clearcoat (`clearcoat: 0.85`), micro-roughness bump mapping simulating fine injection-molded plastic grain, and authentic vinyl stickers.
- **100% Procedural & Self-Contained**: Zero external texture images or 3D models. The authentic center white face logo, micro-noise surface relief, and studio vignette background are generated entirely at runtime via Canvas2D & Three.js PMREM.
- **Precision Rotation Engine**: Matrix-based world-axis rotations animated with `@tweenjs/tween.js` easing, accompanied by floating-point drift elimination and orthogonal quaternion snapping.
- **Interactive Layer Selection**: Raycast-based cubie picker with visual emissive highlighting and live HUD coordinate tracking `[x, y, z]`.
- **Full Action Suite**: Multi-step automated scrambler (14-move sequence with dynamic delays), state reset, camera auto-rotation showcase (turntable mode), and camera view re-centering.
- **Glassmorphic Studio UI**: Sleek dark-mode interface built with Tailwind CSS, backdrop blur filters, and real-time interaction feedback.

---

## 🎮 Interactive Controls

### Keyboard Keybindings
Select any cubie by clicking it, then use the following keys to spin the corresponding layer:

| Key | Layer Action | Rotation Axis | Description |
|:---:|:---|:---:|:---|
| <kbd>W</kbd> | **Column Up** | $-X$ Axis | Rotates the selected cubie's vertical column upwards |
| <kbd>S</kbd> | **Column Down** | $+X$ Axis | Rotates the selected cubie's vertical column downwards |
| <kbd>A</kbd> | **Row Left** | $-Y$ Axis | Rotates the selected cubie's horizontal slice to the left |
| <kbd>D</kbd> | **Row Right** | $+Y$ Axis | Rotates the selected cubie's horizontal slice to the right |
| <kbd>Q</kbd> | **Face Counter-Clockwise** | $+Z$ Axis | Rotates the selected cubie's depth slice counter-clockwise |
| <kbd>E</kbd> | **Face Clockwise** | $-Z$ Axis | Rotates the selected cubie's depth slice clockwise |

### Mouse & Touch Gestures
- **Click / Tap Cubie**: Raycasts into the 3D scene and selects the targeted sub-cube (highlights in cyan with scale bump).
- **Left-Click + Drag**: 360° Orbit camera around the floating cube.
- **Right-Click + Drag**: Pan the camera in screen space.
- **Scroll Wheel / Pinch**: Zoom in / out (clamped between 70 and 320 units).
- **HUD Buttons**: Click on-screen rotation keys or action buttons (Scramble, Reset, Turntable, Reset Camera).

---

## 📐 Architecture & Mathematical Principles

### 1. Scene Graph & Coordinate Hierarchy

The 3×3×3 cube is assembled from 27 independent `Cube` instances positioned on discrete coordinates $x, y, z \in \{-1, 0, 1\}$:

```
                      +Y (White Face / Logo)
                         ▲
                         │
                         │
       (-X Green) ◄──────┼──────► (+X Blue)
                        /│
                       / │
                      ▼  ▼
            (+Z Red)     -Y (Yellow Face)
         (Back: -Z Orange)
```

```mermaid
graph TD
    Scene[Three.js Scene] --> StudioBG[Procedural Studio Vignette]
    Scene --> Env[PMREM Room Environment HDR]
    Scene --> Lights[5-Point Studio Lighting Rig]
    Scene --> RootGroup[RubiksCube Group]
    
    subgraph 27 Cubies
        RootGroup --> Cubie0[Cube (-1, -1, -1)]
        RootGroup --> CubieN[Cube (x, y, z)]
        RootGroup --> Cubie26[Cube (1, 1, 1)]
    end
    
    CubieN --> BodyMesh[Molded Black Chassis Mesh<br/>RoundedBoxGeometry]
    CubieN --> Sticker1[Beveled Sticker Tile Mesh 1]
    CubieN --> StickerM[Beveled Sticker Tile Mesh M]
```

### 2. Dynamic Layer Identification
Instead of hardcoding faces, the engine calculates rotation groups dynamically based on spatial position:
$$\text{cubie} \in \text{targetLayer} \iff |\text{cubie.position}[axis] - \text{selectedCubie.position}[axis]| < \epsilon \quad (\epsilon = 0.5)$$

This allows slicing across any selected layer whether the cube is in its initial configuration or scrambled arbitrarily.

### 3. Drift-Free Rotation & Quaternion Orthogonal Snapping
Repeated 3D rotations in floating-point math suffer from accumulative truncation error, causing cubies to misalign over time. Rubix solves this with a two-phase completion pipeline:

```javascript
// 1. Integer Position Clamping
cube.cubeGroup.position.x = Math.round(cube.cubeGroup.position.x);
cube.cubeGroup.position.y = Math.round(cube.cubeGroup.position.y);
cube.cubeGroup.position.z = Math.round(cube.cubeGroup.position.z);

// 2. Quaternion Orthogonal Matrix Quantization
snapMatrix.makeRotationFromQuaternion(cube.cubeGroup.quaternion);
const te = snapMatrix.elements;
for (let i = 0; i < 16; i++) {
  te[i] = Math.round(te[i]);
}
cube.cubeGroup.quaternion.setFromRotationMatrix(snapMatrix);
```

---

## 🎨 Material Science & Studio Lighting

### PBR Surface Pipeline
| Component | Geometry | Material Class | Visual Properties |
|:---|:---|:---|:---|
| **Chassis (Body)** | `RoundedBoxGeometry`<br/>$(0.97 \times 0.97 \times 0.97, r=0.05)$ | `MeshPhysicalMaterial` | Deep obsidian `#101215`, roughness `0.36`, clearcoat `0.25`, procedural micro-noise bump map |
| **Sticker Tiles** | `RoundedBoxGeometry`<br/>$(0.85 \times 0.85 \times 0.02, r=0.04)$ | `MeshPhysicalMaterial` | Saturated vinyl colors, high gloss clearcoat `0.85`, clearcoat roughness `0.10`, elevation offset $+0.494$ |
| **Center Logo** | Canvas 2D $(512 \times 512)$ CanvasTexture | `MeshPhysicalMaterial` | High-DPI isometric badge with "RUBIX" typography and 16x anisotropic filtering |

### 5-Point Studio Lighting Rig
1. **Key Light (`DirectionalLight`, 2.1 intensity)**: Warm white (`0xfffbf5`) casting high-definition PCF soft shadows ($2048 \times 2048$).
2. **Fill Light (`DirectionalLight`, 0.85 intensity)**: Cool daylight blue (`0x9bc0f5`) softening key light shadows.
3. **Rim Light (`DirectionalLight`, 1.7 intensity)**: Positioned behind the cube (`0xfff0e0`) to catch edge specular highlights on bevels.
4. **Under Light (`DirectionalLight`, 0.7 intensity)**: Dark navy-gray (`0x2a3444`) illuminating bottom under-surfaces.
5. **Hemisphere Ambient Light (`0.35` intensity)**: Balances natural contrast between ceiling and floor reflections.

---

## 📁 Project Structure

```bash
rubix/
├── index.html               # Entry HTML, web fonts (Plus Jakarta Sans, JetBrains Mono)
├── package.json             # NPM dependencies and build scripts
├── postcss.config.js        # PostCSS configuration for Tailwind CSS & Autoprefixer
├── tailwind.config.js       # Tailwind CSS configuration
├── vite.config.js           # Vite development and bundle configuration
└── src/
    ├── index.css            # Base styles and Tailwind utility directives
    ├── main.jsx             # React DOM root mounting and CSS import
    ├── App.jsx              # Main UI component, HUD controls, event listeners, raycasting
    └── lib/
        ├── Cube.js          # Individual cubie class (chassis, sticker meshes, highlight logic)
        ├── Materials.js     # PBR materials cache, canvas procedural textures, rounded geometries
        ├── RubiksCube.js    # 3x3x3 grid manager, rotation math, TWEEN transitions, scramble & reset
        ├── SceneInit.js     # Three.js viewport, camera setup, ACESFilmic tone mapping, OrbitControls
        └── Shaders.js       # Fallback custom GLSL vertex and fragment shader utilities
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 14.x or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone or open the repository**:
   ```bash
   cd rubix
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open the displayed URL (typically `http://localhost:3000` or `http://localhost:5173`) in any modern WebGL-compatible browser.

### Production Build

To build an optimized static production bundle:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## ⚙️ Configuration & Customization

| Parameter | Location | Default | Description |
|:---|:---|:---|:---|
| **Animation Duration** | `src/lib/RubiksCube.js` | `300ms` | Duration of single layer rotation tween (`duration = 300`) |
| **Scramble Moves** | `src/lib/RubiksCube.js` | `14` | Total number of randomized layer turns during auto-scrambling |
| **Scramble Speed** | `src/lib/RubiksCube.js` | `140ms` | Fast animation step speed during scrambling sequence |
| **Camera FOV** | `src/lib/SceneInit.js` | `34°` | Field of view providing studio telephoto portrait look |
| **Camera Position** | `src/lib/SceneInit.js` | `(130, 110, 160)` | Initial 3/4 perspective isometric viewpoint |
| **Turntable Speed** | `src/App.jsx` | `2.0` | OrbitControls auto-rotation velocity when showcase mode is enabled |

---

## 🛠️ Tech Stack

- **Core Framework**: [React 17](https://reactjs.org/)
- **3D Graphics Engine**: [Three.js r136](https://threejs.org/)
- **Animation & Tweening**: [@tweenjs/tween.js](https://github.com/tweenjs/tween.js)
- **Tooling & Dev Server**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
