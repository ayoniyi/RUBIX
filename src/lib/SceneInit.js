import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';

export default class SceneInit {
  constructor(canvasID, fov = 34) {
    this.fov = fov;
    this.canvasID = canvasID;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();
  }

  createStudioBackground() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Elegant deep studio radial vignette
    const grad = ctx.createRadialGradient(512, 420, 60, 512, 512, 650);
    grad.addColorStop(0, '#161922');
    grad.addColorStop(0.45, '#0d0f15');
    grad.addColorStop(0.85, '#07080b');
    grad.addColorStop(1, '#030406');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Perspective camera positioned for optimal 3-quarter studio portrait
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    this.camera.position.set(130, 110, 160);

    const canvas = document.getElementById(this.canvasID);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Photorealistic color & tone mapping
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.physicallyCorrectLights = true;

    // Soft shadow pipeline
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // HDR Environment map for authentic physical reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;

    // Orbit controls with smooth damping (360 degree orbit around floating cube)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 70;
    this.controls.maxDistance = 320;
    this.controls.target.set(0, 0, 0);

    // Studio Lighting Rig
    this.setupLighting();

    // Window resize handler
    this.onResize = () => this.onWindowResize();
    window.addEventListener('resize', this.onResize, false);
  }

  setupLighting() {
    // 1. Key Light: Warm, crisp directional light casting soft shadows
    const keyLight = new THREE.DirectionalLight(0xfffbf5, 2.1);
    keyLight.position.set(65, 100, 75);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 30;
    keyLight.shadow.camera.far = 300;
    keyLight.shadow.camera.left = -45;
    keyLight.shadow.camera.right = 45;
    keyLight.shadow.camera.top = 45;
    keyLight.shadow.camera.bottom = -45;
    keyLight.shadow.bias = -0.00015;
    keyLight.shadow.radius = 2.2;
    this.scene.add(keyLight);
    this.keyLight = keyLight;

    // 2. Fill Light: Soft cool-blue light balancing shadows
    const fillLight = new THREE.DirectionalLight(0x9bc0f5, 0.85);
    fillLight.position.set(-75, 45, -50);
    this.scene.add(fillLight);

    // 3. Rim / Edge Light: Highlighting cubie bevels from behind
    const rimLight = new THREE.DirectionalLight(0xfff0e0, 1.7);
    rimLight.position.set(10, 80, -90);
    this.scene.add(rimLight);

    // 4. Bottom / Under Light: Subtle illumination for the underside of the floating cube
    const underLight = new THREE.DirectionalLight(0x2a3444, 0.7);
    underLight.position.set(0, -70, 10);
    this.scene.add(underLight);

    // 5. Hemisphere Ambient Light: Subtle natural sky/ground fill
    const hemiLight = new THREE.HemisphereLight(0xedf2f7, 0x090b0e, 0.35);
    this.scene.add(hemiLight);
  }

  animate() {
    window.requestAnimationFrame(this.animate.bind(this));
    this.render();
    if (this.controls) {
      this.controls.update();
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}
