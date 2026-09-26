import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import Cube from './Cube';

export default class RubiksCube {
  constructor() {
    this.scale = 20;
    this.epsilon = 0.5;
    this.consoleDebug = true;
    this.selectedCube = null;
    this.isAnimating = false;
    this.onStateChange = null;

    this.rubiksCubeGroup = new THREE.Group();
    this.rubiksCubeGroup.scale.set(this.scale, this.scale, this.scale);

    // Initial natural display angle (slightly tilted to show top, front, and right faces)
    this.rubiksCubeGroup.rotation.x = Math.PI / 8;
    this.rubiksCubeGroup.rotation.y = -Math.PI / 4.5;

    this.initializeRubiksCube();

    const anim = (t) => {
      TWEEN.update(t);
      requestAnimationFrame(anim);
    };
    anim();
  }

  initializeRubiksCube() {
    while (this.rubiksCubeGroup.children.length > 0) {
      this.rubiksCubeGroup.remove(this.rubiksCubeGroup.children[0]);
    }

    this.cubes = [];

    // Construct 3x3x3 grid
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cube = new Cube(x, y, z);
          this.cubes.push(cube);
          this.rubiksCubeGroup.add(cube.cubeGroup);
        }
      }
    }

    // Default selection: center or corner
    this.selectedCube = this.cubes.find(
      (c) => c.xOffset === 0 && c.yOffset === 1 && c.zOffset === 0
    ) || this.cubes[0];

    if (this.selectedCube) {
      this.selectedCube.setHighlight(true);
    }
  }

  rotateLayer(targetCubes, axis, angle = Math.PI / 2, duration = 300, onDone = null) {
    if (this.isAnimating) return false;
    this.isAnimating = true;

    const start = { rotation: 0 };
    let prevRotation = 0;
    const snapMatrix = new THREE.Matrix4();

    const tween = new TWEEN.Tween(start)
      .to({ rotation: angle }, duration)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(({ rotation }) => {
        const delta = rotation - prevRotation;
        targetCubes.forEach((cube) => {
          cube.cubeGroup.position.applyAxisAngle(axis, delta);
          cube.cubeGroup.rotateOnWorldAxis(axis, delta);
        });
        prevRotation = rotation;
      })
      .onComplete(() => {
        // Snap positions to exact integers to eliminate floating point drift
        targetCubes.forEach((cube) => {
          cube.cubeGroup.position.x = Math.round(cube.cubeGroup.position.x);
          cube.cubeGroup.position.y = Math.round(cube.cubeGroup.position.y);
          cube.cubeGroup.position.z = Math.round(cube.cubeGroup.position.z);

          // Snap quaternion to exact orthogonal axes
          snapMatrix.makeRotationFromQuaternion(cube.cubeGroup.quaternion);
          const te = snapMatrix.elements;
          for (let i = 0; i < 16; i++) {
            te[i] = Math.round(te[i]);
          }
          cube.cubeGroup.quaternion.setFromRotationMatrix(snapMatrix);
        });

        this.isAnimating = false;
        if (onDone) onDone();
        if (this.onStateChange) this.onStateChange();
      });

    tween.start();
    return true;
  }

  cubeInSameY(c1, c2) {
    if (!c1 || !c2) return false;
    return Math.abs(c1.cubeGroup.position.y - c2.cubeGroup.position.y) < this.epsilon;
  }

  cubeInSameX(c1, c2) {
    if (!c1 || !c2) return false;
    return Math.abs(c1.cubeGroup.position.x - c2.cubeGroup.position.x) < this.epsilon;
  }

  cubeInSameZ(c1, c2) {
    if (!c1 || !c2) return false;
    return Math.abs(c1.cubeGroup.position.z - c2.cubeGroup.position.z) < this.epsilon;
  }

  getText(key) {
    return (
      {
        w: 'W: Rotate Col Up',
        s: 'S: Rotate Col Down',
        a: 'A: Rotate Row Left',
        d: 'D: Rotate Row Right',
        q: 'Q: Rotate Face CCW',
        e: 'E: Rotate Face CW',
      }[key] || ''
    );
  }

  displayKey(key) {
    if (this.consoleDebug) {
      console.log(
        `%c ${this.getText(key)} `,
        'background: #1e293b; color: #38bdf8; font-weight: bold; font-size: 14px; padding: 4px 8px; border-radius: 4px;'
      );
    }
  }

  rotateMove(moveKey) {
    if (!this.selectedCube || this.isAnimating) return;

    if (moveKey === 'w') {
      const axis = new THREE.Vector3(-1, 0, 0);
      const targetCubes = this.cubes.filter((c) => this.cubeInSameX(c, this.selectedCube));
      this.rotateLayer(targetCubes, axis);
    } else if (moveKey === 's') {
      const axis = new THREE.Vector3(1, 0, 0);
      const targetCubes = this.cubes.filter((c) => this.cubeInSameX(c, this.selectedCube));
      this.rotateLayer(targetCubes, axis);
    } else if (moveKey === 'a') {
      const axis = new THREE.Vector3(0, -1, 0);
      const targetCubes = this.cubes.filter((c) => this.cubeInSameY(c, this.selectedCube));
      this.rotateLayer(targetCubes, axis);
    } else if (moveKey === 'd') {
      const axis = new THREE.Vector3(0, 1, 0);
      const targetCubes = this.cubes.filter((c) => this.cubeInSameY(c, this.selectedCube));
      this.rotateLayer(targetCubes, axis);
    } else if (moveKey === 'q') {
      const axis = new THREE.Vector3(0, 0, 1);
      const targetCubes = this.cubes.filter((c) => this.cubeInSameZ(c, this.selectedCube));
      this.rotateLayer(targetCubes, axis);
    } else if (moveKey === 'e') {
      const axis = new THREE.Vector3(0, 0, -1);
      const targetCubes = this.cubes.filter((c) => this.cubeInSameZ(c, this.selectedCube));
      this.rotateLayer(targetCubes, axis);
    }
  }

  onKeyDown(event) {
    const key = event.key ? event.key.toLowerCase() : '';
    if (['w', 's', 'a', 'd', 'q', 'e'].includes(key)) {
      this.displayKey(key);
      this.rotateMove(key);
    }
  }

  highlightCubes(hitTarget) {
    if (!hitTarget) return;
    const targetCube = hitTarget.userData?.cube || hitTarget;

    this.cubes.forEach((cube) => {
      const isSelected = cube === targetCube || cube.cubeMesh === hitTarget || cube.stickers?.includes(hitTarget);
      if (isSelected) {
        this.selectedCube = cube;
        cube.setHighlight(true);
      } else {
        cube.setHighlight(false);
      }
    });

    if (this.onStateChange) this.onStateChange();
  }

  scramble(movesCount = 14, onComplete = null) {
    if (this.isAnimating) return;
    const moves = ['w', 's', 'a', 'd', 'q', 'e'];
    let remaining = movesCount;

    const doNextMove = () => {
      if (remaining <= 0) {
        if (onComplete) onComplete();
        return;
      }
      this.selectedCube = this.cubes[Math.floor(Math.random() * this.cubes.length)];
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      remaining--;

      let axis;
      let targetCubes;
      if (randomMove === 'w') {
        axis = new THREE.Vector3(-1, 0, 0);
        targetCubes = this.cubes.filter((c) => this.cubeInSameX(c, this.selectedCube));
      } else if (randomMove === 's') {
        axis = new THREE.Vector3(1, 0, 0);
        targetCubes = this.cubes.filter((c) => this.cubeInSameX(c, this.selectedCube));
      } else if (randomMove === 'a') {
        axis = new THREE.Vector3(0, -1, 0);
        targetCubes = this.cubes.filter((c) => this.cubeInSameY(c, this.selectedCube));
      } else if (randomMove === 'd') {
        axis = new THREE.Vector3(0, 1, 0);
        targetCubes = this.cubes.filter((c) => this.cubeInSameY(c, this.selectedCube));
      } else if (randomMove === 'q') {
        axis = new THREE.Vector3(0, 0, 1);
        targetCubes = this.cubes.filter((c) => this.cubeInSameZ(c, this.selectedCube));
      } else {
        axis = new THREE.Vector3(0, 0, -1);
        targetCubes = this.cubes.filter((c) => this.cubeInSameZ(c, this.selectedCube));
      }

      this.rotateLayer(targetCubes, axis, Math.PI / 2, 140, doNextMove);
    };

    doNextMove();
  }

  reset() {
    if (this.isAnimating) return;
    this.initializeRubiksCube();
    if (this.onStateChange) this.onStateChange();
  }
}
