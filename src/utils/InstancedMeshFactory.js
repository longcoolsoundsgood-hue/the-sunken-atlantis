import * as THREE from 'three';
import { mulberry32, randRange } from './MathUtils.js';

export function createInstancedField({
  geometry,
  material,
  count,
  seed = 1,
  positionFn,
  scaleRange = [0.6, 1.4],
  tiltRange = 0.25,
  castShadow = true,
}) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;

  const rng = mulberry32(seed);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const [x, y, z] = positionFn(i, rng);
    const scale = randRange(rng, scaleRange[0], scaleRange[1]);
    dummy.position.set(x, y, z);
    dummy.rotation.set(
      randRange(rng, -tiltRange, tiltRange),
      randRange(rng, 0, Math.PI * 2),
      randRange(rng, -tiltRange, tiltRange)
    );
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}
