import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform float uPhase;
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    float pulse = sin(uTime * 1.8 + uPhase) * 0.5 + 0.5;
    float bell = smoothstep(0.0, 1.0, 1.0 - (pos.y + 0.5));
    pos.xz *= 1.0 + pulse * 0.3 * bell;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  uniform vec3 uColor;
  void main() {
    float rim = pow(1.0 - abs(vNormal.z), 2.0);
    vec3 color = uColor + rim * 0.6;
    gl_FragColor = vec4(color, 0.55 + rim * 0.3);
  }
`;

export function createJellyfishMaterial(phase = 0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPhase: { value: phase },
      uColor: { value: new THREE.Color(0x8a6fd1) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

export function createJellyfish(position) {
  const geo = new THREE.SphereGeometry(0.8, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.8);
  const material = createJellyfishMaterial(Math.random() * Math.PI * 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(position);
  mesh.name = 'Jellyfish';
  return { mesh, material };
}

export function updateJellyfish(jellyfishList, time) {
  jellyfishList.forEach(({ material }) => {
    material.uniforms.uTime.value = time;
  });
}
