import * as THREE from 'three';

export function createUnderwaterFog() {
  return new THREE.FogExp2(0x0a2535, 0.003);
}

export function applyDepthAttenuation(scene, camera) {
  // Simple: just keep a consistent teal fog, don't make it too dark
  scene.fog.density = 0.003;
}
