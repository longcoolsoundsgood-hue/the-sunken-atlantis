import * as THREE from 'three';

export function createAmphitheater({
  radius = 25,
  tiers = 10,
  tierHeight = 0.6,
  tierDepth = 1.4,
  arcDegrees = 200,
  marbleMaterial,
} = {}) {
  const root = new THREE.Group();
  root.name = 'Amphitheater';

  const arc = THREE.MathUtils.degToRad(arcDegrees);
  const startAngle = -arc / 2;

  for (let t = 0; t < tiers; t++) {
    const r = radius + t * tierDepth;
    const segments = 48;
    const geo = new THREE.CylinderGeometry(r, r + tierDepth, tierHeight, segments, 1, true, startAngle, arc);
    const mesh = new THREE.Mesh(geo, marbleMaterial);
    mesh.position.y = t * tierHeight;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }

  const orchestraGeo = new THREE.CylinderGeometry(radius * 0.95, radius, 0.3, 48);
  const orchestra = new THREE.Mesh(orchestraGeo, marbleMaterial);
  orchestra.receiveShadow = true;
  root.add(orchestra);

  return root;
}
