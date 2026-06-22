import * as THREE from 'three';
import { createDoricColumn } from './ColumnGenerator.js';

function createWallSegment(length, height, thickness, material) {
  const geo = new THREE.BoxGeometry(length, height, thickness);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createStepBlock(width, depth, height, material) {
  const geo = new THREE.BoxGeometry(width, height, depth);
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

function createKrepidoma(width, depth, steps, stepHeight, material) {
  const group = new THREE.Group();
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const w = width - t * 2.5;
    const d = depth - t * 2.5;
    const block = createStepBlock(w, d, stepHeight, material);
    block.position.y = i * stepHeight + stepHeight / 2;
    group.add(block);
  }
  return group;
}

function peristylePositions(width, depth, frontCount, sideCount, margin) {
  const halfW = width / 2 - margin;
  const halfD = depth / 2 - margin;
  const positions = [];

  for (let i = 0; i < frontCount; i++) {
    const x = -halfW + (i / (frontCount - 1)) * (2 * halfW);
    positions.push({ x, z: halfD, rotY: 0 });
    positions.push({ x, z: -halfD, rotY: Math.PI });
  }
  for (let i = 1; i < sideCount - 1; i++) {
    const z = -halfD + (i / (sideCount - 1)) * (2 * halfD);
    positions.push({ x: halfW, z, rotY: Math.PI / 2 });
    positions.push({ x: -halfW, z, rotY: -Math.PI / 2 });
  }
  return positions;
}

export function createTemple({
  width = 70,
  depth = 50,
  frontColumns = 8,
  sideColumns = 17,
  columnRadius = 0.9,
  baseHeight = 2.5,
  damage = 0.5,
  marbleMaterial,
  goldMaterial,
} = {}) {
  const root = new THREE.Group();
  root.name = 'TempleOfPoseidon';

  const columnHeight = Math.min(width, depth) * 0.18;
  const columnMargin = columnRadius * 3.0;

  const krepidoma = createKrepidoma(width + 4, depth + 4, 3, baseHeight / 3, marbleMaterial);
  root.add(krepidoma);

  const positions = peristylePositions(width, depth, frontColumns, sideColumns, columnMargin);
  positions.forEach((p, idx) => {
    const colDamage = THREE.MathUtils.clamp(damage + (Math.random() - 0.5) * 0.5, 0, 1);
    const column = createDoricColumn({ height: columnHeight, radius: columnRadius, segments: 20, damage: colDamage });
    column.position.set(p.x, baseHeight, p.z);
    column.rotation.y = p.rotY;
    column.traverse((c) => { if (c.isMesh) c.material = marbleMaterial; });
    column.name = `Column_${idx}`;
    root.add(column);
  });

  const cellaWidth = width * 0.55;
  const cellaDepth = depth * 0.7;
  const wallHeight = columnHeight * 0.95;
  const wallThickness = 0.6;

  const cellaSides = [
    { x: 0, z: cellaDepth / 2, rotY: 0, length: cellaWidth },
    { x: 0, z: -cellaDepth / 2, rotY: 0, length: cellaWidth },
    { x: cellaWidth / 2, z: 0, rotY: Math.PI / 2, length: cellaDepth },
    { x: -cellaWidth / 2, z: 0, rotY: Math.PI / 2, length: cellaDepth },
  ];
  cellaSides.forEach((s) => {
    const wall = createWallSegment(s.length, wallHeight, wallThickness, marbleMaterial);
    wall.position.set(s.x, baseHeight + wallHeight / 2, s.z);
    wall.rotation.y = s.rotY;
    root.add(wall);
  });

  const entryStairs = createKrepidoma(cellaWidth * 0.4, baseHeight * 1.8, 5, baseHeight / 5, marbleMaterial);
  entryStairs.position.set(0, 0, depth / 2 + 2.0);
  root.add(entryStairs);

  if (goldMaterial) {
    const statueGeo = new THREE.ConeGeometry(1.2, 5, 12);
    const statue = new THREE.Mesh(statueGeo, goldMaterial);
    statue.position.set(0, baseHeight + 2.5, 0);
    statue.castShadow = true;
    root.add(statue);
  }

  return root;
}
