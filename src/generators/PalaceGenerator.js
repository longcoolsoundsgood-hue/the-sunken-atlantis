import * as THREE from 'three';
import { createDoricColumn } from './ColumnGenerator.js';

export function createPalace({
  width = 40,
  depth = 30,
  damage = 0.6,
  marbleMaterial,
} = {}) {
  const root = new THREE.Group();
  root.name = 'RoyalPalace';

  const floorGeo = new THREE.BoxGeometry(width, 0.6, depth);
  const floor = new THREE.Mesh(floorGeo, marbleMaterial);
  floor.position.y = 0.3;
  floor.receiveShadow = true;
  root.add(floor);

  const wallHeight = 6;
  const wallThickness = 0.5;
  const perimeter = [
    { x: 0, z: depth / 2, length: width, rotY: 0 },
    { x: 0, z: -depth / 2, length: width, rotY: 0 },
    { x: width / 2, z: 0, length: depth, rotY: Math.PI / 2 },
    { x: -width / 2, z: 0, length: depth, rotY: Math.PI / 2 },
  ];

  perimeter.forEach((side) => {
    if (Math.random() < damage * 0.4) return;
    const segHeight = wallHeight * THREE.MathUtils.lerp(1.0, 0.3, damage);
    const wallGeo = new THREE.BoxGeometry(side.length, segHeight, wallThickness);
    const wall = new THREE.Mesh(wallGeo, marbleMaterial);
    wall.position.set(side.x, segHeight / 2, side.z);
    wall.rotation.y = side.rotY;
    wall.castShadow = true;
    wall.receiveShadow = true;
    root.add(wall);
  });

  const courtyardColumns = 12;
  for (let i = 0; i < courtyardColumns; i++) {
    const angle = (i / courtyardColumns) * Math.PI * 2;
    const r = Math.min(width, depth) * 0.3;
    const colDamage = THREE.MathUtils.clamp(damage + Math.random() * 0.3, 0, 1);
    const column = createDoricColumn({ height: 5.5, radius: 0.4, segments: 16, damage: colDamage });
    column.position.set(Math.cos(angle) * r, 0.6, Math.sin(angle) * r);
    column.traverse((c) => { if (c.isMesh) c.material = marbleMaterial; });
    root.add(column);
  }

  return root;
}
