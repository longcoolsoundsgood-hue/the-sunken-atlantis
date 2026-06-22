import * as THREE from 'three';

function createDock(length, width, material) {
  const geo = new THREE.BoxGeometry(width, 0.4, length);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createShipwreck(length, material) {
  const group = new THREE.Group();

  const hullGeo = new THREE.CylinderGeometry(0.1, length * 0.18, length, 8, 1, false);
  const hull = new THREE.Mesh(hullGeo, material);
  hull.rotation.z = Math.PI / 2;
  hull.rotation.x = (Math.random() - 0.5) * 0.4;
  hull.position.y = length * 0.1;
  hull.castShadow = true;
  group.add(hull);

  const mastGeo = new THREE.CylinderGeometry(0.15, 0.15, length * 0.6, 6);
  const mast = new THREE.Mesh(mastGeo, material);
  mast.position.set(0, length * 0.25, 0);
  mast.rotation.z = 0.6;
  group.add(mast);

  return group;
}

export function createHarbor({
  cityRadius = 240,
  dockCount = 10,
  shipwreckCount = 4,
  woodMaterial,
} = {}) {
  const root = new THREE.Group();
  root.name = 'HarborDistrict';

  const r = cityRadius * 0.82;
  for (let i = 0; i < dockCount; i++) {
    const theta = (i / dockCount) * Math.PI * 2;
    const dock = createDock(cityRadius * 0.12, cityRadius * 0.05, woodMaterial);
    dock.position.set(Math.cos(theta) * r, 0.2, Math.sin(theta) * r);
    dock.rotation.y = theta;
    root.add(dock);
  }

  for (let i = 0; i < shipwreckCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const wreckR = r + (Math.random() - 0.5) * cityRadius * 0.1;
    const ship = createShipwreck(8 + Math.random() * 6, woodMaterial);
    ship.position.set(Math.cos(theta) * wreckR, 0, Math.sin(theta) * wreckR);
    ship.rotation.y = Math.random() * Math.PI * 2;
    root.add(ship);
  }

  return root;
}
