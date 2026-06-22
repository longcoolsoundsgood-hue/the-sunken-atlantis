import * as THREE from 'three';
import { BoidsController } from './BoidsController.js';

function createFishGeometry() {
  const geo = new THREE.ConeGeometry(0.18, 0.6, 6);
  geo.rotateZ(Math.PI / 2);
  return geo;
}

export class FishSchool {
  constructor({ count = 80, center = new THREE.Vector3(), bounds = 40, material }) {
    this.boids = new BoidsController({ count, bounds, center });
    this.mesh = new THREE.InstancedMesh(createFishGeometry(), material, count);
    this.mesh.castShadow = true;
    this.mesh.name = 'FishSchool';

    this.dummy = new THREE.Object3D();
    this.count = count;
    this.syncTransforms();
  }

  syncTransforms() {
    const { positions, velocities } = this.boids;
    for (let i = 0; i < this.count; i++) {
      this.dummy.position.copy(positions[i]);
      const dir = velocities[i].clone().normalize();
      const target = positions[i].clone().add(dir);
      this.dummy.up.set(0, 1, 0);
      this.dummy.lookAt(target);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  update(dt) {
    this.boids.update(dt);
    this.syncTransforms();
  }
}

export function createFishMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x6fa8c9,
    roughness: 0.5,
    metalness: 0.1,
  });
}
