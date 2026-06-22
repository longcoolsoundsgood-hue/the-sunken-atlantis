import * as THREE from 'three';
import { createInstancedField } from '../utils/InstancedMeshFactory.js';
import { createCoralMaterial } from '../materials/CoralMaterial.js';
import { mulberry32 } from '../utils/MathUtils.js';

// ─── Procedural coral shapes ──────────────────────────────────────────────────

function branchingCoralGeo(detail = 1) {
  // Elongated dodecahedron — staghorn shape
  const g = new THREE.DodecahedronGeometry(0.45, detail);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    // Stretch upward
    p.setY(i, y * (1.0 + Math.max(0, y) * 1.8));
    // Taper sides
    const scale = 1.0 - Math.max(0, y) * 0.25;
    p.setX(i, p.getX(i) * scale);
    p.setZ(i, p.getZ(i) * scale);
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

function brainCoralGeo() {
  const g = new THREE.IcosahedronGeometry(0.7, 2);
  // Flatten slightly
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * 0.7);
  p.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

function fanCoralGeo() {
  // Thin disc — sea fan shape
  return new THREE.CylinderGeometry(0.8, 0.7, 0.08, 12, 1, false);
}

function tubeCoralGeo() {
  return new THREE.CylinderGeometry(0.12, 0.18, 1.1, 7, 3, true);
}

function cupCoralGeo() {
  return new THREE.CylinderGeometry(0.35, 0.12, 0.55, 10, 2, true);
}

function plateCoralGeo() {
  const g = new THREE.TorusGeometry(0.55, 0.09, 6, 14);
  // Flatten
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * 0.3);
  p.needsUpdate = true; g.computeVertexNormals();
  return g;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function createCoralReef({
  count       = 3000,
  areaRadius  = 480,
  seed        = 7,
  cityRadius  = 480,
} = {}) {
  const group = new THREE.Group();
  group.name = 'CoralReef';

  const variants = [
    { geo: branchingCoralGeo(0), colorIdx: 0, scale: [0.6, 2.2] },
    { geo: brainCoralGeo(),       colorIdx: 1, scale: [0.5, 1.8] },
    { geo: fanCoralGeo(),         colorIdx: 2, scale: [0.5, 1.6] },
    { geo: tubeCoralGeo(),        colorIdx: 3, scale: [0.6, 1.8] },
    { geo: cupCoralGeo(),         colorIdx: 4, scale: [0.4, 1.2] },
    { geo: plateCoralGeo(),       colorIdx: 0, scale: [0.5, 1.5] },
  ];

  const perVariant = Math.ceil(count / variants.length);
  const rng = mulberry32(seed);

  variants.forEach((v, vi) => {
    const mat = createCoralMaterial(v.colorIdx);
    const field = createInstancedField({
      geometry:  v.geo,
      material:  mat,
      count:     perVariant,
      seed:      seed + vi * 137,
      scaleRange: v.scale,
      tiltRange:  0.3,
      positionFn: (i, r) => {
        // Avoid dead centre (temple plaza) and pure radial rings
        let rx, rz;
        let attempts = 0;
        do {
          const radius = Math.sqrt(r()) * areaRadius;
          const theta  = r() * Math.PI * 2;
          rx = radius * Math.cos(theta);
          rz = radius * Math.sin(theta);
          attempts++;
        } while (Math.hypot(rx, rz) < cityRadius * 0.06 && attempts < 8);
        return [rx, 0, rz];
      },
    });
    group.add(field);
  });

  return group;
}

// Collect all coral materials for update tick
export function collectCoralMaterials(reefGroup) {
  const mats = [];
  reefGroup.traverse(c => { if (c.isMesh && c.material) mats.push(c.material); });
  return mats;
}
