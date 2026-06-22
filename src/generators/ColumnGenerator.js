import * as THREE from 'three';

const FLUTE_COUNT = 20;

function applyFluting(geometry, radius, fluteDepth) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 1e-5) continue;
    const angle = Math.atan2(z, x);
    const flute = Math.sin(angle * FLUTE_COUNT) * fluteDepth;
    const scale = (r - flute) / r;
    pos.setX(i, x * scale);
    pos.setZ(i, z * scale);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

function applyErosion(group, radius, damage) {
  group.traverse((child) => {
    if (!child.isMesh) return;
    const pos = child.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const nx = pos.getX(i);
      const nz = pos.getZ(i);
      const len = Math.hypot(nx, nz) || 1;
      const offset = (Math.random() * 2 - 1) * damage * radius * 0.08;
      pos.setX(i, nx + (nx / len) * offset);
      pos.setZ(i, nz + (nz / len) * offset);
    }
    pos.needsUpdate = true;
    child.geometry.computeVertexNormals();
  });
}

function applyFracture(group, shaftHeight, damage) {
  const breakFraction = 0.45 + Math.random() * 0.4;
  const breakY = shaftHeight * breakFraction * damage + shaftHeight * (1 - damage) * 0.9;

  const toRemove = [];
  group.children.forEach((child) => {
    if (child.position.y - 0.1 > breakY) toRemove.push(child);
  });
  toRemove.forEach((child) => group.remove(child));
}

export function createDoricColumn({
  height = 4.0,
  radius = 0.35,
  segments = 20,
  damage = 0.0,
} = {}) {
  const group = new THREE.Group();

  const shaftHeight = height * 0.84;
  const neckHeight = height * 0.03;
  const capitalHeight = height * 0.13;

  const shaftGeo = new THREE.CylinderGeometry(radius * 0.9, radius, shaftHeight, segments, 6, true);
  applyFluting(shaftGeo, radius, radius * 0.05);
  const shaft = new THREE.Mesh(shaftGeo);
  shaft.position.y = shaftHeight / 2;
  group.add(shaft);

  const neckGeo = new THREE.CylinderGeometry(radius * 0.95, radius * 0.9, neckHeight, segments);
  const neck = new THREE.Mesh(neckGeo);
  neck.position.y = shaftHeight + neckHeight / 2;
  group.add(neck);

  const echinusGeo = new THREE.CylinderGeometry(radius * 1.35, radius * 0.95, capitalHeight * 0.6, segments);
  const echinus = new THREE.Mesh(echinusGeo);
  echinus.position.y = shaftHeight + neckHeight + capitalHeight * 0.3;
  group.add(echinus);

  const abacusSize = radius * 2.6;
  const abacusHeight = capitalHeight * 0.4;
  const abacusGeo = new THREE.BoxGeometry(abacusSize, abacusHeight, abacusSize);
  const abacus = new THREE.Mesh(abacusGeo);
  abacus.position.y = shaftHeight + neckHeight + capitalHeight * 0.6 + abacusHeight / 2;
  group.add(abacus);

  if (damage > 0) applyErosion(group, radius, damage);
  if (damage > 0.6) applyFracture(group, shaftHeight, damage);

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}
