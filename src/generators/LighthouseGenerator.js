import * as THREE from 'three';

export function createLighthouse({
  height = 28,
  baseRadius = 3.5,
  topRadius = 2.0,
  damage = 0.5,
  marbleMaterial,
} = {}) {
  const root = new THREE.Group();
  root.name = 'Lighthouse';

  const segments = Math.max(4, Math.round(8 * (1 - damage * 0.5)));
  const towerHeight = height * (1 - damage * 0.3);

  const towerGeo = new THREE.CylinderGeometry(topRadius, baseRadius, towerHeight, 16, segments);
  const tower = new THREE.Mesh(towerGeo, marbleMaterial);
  tower.position.y = towerHeight / 2;
  tower.castShadow = true;
  tower.receiveShadow = true;
  root.add(tower);

  if (damage < 0.7) {
    const lanternGeo = new THREE.CylinderGeometry(topRadius * 1.2, topRadius * 1.2, 1.5, 12, 1, true);
    const lantern = new THREE.Mesh(lanternGeo, marbleMaterial);
    lantern.position.y = towerHeight + 0.75;
    root.add(lantern);
  }

  return root;
}
