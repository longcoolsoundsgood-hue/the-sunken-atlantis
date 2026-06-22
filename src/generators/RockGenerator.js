import * as THREE from 'three';
import { createInstancedField } from '../utils/InstancedMeshFactory.js';

function createRockGeometry(detail = 0) {
  const g = new THREE.IcosahedronGeometry(1.0, detail);
  const p = g.attributes.position;
  const jitter = 0.28;
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(i,
      p.getX(i) + (Math.random() - 0.5) * jitter,
      p.getY(i) * (0.5 + Math.random() * 0.5),   // flatten Y
      p.getZ(i) + (Math.random() - 0.5) * jitter
    );
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

export function createRockField({ count = 500, areaRadius = 480, seed = 19, material } = {}) {
  const geos = [createRockGeometry(0), createRockGeometry(0), createRockGeometry(0)];
  const group = new THREE.Group();
  group.name = 'RockField';

  geos.forEach((geo, gi) => {
    const f = createInstancedField({
      geometry:  geo,
      material,
      count:     Math.ceil(count / geos.length),
      seed:      seed + gi * 73,
      scaleRange: [0.6, 5.0],
      tiltRange:  0.4,
      positionFn: (i, rng) => {
        const r     = Math.sqrt(rng()) * areaRadius;
        const theta = rng() * Math.PI * 2;
        return [r * Math.cos(theta), -0.4, r * Math.sin(theta)];
      },
    });
    group.add(f);
  });

  return group;
}
