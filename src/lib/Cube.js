import * as THREE from 'three';
import { getSharedGeometries, getSharedMaterials } from './Materials';

export default class Cube {
  constructor(xOffset, yOffset, zOffset) {
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    this.zOffset = zOffset;

    this.cubeGroup = new THREE.Group();
    this.stickers = [];

    const { cubieBody, stickerTile } = getSharedGeometries();
    const { body: sharedBodyMat, stickers: stickerMaterials } = getSharedMaterials();

    // Body chassis mesh
    this.bodyMaterial = sharedBodyMat.clone();
    this.cubeMesh = new THREE.Mesh(cubieBody, this.bodyMaterial);
    this.cubeMesh.castShadow = true;
    this.cubeMesh.receiveShadow = true;
    this.cubeMesh.userData.cube = this;
    this.cubeGroup.add(this.cubeMesh);

    // Backward-compatibility fallback
    this.uniforms = {
      opacity: {
        type: 'f',
        value: 1.0,
      },
    };

    const stickerOffset = 0.494; // slightly elevated above the 0.485 cubie face

    // Helper to create and position a sticker
    const addSticker = (material, pos, rot, name) => {
      const stickerMesh = new THREE.Mesh(stickerTile, material);
      stickerMesh.position.copy(pos);
      stickerMesh.rotation.set(rot.x, rot.y, rot.z);
      stickerMesh.castShadow = true;
      stickerMesh.receiveShadow = true;
      stickerMesh.userData.cube = this;
      stickerMesh.userData.face = name;
      this.cubeGroup.add(stickerMesh);
      this.stickers.push(stickerMesh);
    };

    // +Z: Front Face (Red)
    if (zOffset === 1) {
      addSticker(
        stickerMaterials.red,
        new THREE.Vector3(0, 0, stickerOffset),
        new THREE.Vector3(0, 0, 0),
        'front'
      );
    }

    // -Z: Back Face (Orange)
    if (zOffset === -1) {
      addSticker(
        stickerMaterials.orange,
        new THREE.Vector3(0, 0, -stickerOffset),
        new THREE.Vector3(0, Math.PI, 0),
        'back'
      );
    }

    // +Y: Top Face (White, Center tile gets official Logo)
    if (yOffset === 1) {
      const isTopCenter = xOffset === 0 && zOffset === 0;
      addSticker(
        isTopCenter ? stickerMaterials.whiteLogo : stickerMaterials.white,
        new THREE.Vector3(0, stickerOffset, 0),
        new THREE.Vector3(-Math.PI / 2, 0, 0),
        'top'
      );
    }

    // -Y: Bottom Face (Yellow)
    if (yOffset === -1) {
      addSticker(
        stickerMaterials.yellow,
        new THREE.Vector3(0, -stickerOffset, 0),
        new THREE.Vector3(Math.PI / 2, 0, 0),
        'bottom'
      );
    }

    // +X: Right Face (Blue)
    if (xOffset === 1) {
      addSticker(
        stickerMaterials.blue,
        new THREE.Vector3(stickerOffset, 0, 0),
        new THREE.Vector3(0, Math.PI / 2, 0),
        'right'
      );
    }

    // -X: Left Face (Green)
    if (xOffset === -1) {
      addSticker(
        stickerMaterials.green,
        new THREE.Vector3(-stickerOffset, 0, 0),
        new THREE.Vector3(0, -Math.PI / 2, 0),
        'left'
      );
    }

    this.cubeGroup.position.set(xOffset, yOffset, zOffset);
  }

  setHighlight(isSelected) {
    if (isSelected) {
      this.bodyMaterial.emissive.setHex(0x0ea5e9);
      this.bodyMaterial.emissiveIntensity = 0.35;
      this.cubeGroup.scale.set(1.02, 1.02, 1.02);
    } else {
      this.bodyMaterial.emissive.setHex(0x000000);
      this.bodyMaterial.emissiveIntensity = 0.0;
      this.cubeGroup.scale.set(1.0, 1.0, 1.0);
    }
  }
}
