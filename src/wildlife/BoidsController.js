import * as THREE from 'three';

export class BoidsController {
  constructor({
    count,
    bounds = 60,
    center = new THREE.Vector3(),
    maxSpeed = 4,
    maxForce = 0.08,
    perception = 6,
  }) {
    this.count = count;
    this.bounds = bounds;
    this.center = center;
    this.maxSpeed = maxSpeed;
    this.maxForce = maxForce;
    this.perception = perception;

    this.positions = [];
    this.velocities = [];

    for (let i = 0; i < count; i++) {
      const p = new THREE.Vector3(
        (Math.random() - 0.5) * bounds,
        (Math.random() - 0.5) * bounds * 0.4,
        (Math.random() - 0.5) * bounds
      ).add(center);
      const v = new THREE.Vector3(
        Math.random() - 0.5,
        (Math.random() - 0.5) * 0.3,
        Math.random() - 0.5
      ).normalize().multiplyScalar(maxSpeed * 0.5);
      this.positions.push(p);
      this.velocities.push(v);
    }
  }

  update(dt) {
    const { positions, velocities, count, perception, maxForce, maxSpeed, center, bounds } = this;

    for (let i = 0; i < count; i++) {
      const sep = new THREE.Vector3();
      const ali = new THREE.Vector3();
      const coh = new THREE.Vector3();
      let neighbors = 0;

      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const dist = positions[i].distanceTo(positions[j]);
        if (dist < perception && dist > 0.001) {
          sep.add(positions[i].clone().sub(positions[j]).divideScalar(dist));
          ali.add(velocities[j]);
          coh.add(positions[j]);
          neighbors++;
        }
      }

      const accel = new THREE.Vector3();
      if (neighbors > 0) {
        sep.divideScalar(neighbors).multiplyScalar(1.5);
        ali.divideScalar(neighbors).multiplyScalar(1.0);
        coh.divideScalar(neighbors).sub(positions[i]).multiplyScalar(1.0);
        accel.add(sep).add(ali).add(coh);
      }

      const toCenter = center.clone().sub(positions[i]);
      const distFromCenter = toCenter.length();
      if (distFromCenter > bounds) {
        accel.add(toCenter.normalize().multiplyScalar(2.0));
      }

      accel.clampLength(0, maxForce);
      velocities[i].add(accel).clampLength(0, maxSpeed);
      positions[i].addScaledVector(velocities[i], dt);
    }
  }
}
