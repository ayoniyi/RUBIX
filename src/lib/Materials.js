import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';

// Procedural micro-texture simulating fine vinyl / molded plastic grain
function createMicroNoiseTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(256, 256);

  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = Math.floor(128 + (Math.random() - 0.5) * 16);
    imgData.data[i] = noise;
    imgData.data[i + 1] = noise;
    imgData.data[i + 2] = noise;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.needsUpdate = true;
  return texture;
}

// Procedural high-resolution authentic Rubik's brand logo for the center white face
function createRubiksLogoTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base vinyl white
  ctx.fillStyle = '#f3f4f8';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle vignette
  const grad = ctx.createRadialGradient(256, 256, 120, 256, 256, 256);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.save();
  ctx.translate(256, 256);
  // Rotate 90 degrees CCW to make typography read right-side up to the camera
  ctx.rotate(-Math.PI / 2);

  // Outer circle
  ctx.strokeStyle = '#1e2229';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 160, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle inner accent ring
  ctx.strokeStyle = '#bd0f1e';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, 146, 0, Math.PI * 2);
  ctx.stroke();

  // Mini 3x3 isometric cube icon
  ctx.save();
  ctx.translate(0, -60);
  const s = 14;
  // Top face (yellow)
  ctx.fillStyle = '#f5c300';
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.5);
  ctx.lineTo(s * 1.3, -s * 0.75);
  ctx.lineTo(0, 0);
  ctx.lineTo(-s * 1.3, -s * 0.75);
  ctx.closePath();
  ctx.fill();

  // Left face (blue)
  ctx.fillStyle = '#003fa8';
  ctx.beginPath();
  ctx.moveTo(-s * 1.3, -s * 0.75);
  ctx.lineTo(0, 0);
  ctx.lineTo(0, s * 1.5);
  ctx.lineTo(-s * 1.3, s * 0.75);
  ctx.closePath();
  ctx.fill();

  // Right face (red)
  ctx.fillStyle = '#b80c1d';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(s * 1.3, -s * 0.75);
  ctx.lineTo(s * 1.3, s * 0.75);
  ctx.lineTo(0, s * 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Typography: "RUBIK'S"
  ctx.fillStyle = '#111827';
  ctx.font =
    '900 58px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '2px';
  ctx.fillText('RUBIX', 0, 8);

  // Subtitle: "ORIGINAL"
  ctx.fillStyle = '#b80c1d';
  ctx.font =
    '800 24px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('', 0, 58);

  // Year: "EST. 1974"
  // ctx.fillStyle = '#6b7280';
  // ctx.font = '600 17px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  // ctx.fillText('EST. 1974', 0, 92);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

// Procedural soft contact shadow texture
export function createContactShadowTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 230);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.5)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

let materialsCache = null;
let geometriesCache = null;

export function getSharedGeometries() {
  if (!geometriesCache) {
    geometriesCache = {
      cubieBody: new RoundedBoxGeometry(0.97, 0.97, 0.97, 5, 0.05),
      stickerTile: new RoundedBoxGeometry(0.85, 0.85, 0.02, 4, 0.04),
    };
  }
  return geometriesCache;
}

export function getSharedMaterials() {
  if (!materialsCache) {
    const microBump = createMicroNoiseTexture();
    const logoTexture = createRubiksLogoTexture();

    // Black plastic chassis
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x101215),
      roughness: 0.36,
      metalness: 0.03,
      clearcoat: 0.25,
      clearcoatRoughness: 0.22,
      reflectivity: 0.5,
      bumpMap: microBump,
      bumpScale: 0.0003,
      envMapIntensity: 0.8,
    });

    const createStickerMaterial = (colorHex, customMap = null) => {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(colorHex),
        roughness: 0.18,
        metalness: 0.0,
        clearcoat: 0.85,
        clearcoatRoughness: 0.1,
        reflectivity: 0.7,
        bumpMap: customMap ? null : microBump,
        bumpScale: 0.0003,
        map: customMap,
        envMapIntensity: 1.1,
      });
    };

    materialsCache = {
      body: bodyMaterial,
      stickers: {
        white: createStickerMaterial(0xeef1f6),
        whiteLogo: createStickerMaterial(0xffffff, logoTexture),
        yellow: createStickerMaterial(0xf6c400),
        red: createStickerMaterial(0xb30012),
        orange: createStickerMaterial(0xff5500),
        blue: createStickerMaterial(0x0037a5),
        green: createStickerMaterial(0x00913f),
      },
    };
  }
  return materialsCache;
}
