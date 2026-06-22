import * as THREE from 'three';
import { createInstancedField } from '../utils/InstancedMeshFactory.js';

const swayVertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float sway = sin(uTime * 1.5 + pos.y * 1.2 + instanceMatrix[3][0]) * 0.15 * pos.y;
    pos.x += sway;
    pos.z += sway * 0.6;
    vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * worldPos;
  }
`;

const swayFragmentShader = `
  varying vec2 vUv;
  uniform vec3 uColorBase;
  uniform vec3 uColorTip;
  void main() {
    vec3 color = mix(uColorBase, uColorTip, vUv.y);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createSeaweedMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorBase: { value: new THREE.Color(0x0d3d2a) },
      uColorTip: { value: new THREE.Color(0x2d8f5c) },
    },
    vertexShader: swayVertexShader,
    fragmentShader: swayFragmentShader,
    side: THREE.DoubleSide,
  });
}

export function updateSeaweedTime(material, time) {
  material.uniforms.uTime.value = time;
}

export function createSeaweedField({
  count = 800,
  areaRadius = 480,
  seed = 11,
  material,
} = {}) {
  const bladeGeo = new THREE.PlaneGeometry(0.4, 3.5, 1, 6);
  bladeGeo.translate(0, 1.75, 0);

  const field = createInstancedField({
    geometry: bladeGeo,
    material: material || createSeaweedMaterial(),
    count,
    seed,
    scaleRange: [0.7, 1.5],
    tiltRange: 0.15,
    positionFn: (i, rng) => {
      const r = Math.sqrt(rng()) * areaRadius;
      const theta = rng() * Math.PI * 2;
      return [r * Math.cos(theta), 0, r * Math.sin(theta)];
    },
  });
  field.name = 'SeaweedField';
  return field;
}
